/**
 * 인증 API 함수
 */

import { apiClient } from "../api/client";
import type {
    LoginCredentials,
    TokenResponse,
    User,
    RegisterData,
} from "./types";

export const authApi = {
    async login(credentials: LoginCredentials): Promise<TokenResponse> {
        const response = await apiClient.post<TokenResponse>(
            "/api/v1/auth/token/",
            credentials
        );
        apiClient.setToken(response.access);
        if (typeof window !== "undefined") {
            localStorage.setItem("refresh_token", response.refresh);
        }
        return response;
    },

    async register(data: RegisterData): Promise<User> {
        return apiClient.post<User>("/api/v1/auth/register/", data);
    },

    async getMe(): Promise<User> {
        return apiClient.get<User>("/api/v1/auth/me/");
    },

    async updateProfile(data: Partial<Pick<User, "name">>): Promise<User> {
        return apiClient.patch<User>("/api/v1/auth/me/", data);
    },

    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        return apiClient.post("/api/v1/auth/password/change/", {
            old_password: oldPassword,
            new_password: newPassword,
        });
    },

    async forgotPassword(email: string): Promise<void> {
        return apiClient.post("/api/v1/auth/forgot-password/", { email });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
        return apiClient.post("/api/v1/auth/reset-password/", {
            token,
            new_password: newPassword,
        });
    },

    logout(): void {
        apiClient.removeToken();
    },

    async getStudents(): Promise<{ results: User[] }> {
        return apiClient.get("/api/v1/students/");
    },
};
