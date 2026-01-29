/**
 * API 클라이언트
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface ApiError {
    detail?: string;
    [key: string]: any;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                detail: `HTTP ${response.status}: ${response.statusText}`,
            }));
            throw new Error(error.detail || "API 요청 실패");
        }

        return response.json();
    }

    private getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("access_token");
    }

    setToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem("access_token", token);
    }

    removeToken(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers: HeadersInit = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                detail: `HTTP ${response.status}: ${response.statusText}`,
            }));
            throw new Error(error.detail || "API 요청 실패");
        }

        return response.json();
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
