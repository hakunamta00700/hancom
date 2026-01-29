"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { examsApi } from "@/lib/api/exams";
import type { ExamPaper } from "@/lib/api/exams";

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await examsApi.list();
      setExams(response.results);
    } catch (err) {
      console.error("시험지 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (examId: string) => {
    router.push(`/teacher/exams/preview?id=${examId}`);
  };

  const handleDownloadPdf = async (examId: string) => {
    try {
      const blob = await examsApi.downloadPdf(examId);
      const exam = exams.find((e) => e.id === examId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam?.title || "시험지"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 다운로드 실패");
    }
  };

  return (
    <AppShell title="시험지 목록" role="teacher">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">최근 시험지</h2>
          <button
            onClick={() => router.push("/teacher/exams/new")}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white"
          >
            새 시험지
          </button>
        </div>
        {loading ? (
          <div className="mt-6 text-center text-slate">로딩 중...</div>
        ) : exams.length === 0 ? (
          <div className="mt-6 text-center text-slate">시험지가 없습니다.</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-3xl bg-white/70 p-5">
                <h3 className="font-display text-xl">{exam.title}</h3>
                <p className="mt-2 text-sm text-slate">
                  총 {exam.total_problems}문제 · 예상 {exam.estimated_time || "-"}분
                </p>
                <p className="mt-1 text-xs text-slate">
                  생성일 {new Date(exam.created_at).toLocaleDateString()}
                </p>
                <div className="mt-4 flex gap-2 text-xs">
                  <button
                    onClick={() => handlePreview(exam.id)}
                    className="rounded-full border border-ink/20 px-3 py-1 hover:bg-ink/5"
                  >
                    미리보기
                  </button>
                  {exam.pdf_file && (
                    <button
                      onClick={() => handleDownloadPdf(exam.id)}
                      className="rounded-full border border-ink/20 px-3 py-1 hover:bg-ink/5"
                    >
                      PDF 다운로드
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
