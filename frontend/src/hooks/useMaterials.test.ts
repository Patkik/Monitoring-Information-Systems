jest.mock('../shared/config/apiClient', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}));

(globalThis as any).importMetaEnv = {
    VITE_MATERIAL_UPLOAD_TIMEOUT_MS: '60000',
};

import {
    useDeleteMaterial,
    useMenteeMaterials,
    useMentorMaterials,
    useUploadSessionMaterials,
} from './useMaterials';

describe('useMaterials exports', () => {
    it('exposes expected hook factories', () => {
        expect(typeof useMenteeMaterials).toBe('function');
        expect(typeof useMentorMaterials).toBe('function');
        expect(typeof useUploadSessionMaterials).toBe('function');
        expect(typeof useDeleteMaterial).toBe('function');
    });
});

