export interface User {
    id: number;
    name: string;
    identity_id: string;
    is_active: boolean;
    created_at: string;
}

export type UserUpdate = { name?: string; is_active?: boolean };
