"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { examsApi } from "@/lib/api/exams";
import { subjectsApi } from "@/lib/api/subjects";
import { problemsApi } from "@/lib/api/problems";
import { templatesApi } from "@/lib/api/templates";
import { examConditionsApi } from "@/lib/api/exam-conditions";
import type { ExamPaper, ExamPaperItem } from "@/lib/api/exams";
import type { Problem } from "@/lib/api/problems";
import type { Subject, Chapter } from "@/lib/api/subjects";
import type { ExamTemplate } from "@/lib/api/templates";
import type { ExamPaperCondition } from "@/lib/api/exam-conditions";

export default function ExamBuilderPage() {
  const router = useRouter();
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<Problem[]>([]);
  
  // 시험지 정보
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [difficultyMin, setDifficultyMin] = useState("1");
  const [difficultyMax, setDifficultyMax] = useState("5");
  const [totalCount, setTotalCount] = useState("20");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
    loadTemplates();
    loadSavedConditions();
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

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.list();
      setTemplates(response.results);
      // 기본 템플릿 선택
      const defaultTemplate = response.results.find((t) => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (err) {
      console.error("템플릿 로드 실패:", err);
    }
  };

  const loadSavedConditions = async () => {
    try {
      const response = await examConditionsApi.list();
      setSavedConditions(response.results);
    } catch (err) {
      console.error("저장된 조건 로드 실패:", err);
    }
  };

  const handleSaveCondition = async () => {
    if (!conditionName.trim()) {
      alert("조건 이름을 입력해주세요.");
      return;
    }
    
    try {
      await examConditionsApi.create({
        name: conditionName,
        conditions: {
          subject_id: subjectId || undefined,
          chapter_ids: selectedChapters.length > 0 ? selectedChapters : undefined,
          type_ids: selectedTypes.length > 0 ? selectedTypes : undefined,
          difficulty_min: parseInt(difficultyMin) || undefined,
          difficulty_max: parseInt(difficultyMax) || undefined,
          total_count: parseInt(totalCount) || undefined,
        },
      });
      setConditionName("");
      setShowSaveConditionModal(false);
      await loadSavedConditions();
      alert("조건이 저장되었습니다.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "조건 저장 실패");
    }
  };

  const handleLoadCondition = (condition: ExamPaperCondition) => {
    const cond = condition.conditions;
    if (cond.subject_id) setSubjectId(cond.subject_id);
    if (cond.chapter_ids) setSelectedChapters(cond.chapter_ids);
    if (cond.type_ids) setSelectedTypes(cond.type_ids);
    if (cond.difficulty_min !== undefined) setDifficultyMin(cond.difficulty_min.toString());
    if (cond.difficulty_max !== undefined) setDifficultyMax(cond.difficulty_max.toString());
    if (cond.total_count !== undefined) setTotalCount(cond.total_count.toString());
    setShowLoadConditionModal(false);
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
      setError(err instanceof Error ? err.message : "순서 변경 실패");
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
        template: selectedTemplateId || null,
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
              <div>
                <label className="text-sm text-slate">템플릿 선택</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">템플릿 없음</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.is_default ? "⭐ " : ""}
                      {template.name}
                      {template.description ? ` - ${template.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>
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
                {recommendedProblems.map((problem: any) => (
                  <div
                    key={problem.id}
                    className="rounded-2xl bg-white/70 px-4 py-3 text-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span>난이도 {problem.difficulty || "-"}</span>
                      <button
                        onClick={() => handleAddProblem(problem)}
                        className="rounded-full border border-ink/20 px-3 py-1 text-xs hover:bg-ink/5"
                      >
                        추가
                      </button>
                    </div>
                    {problem.recommendation_reason && (
                      <div className="text-xs text-slate flex items-center gap-1">
                        <span className="badge bg-teal/10 border-teal/30 text-teal">
                          추천 이유
                        </span>
                        <span>{problem.recommendation_reason}</span>
                      </div>
                    )}
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
                (() => {
                  const sortedItems = [...examPaper.items].sort((a, b) => a.order_number - b.order_number);
                  return sortedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm"
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
                        삭제
                      </button>
                    </div>
                  ));
                })()
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

      {/* 조건 저장 모달 */}
      {showSaveConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="section-title mb-4">조건 저장</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate">조건 이름 *</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  placeholder="예: 중간고사_국어_1학년"
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveConditionModal(false);
                    setConditionName("");
                  }}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveCondition}
                  className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-white"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 조건 불러오기 모달 */}
      {showLoadConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">저장된 조건 불러오기</h3>
              <button
                onClick={() => setShowLoadConditionModal(false)}
                className="rounded-full border border-ink/20 px-3 py-1 text-sm"
              >
                닫기
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedConditions.length > 0 ? (
                savedConditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm hover:bg-ink/5 cursor-pointer"
                    onClick={() => handleLoadCondition(condition)}
                  >
                    <span>{condition.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("이 조건을 삭제하시겠습니까?")) {
                          examConditionsApi.delete(condition.id).then(() => {
                            loadSavedConditions();
                          });
                        }
                      }}
                      className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-coral/10"
                    >
                      삭제
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate text-center py-4">저장된 조건이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
