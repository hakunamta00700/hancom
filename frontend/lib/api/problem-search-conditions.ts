/**
 * 문항 검색 조건 API 함수
 */

import { apiClient } from "./client";

export interface ProblemSearchCondition {
    id: string;
    organization: string;
    name: string;
    created_by: string;
    conditions: {
        subject_id?: string;
        problem_type?: string;
        difficulty_min?: number;
        difficulty_max?: number;
        keyword?: string;
        ordering?: string;
    };
    created_at: string;
    updated_at: string;
}

export interface CreateProblemSearchConditionData {
    name: string;
    conditions: {
        subject_id?: string;
        problem_type?: string;
        difficulty_min?: number;
        difficulty_max?: number;
        keyword?: string;
        ordering?: string;
    };
}

export const problemSearchConditionsApi = {
    async list(): Promise<{ results: ProblemSearchCondition[] }> {
        return apiClient.get("/api/v1/problem-search-conditions/");
    },

    async get(id: string): Promise<ProblemSearchCondition> {
        return apiClient.get(`/api/v1/problem-search-conditions/${id}/`);
    },

    async create(data: CreateProblemSearchConditionData): Promise<ProblemSearchCondition> {
        return apiClient.post("/api/v1/problem-search-conditions/", data);
    },

    async update(
        id: string,
        data: Partial<CreateProblemSearchConditionData>
    ): Promise<ProblemSearchCondition> {
        return apiClient.patch(`/api/v1/problem-search-conditions/${id}/`, data);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/problem-search-conditions/${id}/`);
    },
};
