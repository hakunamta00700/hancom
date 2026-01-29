"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi } from "@/lib/api/student";
import type { ExamPaper } from "@/lib/api/exams";

export default function StudentHome() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await studentApi.getAvailableExams();
      setExams(response.results);
    } catch (err) {
      console.error("시험지 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId: string) => {
    try {
      const attempt = await studentApi.startExam(examId);
      router.push(`/student/exams?attempt=${attempt.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "시험지 시작 실패");
    }
  };

  return (
    <AppShell title="시험지 목록" role="student">
      {loading ? (
        <div className="text-center text-slate">로딩 중...</div>
      ) : exams.length === 0 ? (
        <div className="text-center text-slate">배포된 시험지가 없습니다.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <div key={exam.id} className="card p-6">
              <h3 className="font-display text-xl">{exam.title}</h3>
              <p className="mt-2 text-sm text-slate">
                총 {exam.total_problems}문제 · 예상 {exam.estimated_time || "-"}분
              </p>
              <p className="mt-1 text-xs text-slate">
                배포일 {exam.published_at ? new Date(exam.published_at).toLocaleDateString() : "-"}
              </p>
              <button
                onClick={() => handleStartExam(exam.id)}
                className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
              >
                시작하기
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
