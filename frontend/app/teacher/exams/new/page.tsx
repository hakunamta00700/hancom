"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { examsApi } from "@/lib/api/exams";
import { subjectsApi } from "@/lib/api/subjects";
import { problemsApi } from "@/lib/api/problems";
import type { ExamPaper, ExamPaperItem } from "@/lib/api/exams";
import type { Problem } from "@/lib/api/problems";
import type { Subject, Chapter } from "@/lib/api/subjects";

export default function ExamBuilderPage() {
  const router = useRouter();
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<Problem[]>([]);
  
  // 시험지 정보
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [difficultyMin, setDifficultyMin] = useState("1");
  const [difficultyMax, setDifficultyMax] = useState("5");
  const [totalCount, setTotalCount] = useState("20");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
    createDraft();
  }, []);

  useEffect(() => {
    if (subjectId) {
      loadChapters();
    } else {
      setChapters([]);
      setSelectedChapters([]);
    }
  }, [subjectId]);

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.list();
      setSubjects(data);
      if (data.length > 0) {
        setSubjectId(data[0].id);
      }
    } catch (err) {
      console.error("과목 로드 실패:", err);
    }
  };

  const loadChapters = async () => {
    try {
      const data = await subjectsApi.getChapters(subjectId);
      setChapters(data);
    } catch (err) {
      console.error("단원 로드 실패:", err);
    }
  };

  const handleChapterToggle = (chapterId: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const createDraft = async () => {
    try {
      const draft = await examsApi.create({
        title: "새 시험지",
        total_problems: 0,
      });
      setExamPaper(draft);
    } catch (err) {
      console.error("초안 생성 실패:", err);
    }
  };

  const handleRecommend = async () => {
    if (!examPaper || !subjectId) return;
    
    setLoading(true);
    try {
      const response = await examsApi.recommend({
        subject_id: subjectId,
        difficulty_min: parseInt(difficultyMin),
        difficulty_max: parseInt(difficultyMax),
        total_count: parseInt(totalCount),
      });
      
      // 프론트엔드에서 단원/유형 필터링
      let filtered = response.results;
      
      // 단원 필터링
      if (selectedChapters.length > 0) {
        filtered = filtered.filter((problem) => {
          const chapterTags = problem.tags.filter((t: any) => t.category === "chapter");
          return chapterTags.some((tag: any) => selectedChapters.includes(tag.id));
        });
      }
      
      // 유형 필터링
      if (selectedTypes.length > 0) {
        filtered = filtered.filter((problem) => 
          problem.problem_type && selectedTypes.includes(problem.problem_type)
        );
      }
      
      setRecommendedProblems(filtered);
      if (filtered.length < parseInt(totalCount)) {
        setError(`추천 가능한 문항이 부족합니다. (${filtered.length}개 추천됨)`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = async (problem: Problem) => {
    if (!examPaper) return;
    
    try {
      const orderNumber = (examPaper.items?.length || 0) + 1;
      await examsApi.addItem(examPaper.id, problem.id, orderNumber);
      await loadExamPaper();
    } catch (err) {
      setError(err instanceof Error ? err.message : "문항 추가 실패");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!examPaper) return;
    
    try {
      await examsApi.removeItem(examPaper.id, itemId);
      await loadExamPaper();
    } catch (err) {
      setError(err instanceof Error ? err.message : "문항 제거 실패");
    }
  };

  const loadExamPaper = async () => {
    if (!examPaper) return;
    try {
      const updated = await examsApi.get(examPaper.id);
      setExamPaper(updated);
    } catch (err) {
      console.error("시험지 로드 실패:", err);
    }
  };

  const handleSave = async () => {
    if (!examPaper || !title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    
    setLoading(true);
    try {
      await examsApi.update(examPaper.id, {
        title,
        description: description || null,
        subject: subjectId || null,
      });
      setError(null);
      alert("저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!examPaper) return;
    router.push(`/teacher/exams/preview?id=${examPaper.id}`);
  };

  const handleGeneratePdf = async () => {
    if (!examPaper) return;
    
    setLoading(true);
    try {
      await examsApi.generatePdf(examPaper.id);
      alert("PDF 생성이 시작되었습니다. 잠시 후 다운로드할 수 있습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 생성 실패");
    } finally {
      setLoading(false);
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

  const dist = getDifficultyDistribution();
  const total = examPaper?.items?.length || 0;

  return (
    <AppShell title="시험지 제작" role="teacher">
      {error && (
        <div className="mb-4 rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">시험지 정보</h2>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                placeholder="중간고사_국어_1학년"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              <textarea
                className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                rows={3}
                placeholder="설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">조건 설정</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={loading}
              >
                <option value="">과목 선택</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                placeholder="난이도 최소"
                type="number"
                min="1"
                max="5"
                value={difficultyMin}
                onChange={(e) => setDifficultyMin(e.target.value)}
                disabled={loading}
              />
              <input
                className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                placeholder="난이도 최대"
                type="number"
                min="1"
                max="5"
                value={difficultyMax}
                onChange={(e) => setDifficultyMax(e.target.value)}
                disabled={loading}
              />
              <input
                className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                placeholder="총 문제 수"
                type="number"
                min="1"
                value={totalCount}
                onChange={(e) => setTotalCount(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* 단원 선택 (복수 선택 가능) */}
            {subjectId && chapters.length > 0 && (
              <div className="mt-4">
                <label className="text-sm text-slate">단원 선택 (복수 선택 가능)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => handleChapterToggle(chapter.id)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        selectedChapters.includes(chapter.id)
                          ? "border-ink bg-ink text-white"
                          : "border-ink/20 hover:bg-ink/5"
                      }`}
                      disabled={loading}
                    >
                      {chapter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 유형 선택 (복수 선택 가능) */}
            <div className="mt-4">
              <label className="text-sm text-slate">유형 선택 (복수 선택 가능)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { value: "multiple_choice", label: "객관식" },
                  { value: "short_answer", label: "서술형" },
                  { value: "essay", label: "논술형" },
                  { value: "passage_based", label: "지문형" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeToggle(type.value)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      selectedTypes.includes(type.value)
                        ? "border-ink bg-ink text-white"
                        : "border-ink/20 hover:bg-ink/5"
                    }`}
                    disabled={loading}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRecommend}
                disabled={loading || !subjectId}
                className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading ? "추천 중..." : "자동 추천"}
              </button>
              <button
                onClick={() => router.push("/teacher/search")}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm"
              >
                검색으로 찾기
              </button>
            </div>
            {recommendedProblems.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate">추천 문항:</p>
                {recommendedProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm"
                  >
                    <span>난이도 {problem.difficulty || "-"}</span>
                    <button
                      onClick={() => handleAddProblem(problem)}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs hover:bg-ink/5"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">선택된 문항 ({total})</h2>
            <div className="mt-4 space-y-3">
              {examPaper?.items && examPaper.items.length > 0 ? (
                examPaper.items
                  .sort((a, b) => a.order_number - b.order_number)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm"
                    >
                      <span>
                        {item.order_number}. 난이도 {item.problem.difficulty || "-"}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-coral/10"
                      >
                        삭제
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate">선택된 문항이 없습니다.</p>
              )}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">난이도 분포</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { label: "쉬움", count: dist.easy },
                { label: "보통", count: dist.medium },
                { label: "어려움", count: dist.hard },
              ].map((bar) => {
                const percentage = total > 0 ? `${Math.round((bar.count / total) * 100)}%` : "0%";
                return (
                  <div key={bar.label}>
                    <div className="flex justify-between text-slate">
                      <span>{bar.label}</span>
                      <span>{percentage}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-ink/10">
                      <div
                        className="h-2 rounded-full bg-teal"
                        style={{ width: percentage }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handlePreview}
                disabled={!examPaper || total === 0}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
              >
                미리보기
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={loading || !examPaper || total === 0}
                className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                PDF 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
