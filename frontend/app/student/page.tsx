"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi } from "@/lib/api/student";
import { examsApi } from "@/lib/api/exams";
import type { ExamPaper } from "@/lib/api/exams";

export default function StudentHome() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [previewExam, setPreviewExam] = useState<ExamPaper | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (previewExamId) {
      loadPreview();
    }
  }, [previewExamId]);

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

  const loadPreview = async () => {
    if (!previewExamId) return;
    try {
      const exam = await examsApi.get(previewExamId);
      setPreviewExam(exam);
    } catch (err) {
      console.error("미리보기 로드 실패:", err);
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

  const handlePreview = (examId: string) => {
    setPreviewExamId(examId);
  };

  const handleClosePreview = () => {
    setPreviewExamId(null);
    setPreviewExam(null);
  };

  return (
    <AppShell title="시험지 목록" role="student">
      {loading ? (
        <div className="text-center text-slate">로딩 중...</div>
      ) : exams.length === 0 ? (
        <div className="text-center text-slate">배포된 시험지가 없습니다.</div>
      ) : (
        <>
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
                {exam.description && (
                  <p className="mt-2 text-sm text-slate line-clamp-2">{exam.description}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handlePreview(exam.id)}
                    className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
                  >
                    미리보기
                  </button>
                  <button
                    onClick={() => handleStartExam(exam.id)}
                    className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
                  >
                    시작하기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 미리보기 모달 */}
          {previewExamId && previewExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="section-title">{previewExam.title}</h2>
                  <button
                    onClick={handleClosePreview}
                    className="rounded-full border border-ink/20 px-3 py-1 text-sm hover:bg-ink/5"
                  >
                    닫기
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/70 p-4 text-sm">
                    <p className="text-slate">총 문제 수: {previewExam.total_problems}문제</p>
                    <p className="text-slate">예상 소요 시간: {previewExam.estimated_time || "-"}분</p>
                    {previewExam.description && (
                      <p className="mt-2 text-slate">{previewExam.description}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4">
                    <h3 className="mb-3 text-sm font-semibold">문제 목록</h3>
                    <div className="space-y-2">
                      {previewExam.items && previewExam.items.length > 0 ? (
                        previewExam.items
                          .sort((a, b) => a.order_number - b.order_number)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                            >
                              <span>
                                {item.order_number}. 난이도 {item.problem.difficulty || "-"}
                              </span>
                              <span className="text-slate">{item.points}점</span>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-slate">문제 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleClosePreview}
                      className="rounded-full border border-ink/20 px-4 py-2 text-sm"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        handleClosePreview();
                        handleStartExam(previewExam.id);
                      }}
                      className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
                    >
                      시작하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
