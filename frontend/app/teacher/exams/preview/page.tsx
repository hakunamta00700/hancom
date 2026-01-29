"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { examsApi } from "@/lib/api/exams";
import type { ExamPaper } from "@/lib/api/exams";

export default function ExamPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadExamPaper();
    }
  }, [examId]);

  const loadExamPaper = async () => {
    try {
      const data = await examsApi.preview(examId!);
      setExamPaper(data);
    } catch (err) {
      console.error("시험지 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!examPaper) return;
    
    try {
      const blob = await examsApi.downloadPdf(examPaper.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${examPaper.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 다운로드 실패");
    }
  };

  const getDifficultyDistribution = () => {
    if (!examPaper?.items) return { easy: 0, medium: 0, hard: 0 };
    const difficulties = examPaper.items.map((item) => item.problem.difficulty || 0);
    return {
      easy: difficulties.filter((d) => d <= 2).length,
      medium: difficulties.filter((d) => d === 3).length,
      hard: difficulties.filter((d) => d >= 4).length,
    };
  };

  if (loading) {
    return (
      <AppShell title="시험지 미리보기" role="teacher">
        <div className="card p-6 text-center text-slate">로딩 중...</div>
      </AppShell>
    );
  }

  if (!examPaper) {
    return (
      <AppShell title="시험지 미리보기" role="teacher">
        <div className="card p-6 text-center text-slate">시험지를 찾을 수 없습니다.</div>
      </AppShell>
    );
  }

  const dist = getDifficultyDistribution();
  const total = examPaper.items?.length || 0;

  return (
    <AppShell title="시험지 미리보기" role="teacher">
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-sm text-slate">{examPaper.title}</p>
          <h2 className="section-title">
            총 {total}문제 · 예상 {examPaper.estimated_time || "-"}분
          </h2>
        </div>
        <div className="h-96 rounded-3xl border border-ink/10 bg-white/70 flex items-center justify-center text-sm text-slate">
          {examPaper.pdf_file ? (
            <iframe
              src={`${examPaper.pdf_file}`}
              className="w-full h-full rounded-3xl"
            />
          ) : (
            <div>PDF 미리보기 영역 (PDF 생성 후 표시됩니다)</div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {total > 0 && (
            <>
              <span className="badge">쉬움 {Math.round((dist.easy / total) * 100)}%</span>
              <span className="badge">보통 {Math.round((dist.medium / total) * 100)}%</span>
              <span className="badge">어려움 {Math.round((dist.hard / total) * 100)}%</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm"
          >
            뒤로
          </button>
          <button
            onClick={() => router.push(`/teacher/exams/new`)}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm"
          >
            수정
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!examPaper.pdf_file}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            PDF 다운로드
          </button>
        </div>
      </div>
    </AppShell>
  );
}
