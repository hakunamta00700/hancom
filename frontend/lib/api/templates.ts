/**
 * 시험지 템플릿 API 함수
 */

import { apiClient } from "./client";

export interface ExamTemplate {
    id: string;
    organization: string;
    name: string;
    description: string | null;
    is_default: boolean;
    created_by: string;
    settings: {
        page_size?: string;
        margin_top?: number;
        margin_bottom?: number;
        margin_left?: number;
        margin_right?: number;
        font_family?: string;
        font_size?: number;
        line_spacing?: number;
    };
    created_at: string;
    updated_at: string;
}

export const templatesApi = {
    async list(): Promise<{ results: ExamTemplate[] }> {
        return apiClient.get("/api/v1/exam-templates/");
    },

    async get(id: string): Promise<ExamTemplate> {
        return apiClient.get(`/api/v1/exam-templates/${id}/`);
    },

    async create(data: {
        name: string;
        description?: string;
        settings?: ExamTemplate["settings"];
    }): Promise<ExamTemplate> {
        return apiClient.post("/api/v1/exam-templates/", data);
    },

    async update(
        id: string,
        data: {
            name?: string;
            description?: string;
            settings?: ExamTemplate["settings"];
        }
    ): Promise<ExamTemplate> {
        return apiClient.patch(`/api/v1/exam-templates/${id}/`, data);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/exam-templates/${id}/`);
    },
};
