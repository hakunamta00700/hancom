/**
 * 인증 관련 타입
 */

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface TokenResponse {
    access: string;
    refresh: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "operator" | "teacher" | "student";
    organization: {
        id: string;
        name: string;
    } | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    organization_name: string;
}
