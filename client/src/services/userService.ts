import api from './api';
import type { User, UserUpdate } from '../types/user';

/** User and face-search API; bulk register uses fetch + SSE for progress. */
export interface BulkRegisterResponse {
    total_folders_scanned: number;
    success_count: number;
    failed_count: number;
    failures: Array<{ folder: string; reason: string }>;
}

export interface BulkProgressEvent {
    type: 'progress';
    current: number;
    total: number;
    name: string;
    status: 'success' | 'failed';
    reason?: string;
}

export const userService = {
    async getUsers(): Promise<User[]> {
        const response = await api.get<User[]>('/users/');
        return response.data;
    },

    async registerUser(name: string, file: File): Promise<User> {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);

        const response = await api.post<User>('/users/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async searchUser(file: File): Promise<any> {
        const formData = new FormData()
        formData.append('file', file);

        const response = await api.post('/users/search', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async registerBulkUsers(
        files: File[],
        names: string[],
        onProgress?: (event: BulkProgressEvent) => void
    ): Promise<BulkRegisterResponse> {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        names.forEach(n => formData.append('names', n));

        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/v1/users/register/bulk', {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Bulk registration failed');
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let finalResult: BulkRegisterResponse | null = null;
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
                const line = part.trim();
                if (!line.startsWith('data: ')) continue;
                const parsed = JSON.parse(line.replace('data: ', ''));
                if (parsed.type === 'progress') {
                    onProgress?.(parsed as BulkProgressEvent);
                } else if (parsed.type === 'complete') {
                    finalResult = parsed as BulkRegisterResponse;
                }
            }
        }

        return finalResult!;
    },

    async updateUser(userId: number, data: UserUpdate): Promise<User> {
        const response = await api.patch<User>(`/users/${userId}`, data);
        return response.data;
    },

    async deleteUser(userId: number): Promise<void> {
        await api.delete(`/users/${userId}`);
    },
};
