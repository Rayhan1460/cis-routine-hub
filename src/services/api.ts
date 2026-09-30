import type { ClassSession } from '../types';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  getOptions: async () => {
    const res = await fetch(`${API_BASE}/routines/options`);
    return res.json();
  },
  
  getRoutine: async (batch: string, section: string, labGroup?: string) => {
    let url = `${API_BASE}/routines/filter?batch=${batch}&section=${section}`;
    if (labGroup) {
      url += `&lab_group=${labGroup}`;
    }
    const res = await fetch(url);
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

  checkAdminSession: async () => {
    const res = await fetch(`${API_BASE}/admin/session`, { credentials: 'include' });
    return res.ok;
  },

  loginAdmin: async (password: string) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
       const text = await res.text();
       try {
           const err = JSON.parse(text);
           throw new Error(err.error || 'Login failed');
       } catch {
           throw new Error('Login failed. Server returned: ' + res.status);
       }
    }
    return res.json();
  },
  
  logoutAdmin: async () => {
    await fetch(`${API_BASE}/admin/logout`, { method: 'POST', credentials: 'include' });
  },
  
  uploadRoutine: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/routine/process`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
       const text = await res.text();
       try {
           const err = JSON.parse(text);
           throw new Error(err.error || 'Upload failed');
       } catch {
           if (res.status === 401) throw new Error('Unauthorized. Please login again.');
           throw new Error(`Upload failed. Server returned status: ${res.status}`);
       }
    }
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
    if (!res.ok) {
       const text = await res.text();
       try {
           const err = JSON.parse(text);
           throw new Error(err.error || 'Publish failed');
       } catch {
           if (res.status === 401) throw new Error('Unauthorized. Please login again.');
           throw new Error(`Publish failed. Server returned status: ${res.status}`);
       }
    }
    return res.json();
  }
};
