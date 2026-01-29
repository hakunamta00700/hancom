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

  const handleGeneratePdf = async () => {
    if (!examPaper) return;
    
    setPdfGenerating(true);
    setPdfProgress(0);
    
    try {
      await examsApi.generatePdf(examPaper.id, pdfLayoutSettings);
      setShowPdfSettings(false);
      
      // 진행률 폴링 (간단한 시뮬레이션)
      const interval = setInterval(async () => {
        setPdfProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
        
        // PDF 상태 확인
        try {
          const status = await examsApi.checkPdfStatus(examPaper.id);
          if (status.pdf_file) {
            clearInterval(interval);
            setPdfProgress(100);
            setPdfGenerating(false);
            await loadExamPaper();
          }
        } catch (err) {
          // 무시
        }
      }, 1000);
      
      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(interval);
        if (pdfProgress < 100) {
          setPdfGenerating(false);
          setPdfProgress(0);
        }
      }, 10000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 생성 실패");
      setPdfGenerating(false);
      setPdfProgress(0);
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
  
  const handlePreviewPdf = () => {
    if (!examPaper?.pdf_file) return;
    const pdfUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${examPaper.pdf_file}`;
    window.open(pdfUrl, "_blank");
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

  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    if (!examPaper || !examPaper.items) return;
    
    const sortedItems = [...examPaper.items].sort((a, b) => a.order_number - b.order_number);
    const currentIndex = sortedItems.findIndex((item) => item.id === itemId);
    
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (direction === "up" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "down" && currentIndex < sortedItems.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // 이동 불가
    }
    
    const newOrder = sortedItems[newIndex].order_number;
    
    try {
      await examsApi.reorderItem(examPaper.id, itemId, newOrder);
      await loadExamPaper();
    } catch (err) {
      alert(err instanceof Error ? err.message : "순서 변경 실패");
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
              (() => {
                const sortedItems = [...examPaper.items].sort((a, b) => a.order_number - b.order_number);
                return sortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {item.order_number}. 난이도 {item.problem.difficulty || "-"}
                      </span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveItem(item.id, "up")}
                          disabled={index === 0}
                          className="rounded border border-ink/20 px-1 py-0.5 text-xs hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="위로 이동"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveItem(item.id, "down")}
                          disabled={index === sortedItems.length - 1}
                          className="rounded border border-ink/20 px-1 py-0.5 text-xs hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="아래로 이동"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-coral/10"
                    >
                      제거
                    </button>
                  </div>
                ));
              })()
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
        </div>
      </div>

      {/* PDF 레이아웃 설정 모달 */}
      {showPdfSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="section-title mb-4">PDF 레이아웃 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate">페이지 크기</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                  value={pdfLayoutSettings.page_size}
                  onChange={(e) =>
                    setPdfLayoutSettings({ ...pdfLayoutSettings, page_size: e.target.value })
                  }
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate">상단 여백 (mm)</label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.margin_top}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        margin_top: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate">하단 여백 (mm)</label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.margin_bottom}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        margin_bottom: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate">좌측 여백 (mm)</label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.margin_left}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        margin_left: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-slate">우측 여백 (mm)</label>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.margin_right}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        margin_right: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate">폰트</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.font_family}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        font_family: e.target.value,
                      })
                    }
                  >
                    <option value="Noto Sans KR">Noto Sans KR</option>
                    <option value="Nanum Gothic">Nanum Gothic</option>
                    <option value="Malgun Gothic">Malgun Gothic</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate">폰트 크기 (pt)</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                    value={pdfLayoutSettings.font_size}
                    onChange={(e) =>
                      setPdfLayoutSettings({
                        ...pdfLayoutSettings,
                        font_size: parseInt(e.target.value) || 12,
                      })
                    }
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPdfSettings(false)}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm"
                  disabled={pdfGenerating}
                >
                  취소
                </button>
                <button
                  onClick={handleGeneratePdf}
                  disabled={pdfGenerating}
                  className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {pdfGenerating ? "생성 중..." : "PDF 생성"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
