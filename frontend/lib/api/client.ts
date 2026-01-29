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

    async delete<T>(endpoint: string, options?: { body?: string }): Promise<T> {
        return this.request<T>(endpoint, {
            method: "DELETE",
            body: options?.body,
        });
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

    async postFormDataWithProgress<T>(
        endpoint: string,
        data: {
            title: string;
            file: File;
            source?: string;
            copyright_info?: string;
            exam_year?: number;
            exam_month?: number;
            exam_round?: number;
        },
        onProgress?: (progress: number) => void
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const url = `${this.baseURL}${endpoint}`;
            const token = this.getToken();
            const xhr = new XMLHttpRequest();

            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("file", data.file);
            if (data.source) formData.append("source", data.source);
            if (data.copyright_info) formData.append("copyright_info", data.copyright_info);
            if (data.exam_year) formData.append("exam_year", data.exam_year.toString());
            if (data.exam_month) formData.append("exam_month", data.exam_month.toString());
            if (data.exam_round) formData.append("exam_round", data.exam_round.toString());

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response as T);
                    } catch (err) {
                        reject(new Error("응답 파싱 실패"));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.detail || `HTTP ${xhr.status}: ${xhr.statusText}`));
                    } catch {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            });

            xhr.addEventListener("error", () => {
                reject(new Error("네트워크 오류"));
            });

            xhr.addEventListener("abort", () => {
                reject(new Error("업로드 취소됨"));
            });

            xhr.open("POST", url);
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
