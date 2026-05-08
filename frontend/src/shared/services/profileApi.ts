import axios from 'axios';
import { API_BASE_URL } from '../config/apiClient';

// Simplified environment resolution that won't reference import.meta in Jest tests.
// In browser (Vite), import.meta.env will be inlined at build time; during Jest tests we rely on process.env.
// We avoid optional chaining directly on import.meta to prevent syntax parse issues under Jest.
// @ts-ignore - declared for Vite build-time replacement; undefined during Jest tests
declare const importMetaEnv: any;
const rawBase = ((globalThis as any)?.process?.env?.VITE_API_URL) ||
  import.meta.env.VITE_API_URL ||
  API_BASE_URL;
const NORMALIZED_BASE = rawBase.replace(/\/+$/, '');

const client = axios.create({ baseURL: NORMALIZED_BASE });

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export type ProfilePayload = {
  displayName?: string;
  photoUrl?: string;
  bio?: string;
  education?: { program?: string; yearLevel?: string; major?: string; role?: 'student' | 'instructor' };
  coursesNeeded?: string[];
  interests?: string[];
  learningGoals?: string;
  timezone?: string;
  contactPreferences?: Array<'email' | 'in_app'>;
  privacy?: Partial<{
    bio: 'public' | 'mentors' | 'private';
    education: 'public' | 'mentors' | 'private';
    interests: 'public' | 'mentors' | 'private';
    learningGoals: 'public' | 'mentors' | 'private';
    coursesNeeded: 'public' | 'mentors' | 'private';
    contact: 'public' | 'mentors' | 'private';
    photo: 'public' | 'mentors' | 'private';
    displayName: 'public' | 'mentors' | 'private';
  }>;
};

export const getMyProfile = async () => {
  const res = await client.get('/profile/me', { headers: authHeaders() });
  return res.data;
};

export const updateMyProfile = async (profile: ProfilePayload) => {
  const res = await client.patch('/profile/me', { profile }, { headers: authHeaders() });
  return res.data;
};

export const uploadPhoto = async (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  const res = await client.post('/profile/photo', form, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
  });
  return res.data as { photoUrl: string };
};

export const uploadPhotoWithProgress = async (
  file: File,
  onProgress?: (percent: number) => void
) => {
  const form = new FormData();
  form.append('photo', file);
  const res = await client.post('/profile/photo', form, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onProgress(percent);
      }
    },
  });
  return res.data as { photoUrl: string };
};

export const getPublicProfile = async (id: string) => {
  const headers: any = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await client.get(`/profiles/${id}`, { headers });
  return res.data;
};
