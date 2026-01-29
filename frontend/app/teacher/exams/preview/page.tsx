"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { examsApi } from "@/lib/api/exams";
import { problemsApi } from "@/lib/api/problems";
import type { ExamPaper } from "@/lib/api/exams";
import type { Problem } from "@/lib/api/problems";

export default function ExamPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Problem[]>([]);
  const [searching, setSearching] = useState(false);

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

  const handleSearchProblems = async () => {
    if (!searchKeyword.trim() || !examPaper) return;
    
    setSearching(true);
    try {
      const response = await problemsApi.search({ keyword: searchKeyword, page: 1 });
      setSearchResults(response.results.slice(0, 5)); // 최대 5개만 표시
    } catch (err) {
      console.error("문항 검색 실패:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddProblem = async (problem: Problem) => {
    if (!examPaper) return;
    
    try {
      const orderNumber = (examPaper.items?.length || 0) + 1;
      await examsApi.addItem(examPaper.id, problem.id, orderNumber);
      await loadExamPaper();
      setShowAddProblem(false);
      setSearchKeyword("");
      setSearchResults([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "문항 추가 실패");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!examPaper) return;
    
    if (!confirm("이 문항을 제거하시겠습니까?")) return;
    
    try {
      await examsApi.removeItem(examPaper.id, itemId);
      await loadExamPaper();
    } catch (err) {
      alert(err instanceof Error ? err.message : "문항 제거 실패");
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
        {/* 문항 목록 */}
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">문항 목록</h3>
            <button
              onClick={() => setShowAddProblem(!showAddProblem)}
              className="rounded-full border border-ink/20 px-3 py-1 text-xs hover:bg-ink/5"
            >
              {showAddProblem ? "닫기" : "문항 추가"}
            </button>
          </div>
          
          {showAddProblem && (
            <div className="mb-4 rounded-2xl border border-ink/10 bg-white/80 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                  placeholder="문항 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchProblems()}
                />
                <button
                  onClick={handleSearchProblems}
                  disabled={searching || !searchKeyword.trim()}
                  className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {searching ? "검색 중..." : "검색"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((problem) => (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                    >
                      <span>난이도 {problem.difficulty || "-"}</span>
                      <button
                        onClick={() => handleAddProblem(problem)}
                        className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-ink/5"
                      >
                        추가
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {examPaper.items && examPaper.items.length > 0 ? (
              examPaper.items
                .sort((a, b) => a.order_number - b.order_number)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                  >
                    <span>
                      {item.order_number}. 난이도 {item.problem.difficulty || "-"}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-coral/10"
                    >
                      제거
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-sm text-slate">문항이 없습니다.</p>
            )}
          </div>
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
