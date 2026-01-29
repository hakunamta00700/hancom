/**
 * 소스 문서 API 함수
 */

import { apiClient } from "./client";

export interface SourceDocument {
    id: string;
    title: string;
    file: string;
    file_type: string;
    file_size: number;
    page_count: number | null;
    source: string | null;
    copyright_info: string | null;
    exam_year: number | null;
    exam_month: number | null;
    exam_round: number | null;
    status: "pending" | "processing" | "completed" | "failed";
    created_at: string;
    updated_at: string;
}

export interface CreateSourceDocumentData {
    title: string;
    file: File;
    source?: string;
    copyright_info?: string;
    exam_year?: number;
    exam_month?: number;
    exam_round?: number;
}

export interface IngestionJob {
    id: string;
    source_document: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    pages_processed: number;
    problems_extracted: number;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export const sourceDocumentsApi = {
    async list(): Promise<{ results: SourceDocument[] }> {
        return apiClient.get("/api/v1/source-documents/");
    },

    async get(id: string): Promise<SourceDocument> {
        return apiClient.get(`/api/v1/source-documents/${id}/`);
    },

    async create(data: CreateSourceDocumentData): Promise<SourceDocument> {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("file", data.file);
        if (data.source) formData.append("source", data.source);
        if (data.copyright_info) formData.append("copyright_info", data.copyright_info);
        if (data.exam_year) formData.append("exam_year", data.exam_year.toString());
        if (data.exam_month) formData.append("exam_month", data.exam_month.toString());
        if (data.exam_round) formData.append("exam_round", data.exam_round.toString());

        return apiClient.postFormData<SourceDocument>("/api/v1/source-documents/", formData);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/source-documents/${id}/`);
    },
};

export const ingestionJobsApi = {
    async list(status?: string): Promise<{ results: IngestionJob[] }> {
        const params = status ? `?status=${status}` : "";
        return apiClient.get(`/api/v1/ingestion-jobs/${params}`);
    },

    async get(id: string): Promise<IngestionJob> {
        return apiClient.get(`/api/v1/ingestion-jobs/${id}/`);
    },

    async retry(id: string): Promise<void> {
        return apiClient.post(`/api/v1/ingestion-jobs/${id}/retry/`, {});
    },
};
