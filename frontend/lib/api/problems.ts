/**
 * 문항 API 함수
 */

import { apiClient } from "./client";

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
  created_at: string;
}

export interface ProblemSearchParams {
  subject_id?: string;
  difficulty_min?: number;
  difficulty_max?: number;
  problem_type?: string;
  keyword?: string;
  ordering?: string;
  page?: number;
}

export const problemsApi = {
  async search(params: ProblemSearchParams = {}): Promise<{ results: Problem[]; count: number; next: string | null; previous: string | null }> {
    const queryParams = new URLSearchParams();
    if (params.subject_id) queryParams.append("subject_id", params.subject_id);
    if (params.difficulty_min) queryParams.append("difficulty_min", params.difficulty_min.toString());
    if (params.difficulty_max) queryParams.append("difficulty_max", params.difficulty_max.toString());
    if (params.problem_type) queryParams.append("problem_type", params.problem_type);
    if (params.keyword) queryParams.append("keyword", params.keyword);
    if (params.ordering) queryParams.append("ordering", params.ordering);
    if (params.page) queryParams.append("page", params.page.toString());
    
    const query = queryParams.toString();
    return apiClient.get(`/api/v1/problems/${query ? `?${query}` : ""}`);
  },

  async get(id: string): Promise<Problem> {
    return apiClient.get(`/api/v1/problems/${id}/`);
  },
};
