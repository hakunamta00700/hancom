/**
 * 학생 API 함수
 */

import { apiClient } from "./client";
import type { ExamPaper } from "./exams";

export interface ExamAttempt {
  id: string;
  exam_paper: ExamPaper;
  student: string;
  status: "in_progress" | "submitted" | "graded";
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  max_score: number | null;
  answers: Array<{
    id: string;
    problem: any;
    answer_text: string | null;
    selected_choice: number | null;
    is_correct: boolean | null;
    points_earned: number;
  }>;
  created_at: string;
  updated_at: string;
}

export const studentApi = {
  async getAvailableExams(): Promise<{ results: ExamPaper[] }> {
    return apiClient.get("/api/v1/exam-papers/?is_published=true");
  },

  async startExam(examPaperId: string): Promise<ExamAttempt> {
    return apiClient.post("/api/v1/exam-attempts/", {
      exam_paper_id: examPaperId,
    });
  },

  async getAttempt(attemptId: string): Promise<ExamAttempt> {
    return apiClient.get(`/api/v1/exam-attempts/${attemptId}/`);
  },

  async saveAnswer(attemptId: string, problemId: string, answerText?: string, selectedChoice?: number): Promise<void> {
    return apiClient.post(`/api/v1/exam-attempts/${attemptId}/save_answer/`, {
      problem_id: problemId,
      answer_text: answerText,
      selected_choice: selectedChoice,
    });
  },

  async submitExam(attemptId: string): Promise<ExamAttempt> {
    return apiClient.post(`/api/v1/exam-attempts/${attemptId}/submit/`, {});
  },

  async getResult(attemptId: string): Promise<ExamAttempt> {
    return apiClient.get(`/api/v1/exam-attempts/${attemptId}/result/`);
  },

  async getIncorrectAnswers(): Promise<{ results: any[] }> {
    // DRF router에서 @action 메서드는 기본적으로 하이픈(-)을 사용하여 URL 생성
    // 예: incorrect_answers -> incorrect-answers
    return apiClient.get("/api/v1/exam-attempts/incorrect-answers/");
  },
};
