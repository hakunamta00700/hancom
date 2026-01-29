/**
 * 시험지 제작 조건 저장/재사용 API 함수
 */

import { apiClient } from "./client";

export interface ExamPaperCondition {
  id: string;
  organization: string;
  name: string;
  created_by: string;
  conditions: {
    subject_id?: string;
    chapter_ids?: string[];
    type_ids?: string[];
    difficulty_min?: number;
    difficulty_max?: number;
    total_count?: number;
    difficulty_distribution?: {
      easy?: number;
      medium?: number;
      hard?: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export const examConditionsApi = {
  async list(): Promise<{ results: ExamPaperCondition[] }> {
    return apiClient.get("/api/v1/exam-paper-conditions/");
  },

  async get(id: string): Promise<ExamPaperCondition> {
    return apiClient.get(`/api/v1/exam-paper-conditions/${id}/`);
  },

  async create(data: {
    name: string;
    conditions: ExamPaperCondition["conditions"];
  }): Promise<ExamPaperCondition> {
    return apiClient.post("/api/v1/exam-paper-conditions/", data);
  },

  async update(
    id: string,
    data: {
      name?: string;
      conditions?: ExamPaperCondition["conditions"];
    }
  ): Promise<ExamPaperCondition> {
    return apiClient.patch(`/api/v1/exam-paper-conditions/${id}/`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/exam-paper-conditions/${id}/`);
  },
};
