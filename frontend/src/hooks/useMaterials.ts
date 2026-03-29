import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';
import { deleteMaterial as deleteMaterialService, type MaterialsServiceError } from '../shared/services/materialsService';

// Use `importMetaEnv` to allow Jest tests to polyfill environment variables.
// For Vite builds, `importMetaEnv` is defined as `import.meta.env` in `vite.config.ts`.
declare const importMetaEnv: any;
const MATERIAL_UPLOAD_TIMEOUT_MS = (() => {
    const raw = (globalThis as any)?.process?.env?.VITE_MATERIAL_UPLOAD_TIMEOUT_MS ??
        (typeof importMetaEnv !== 'undefined' ? importMetaEnv.VITE_MATERIAL_UPLOAD_TIMEOUT_MS : undefined);
    const parsed = Number(raw ?? 60_000);
    return Number.isFinite(parsed) ? parsed : 60_000;
})();

export interface MaterialItem {
    id: string;
    title: string;
    originalName?: string;
    mimeType: string;
    fileSize: number;
    googleDriveWebViewLink?: string;
    googleDriveDownloadLink?: string;
    createdAt: string;
    sessionId?: string;
    sessionSubject?: string | null;
    sessionDate?: string | null;
    mentorName?: string | null;
    mentorEmail?: string | null;
}

export interface MaterialsMeta {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface MentorMaterialsResult {
    materials: MaterialItem[];
    meta?: MaterialsMeta | null;
}

export interface MaterialSessionOption {
    id: string;
    subject: string;
    date?: string | null;
    mentorName?: string | null;
}

export interface MenteeMaterialsResult {
    materials: MaterialItem[];
    sessions: MaterialSessionOption[];
}

const menteeMaterialsKey = ['materials', 'mentee'] as const;
const mentorMaterialsKey = ['materials', 'mentor'] as const;

const extractMaterialsArray = (response: any): MaterialItem[] => {
    const possible =
        response?.data?.data?.materials ??
        response?.data?.materials ??
        response?.data ??
        [];
    return Array.isArray(possible) ? (possible as MaterialItem[]) : [];
};

const invalidateMaterialQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['materials'] });
    queryClient.invalidateQueries({ queryKey: ['mentor', 'materials'] });
    queryClient.invalidateQueries({ queryKey: menteeMaterialsKey });
    queryClient.invalidateQueries({ queryKey: mentorMaterialsKey });
};

const removeMaterialFromCachedData = (cacheEntry: unknown, materialId: string) => {
    if (!cacheEntry || typeof cacheEntry !== 'object') {
        return cacheEntry;
    }

    const candidate = cacheEntry as { materials?: unknown };
    if (!Array.isArray(candidate.materials)) {
        return cacheEntry;
    }

    return {
        ...candidate,
        materials: candidate.materials.filter((material) => {
            if (!material || typeof material !== 'object') {
                return true;
            }
            return (material as { id?: string }).id !== materialId;
        }),
    };
};

export const useMenteeMaterials = (params?: { page?: number; limit?: number; search?: string; sessionId?: string }) => {
    return useQuery<MenteeMaterialsResult>({
        queryKey: [...menteeMaterialsKey, params ?? {}],
        queryFn: async () => {
            const response = await apiClient.get('/materials/mentee', { params });
            const materials = extractMaterialsArray(response);
            const sessions = response?.data?.data?.sessions ?? response?.data?.sessions ?? [];
            return {
                materials,
                sessions: Array.isArray(sessions) ? (sessions as MaterialSessionOption[]) : [],
            };
        },
    });
};

export const useMentorMaterials = (params?: { page?: number; limit?: number; search?: string; sessionId?: string }) => {
    return useQuery<MentorMaterialsResult>({
        queryKey: [...mentorMaterialsKey, params ?? {}],
        queryFn: async () => {
            const response = await apiClient.get('/materials/mentor', { params });
            return {
                materials: extractMaterialsArray(response),
                meta: response.data?.meta ?? response.data?.data?.meta ?? null,
            };
        },
    });
};

export const useUploadSessionMaterials = (sessionId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { files: File[]; menteeIds?: string[] }) => {
            const formData = new FormData();
            payload.files.forEach((file) => formData.append('files', file));
            if (payload.menteeIds && payload.menteeIds.length) {
                payload.menteeIds.forEach((id) => formData.append('menteeIds', id));
            }

            const response = await apiClient.post(`/materials/sessions/${sessionId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: MATERIAL_UPLOAD_TIMEOUT_MS,
            });
            return extractMaterialsArray(response);
        },
        onSuccess: () => {
            invalidateMaterialQueries(queryClient);
        },
    });
};

export const useDeleteMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation<
        { deleted: boolean },
        MaterialsServiceError,
        string,
        { materialsSnapshots: Array<[readonly unknown[], unknown]> }
    >({
        mutationFn: async (materialId: string) => {
            return deleteMaterialService(materialId);
        },
        onMutate: async (materialId: string) => {
            await queryClient.cancelQueries({ queryKey: ['materials'] });

            const materialsSnapshots = queryClient.getQueriesData({ queryKey: ['materials'] });
            materialsSnapshots.forEach(([queryKey, snapshot]) => {
                queryClient.setQueryData(queryKey, removeMaterialFromCachedData(snapshot, materialId));
            });

            return { materialsSnapshots };
        },
        onError: (_error, _materialId, context) => {
            context?.materialsSnapshots.forEach(([queryKey, snapshot]) => {
                queryClient.setQueryData(queryKey, snapshot);
            });
        },
        onSuccess: () => {
            invalidateMaterialQueries(queryClient);
        },
        onSettled: () => {
            invalidateMaterialQueries(queryClient);
        },
    });
};

