import api from './api';

export interface HealthResponse {
    status: string;
    model_loaded: boolean;
    device: string;
}

export const healthService = {
    async getHealth(): Promise<HealthResponse> {
        const response = await api.get<HealthResponse>('/health');
        return response.data;
    },
};
