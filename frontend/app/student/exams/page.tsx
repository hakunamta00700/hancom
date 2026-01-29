"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi } from "@/lib/api/student";
import type { ExamAttempt } from "@/lib/api/student";
import { apiClient } from "@/lib/api/client";

export default function StudentExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadAttempt();
    } else {
      router.push("/student");
    }
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const data = await studentApi.getAttempt(attemptId!);
      setAttempt(data);
    } catch (err) {
      console.error("시도 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnswer = async (problemId: string, selectedChoice?: number, answerText?: string) => {
    if (!attempt || !attemptId) return;
    
    setSaving(true);
    try {
      await studentApi.saveAnswer(attemptId, problemId, answerText, selectedChoice);
      await loadAttempt();
    } catch (err) {
      console.error("답안 저장 실패:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !attemptId) return;
    if (!confirm("시험지를 제출하시겠습니까?")) return;
    
    try {
      await studentApi.submitExam(attemptId);
      router.push(`/student/exams/${attemptId}/result`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "제출 실패");
    }
  };

  if (loading || !attempt) {
    return (
      <AppShell title="문제 풀이" role="student">
        <div className="card p-6 text-center text-slate">로딩 중...</div>
      </AppShell>
    );
  }

  const problems = attempt.exam_paper.items || [];
  const currentProblem = problems[currentProblemIndex];
  const currentAnswer = attempt.answers?.find((a) => a.problem.id === currentProblem?.problem.id);

  if (!currentProblem) {
    return (
      <AppShell title="문제 풀이" role="student">
        <div className="card p-6 text-center text-slate">문제가 없습니다.</div>
      </AppShell>
    );
  }

  const problem = currentProblem.problem;
  const imageUrl = problem.image_file
    ? `${apiClient["baseURL"]}${problem.image_file}`
    : null;

  const choices = problem.text_content?.choices || [];

  return (
    <AppShell title="문제 풀이" role="student">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">
            문제 {currentProblemIndex + 1} / {problems.length}
          </h2>
          <div className="flex gap-2 text-sm">
            {saving && <span className="text-slate">저장 중...</span>}
            <button
              onClick={handleSubmit}
              disabled={attempt.status !== "in_progress"}
              className="rounded-full bg-ink px-3 py-2 text-white disabled:opacity-50"
            >
              제출
            </button>
          </div>
        </div>
        {imageUrl && (
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <img src={imageUrl} alt="문제" className="w-full rounded-2xl" />
          </div>
        )}
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-4 text-sm">
          <p>{problem.text_content?.question || "문제 내용"}</p>
          {choices.length > 0 && (
            <div className="mt-4 space-y-2">
              {choices.map((choice: any, index: number) => (
                <label key={index} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`problem-${problem.id}`}
                    checked={currentAnswer?.selected_choice === choice.number}
                    onChange={() => handleSaveAnswer(problem.id, choice.number)}
                    disabled={attempt.status !== "in_progress"}
                  />
                  {choice.number}. {choice.text}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {problems.map((_, index) => {
            const hasAnswer = attempt.answers?.some((a) => a.problem.id === problems[index].problem.id);
            return (
              <button
                key={index}
                onClick={() => setCurrentProblemIndex(index)}
                className={`rounded-full border px-3 py-1 ${
                  index === currentProblemIndex
                    ? "bg-ink text-white border-ink"
                    : hasAnswer
                    ? "border-teal bg-teal/10"
                    : "border-ink/20"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentProblemIndex(Math.max(0, currentProblemIndex - 1))}
            disabled={currentProblemIndex === 0}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            이전 문제
          </button>
          <button
            onClick={() => setCurrentProblemIndex(Math.min(problems.length - 1, currentProblemIndex + 1))}
            disabled={currentProblemIndex === problems.length - 1}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            다음 문제
          </button>
        </div>
      </div>
    </AppShell>
  );
}
