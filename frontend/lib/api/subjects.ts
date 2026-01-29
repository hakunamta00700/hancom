/**
 * 과목/단원 API 함수
 */

import { apiClient } from "./client";

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject: string;
  name: string;
  code: string | null;
  parent: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const subjectsApi = {
  async list(): Promise<Subject[]> {
    const response = await apiClient.get<{ results: Subject[] }>("/api/v1/subjects/");
    return response.results;
  },

  async getChapters(subjectId: string): Promise<Chapter[]> {
    const response = await apiClient.get<{ results: Chapter[] }>(`/api/v1/chapters/?subject=${subjectId}`);
    return response.results;
  },
};
