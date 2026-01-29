/**
 * 시험지 API 함수
 */

import { apiClient } from "./client";
import type { Problem } from "./problems";

export interface ExamPaperItem {
    id: string;
    exam_paper: string;
    problem: Problem;
    problem_id: string;
    order_number: number;
    points: number;
    created_at: string;
    updated_at: string;
}

export interface ExamPaper {
    id: string;
    title: string;
    description: string | null;
    subject: string | null;
    template: string | null;
    total_problems: number;
    estimated_time: number | null;
    difficulty_distribution: any;
    pdf_file: string | null;
    is_published: boolean;
    published_at: string | null;
    items: ExamPaperItem[];
    created_at: string;
    updated_at: string;
}

export interface RecommendParams {
    subject_id?: string;
    difficulty_min?: number;
    difficulty_max?: number;
    total_count?: number;
}

export const examsApi = {
    async list(): Promise<{ results: ExamPaper[] }> {
        return apiClient.get("/api/v1/exam-papers/");
    },

    async get(id: string): Promise<ExamPaper> {
        return apiClient.get(`/api/v1/exam-papers/${id}/`);
    },

    async create(data: Partial<ExamPaper>): Promise<ExamPaper> {
        return apiClient.post("/api/v1/exam-papers/", data);
    },

    async update(id: string, data: Partial<ExamPaper>): Promise<ExamPaper> {
        return apiClient.patch(`/api/v1/exam-papers/${id}/`, data);
    },

    async recommend(params: RecommendParams): Promise<{ results: Problem[]; insufficient: boolean }> {
        return apiClient.post("/api/v1/exam-papers/recommend/", params);
    },

    async preview(id: string): Promise<ExamPaper> {
        return apiClient.get(`/api/v1/exam-papers/${id}/preview/`);
    },

    async addItem(examPaperId: string, problemId: string, orderNumber: number, points: number = 1): Promise<ExamPaperItem> {
        return apiClient.post(`/api/v1/exam-papers/${examPaperId}/add_item/`, {
            problem_id: problemId,
            order_number: orderNumber,
            points,
        });
    },

    async removeItem(examPaperId: string, itemId: string): Promise<void> {
        // DELETE 요청에 body를 포함하기 위해 커스텀 fetch 사용
        const token = localStorage.getItem("access_token");
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/exam-papers/${examPaperId}/remove_item/`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ item_id: itemId }),
            }
        );
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "요청 실패" }));
            throw new Error(error.detail || "문항 제거 실패");
        }
    },

    async reorderItem(examPaperId: string, itemId: string, orderNumber: number): Promise<ExamPaperItem> {
        return apiClient.post(`/api/v1/exam-papers/${examPaperId}/reorder-items/`, {
            item_id: itemId,
            order_number: orderNumber,
        });
    },

    async generatePdf(id: string, layoutSettings?: {
        page_size?: string;
        margin_top?: number;
        margin_bottom?: number;
        margin_left?: number;
        margin_right?: number;
        font_family?: string;
        font_size?: number;
    }): Promise<void> {
        return apiClient.post(`/api/v1/exam-papers/${id}/generate-pdf/`, {
            layout_settings: layoutSettings,
        });
    },

    async checkPdfStatus(id: string): Promise<{ pdf_file: string | null; pdf_generating: boolean }> {
        const exam = await this.get(id);
        return {
            pdf_file: exam.pdf_file,
            pdf_generating: false, // TODO: 실제 생성 상태 추적
        };
    },

    async downloadPdf(id: string): Promise<Blob> {
        const response = await fetch(`${apiClient["baseURL"]}/api/v1/exam-papers/${id}/pdf/`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        if (!response.ok) throw new Error("PDF 다운로드 실패");
        return response.blob();
    },
};
