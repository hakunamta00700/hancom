"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi } from "@/lib/api/student";
import type { ExamAttempt } from "@/lib/api/student";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  const loadResult = async () => {
    try {
      const data = await studentApi.getResult(attemptId);
      setAttempt(data);
    } catch (err) {
      console.error("결과 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !attempt) {
    return (
      <AppShell title="시험 결과" role="student">
        <div className="card p-6 text-center text-slate">로딩 중...</div>
      </AppShell>
    );
  }

  const scorePercentage = attempt.max_score
    ? Math.round((attempt.total_score || 0 / attempt.max_score) * 100)
    : 0;

  return (
    <AppShell title="시험 결과" role="student">
      <div className="card p-6 space-y-6">
        <div className="text-center">
          <h2 className="section-title">{attempt.exam_paper.title}</h2>
          <div className="mt-4">
            <p className="text-4xl font-display text-ink">
              {attempt.total_score || 0} / {attempt.max_score || 0}
            </p>
            <p className="text-lg text-slate mt-2">{scorePercentage}점</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-display">문제별 결과</h3>
          {attempt.answers.map((answer, index) => (
            <div
              key={answer.id}
              className={`rounded-2xl p-4 ${
                answer.is_correct ? "bg-teal/10 border border-teal/30" : "bg-coral/10 border border-coral/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  문제 {index + 1}: {answer.is_correct ? "정답" : "오답"}
                </span>
                <span className="text-sm">{answer.points_earned}점</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/student")}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    </AppShell>
  );
}
