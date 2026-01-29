/**
 * 검수 API 함수
 */

import { apiClient } from "./client";

export interface ReviewTask {
    id: string;
    problem: string;
    ingestion_job: string | null;
    status: "pending" | "in_progress" | "approved" | "rejected";
    assigned_to: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Problem {
    id: string;
    problem_number: number | null;
    page_number: number | null;
    image_file: string | null;
    text_content: any;
    problem_type: string | null;
    difficulty: number | null;
    review_task: {
        id: string;
        status: string;
        review_notes: string | null;
    } | null;
    tags: Array<{
        id: string;
        name: string;
        category: string;
        confidence: number | null;
    }>;
}

export const reviewApi = {
    async list(status?: string): Promise<{ results: ReviewTask[] }> {
        const params = status ? `?status=${status}` : "";
        return apiClient.get(`/api/v1/review-tasks/${params}`);
    },

    async get(id: string): Promise<ReviewTask> {
        return apiClient.get(`/api/v1/review-tasks/${id}/`);
    },

    async getProblem(id: string): Promise<Problem> {
        return apiClient.get(`/api/v1/problems/${id}/`);
    },

    async approve(taskId: string): Promise<void> {
        return apiClient.post(`/api/v1/review-tasks/${taskId}/approve/`, {});
    },

    async reject(taskId: string, reason?: string): Promise<void> {
        return apiClient.post(`/api/v1/review-tasks/${taskId}/reject/`, { reason });
    },

    async stats(): Promise<{
        total: number;
        pending: number;
        in_progress: number;
        approved: number;
        rejected: number;
    }> {
        return apiClient.get("/api/v1/review-tasks/stats/");
    },
};
