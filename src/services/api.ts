import type { ClassSession } from '../types';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  getOptions: async () => {
    const res = await fetch(`${API_BASE}/routines/options`);
    return res.json();
  },
  
  getRoutine: async (batch: string, section: string) => {
    const res = await fetch(`${API_BASE}/routines/filter?batch=${batch}&section=${section}`);
    return res.json() as Promise<ClassSession[]>;
  },
  
  searchRoutine: async (q: string) => {
    const res = await fetch(`${API_BASE}/routines/search?q=${q}`);
    return res.json() as Promise<ClassSession[]>;
  },
  
  getActiveMetadata: async () => {
    const res = await fetch(`${API_BASE}/routines/active`);
    if (!res.ok) return null;
    return res.json();
  },
  
  uploadRoutine: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/routine/process`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  publishRoutine: async (versionId: string) => {
    const res = await fetch(`${API_BASE}/admin/routine/publish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version_id: versionId }),
    });
    return res.json();
  }
};
