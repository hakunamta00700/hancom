"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { problemsApi } from "@/lib/api/problems";
import { subjectsApi } from "@/lib/api/subjects";
import { problemSearchConditionsApi } from "@/lib/api/problem-search-conditions";
import type { Problem } from "@/lib/api/problems";
import type { Subject } from "@/lib/api/subjects";
import type { ProblemSearchCondition } from "@/lib/api/problem-search-conditions";
import { apiClient } from "@/lib/api/client";

export default function SearchPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 검색 조건
  const [subjectId, setSubjectId] = useState("");
  const [problemType, setProblemType] = useState("");
  const [difficultyMin, setDifficultyMin] = useState("");
  const [difficultyMax, setDifficultyMax] = useState("");
  const [keyword, setKeyword] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  
  // 검색 조건 저장/불러오기
  const [savedConditions, setSavedConditions] = useState<ProblemSearchCondition[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [conditionName, setConditionName] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    search();
  }, [page, ordering]);

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.list();
      setSubjects(data);
    } catch (err) {
      console.error("과목 로드 실패:", err);
    }
  };

  const search = async () => {
    setLoading(true);
    try {
      const params: any = { page, ordering };
      if (subjectId) params.subject_id = subjectId;
      if (problemType) params.problem_type = problemType;
      if (difficultyMin) params.difficulty_min = parseInt(difficultyMin);
      if (difficultyMax) params.difficulty_max = parseInt(difficultyMax);
      if (keyword) params.keyword = keyword;
      
      const response = await problemsApi.search(params);
      setProblems(response.results);
      setTotalCount(response.count);
    } catch (err) {
      console.error("검색 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    search();
  };

  const handleReset = () => {
    setSubjectId("");
    setProblemType("");
    setDifficultyMin("");
    setDifficultyMax("");
    setKeyword("");
    setOrdering("-created_at");
    setPage(1);
  };

  const handleProblemClick = (problemId: string) => {
    router.push(`/teacher/problems/${problemId}`);
  };

  const imageUrl = (problem: Problem) => {
    if (problem.image_file) {
      return `${apiClient["baseURL"]}${problem.image_file}`;
    }
    return null;
  };

  const getTagValue = (problem: Problem, category: string) => {
    const tag = problem.tags.find((t) => t.category === category);
    return tag?.name || "-";
  };

  return (
    <AppShell title="문항 검색" role="teacher">
      <div className="card p-6">
        <h2 className="section-title">검색 조건</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">과목: 전체</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
          >
            <option value="">유형: 전체</option>
            <option value="multiple_choice">객관식</option>
            <option value="short_answer">서술형</option>
            <option value="essay">논술형</option>
          </select>
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={difficultyMin}
            onChange={(e) => setDifficultyMin(e.target.value)}
          >
            <option value="">난이도 최소: 전체</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d.toString()}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={difficultyMax}
            onChange={(e) => setDifficultyMax(e.target.value)}
          >
            <option value="">난이도 최대: 전체</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d.toString()}>
                {d}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="키워드 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleSearch}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white"
            disabled={loading}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
          <button
            onClick={handleReset}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm"
          >
            초기화
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
          >
            조건 저장
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
          >
            조건 불러오기
          </button>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate">검색 결과 {totalCount}개</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              className={`badge ${ordering === "-created_at" ? "bg-ink text-white" : ""}`}
              onClick={() => setOrdering("-created_at")}
            >
              최신순
            </button>
            <button
              className={`badge ${ordering === "difficulty" ? "bg-ink text-white" : ""}`}
              onClick={() => setOrdering("difficulty")}
            >
              난이도순
            </button>
            <button
              className={`badge ${ordering === "-difficulty" ? "bg-ink text-white" : ""}`}
              onClick={() => setOrdering("-difficulty")}
            >
              난이도 역순
            </button>
          </div>
        </div>
        {loading ? (
          <div className="mt-6 text-center text-slate">로딩 중...</div>
        ) : problems.length === 0 ? (
          <div className="mt-6 text-center text-slate">검색 결과가 없습니다.</div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {problems.map((problem) => {
                const imgUrl = imageUrl(problem);
                return (
                  <div
                    key={problem.id}
                    className="rounded-3xl bg-white/70 p-4 cursor-pointer hover:shadow-lg transition"
                    onClick={() => handleProblemClick(problem.id)}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt="문제" className="h-36 w-full rounded-2xl object-cover" />
                    ) : (
                      <div className="h-36 rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
                    )}
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="font-display text-lg">
                        {getTagValue(problem, "subject")} {getTagValue(problem, "chapter")}
                      </p>
                      <p className="text-slate">
                        {getTagValue(problem, "type")} · 난이도 {problem.difficulty || "-"}
                      </p>
                    </div>
                    <button
                      className="mt-4 w-full rounded-full border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProblemClick(problem.id);
                      }}
                    >
                      상세보기
                    </button>
                  </div>
                );
              })}
            </div>
            {/* 페이지네이션은 간단히 구현 */}
            {totalCount > 20 && (
              <div className="mt-6 flex justify-center gap-2 text-sm">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-ink/20 px-3 py-1 disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-3 py-1">{page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={problems.length < 20}
                  className="rounded-full border border-ink/20 px-3 py-1 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 조건 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="section-title mb-4">검색 조건 저장</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate">조건 이름 *</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  placeholder="예: 중간고사_국어_객관식"
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
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
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">저장된 조건 불러오기</h3>
              <button
                onClick={() => setShowLoadModal(false)}
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
                          problemSearchConditionsApi.delete(condition.id).then(() => {
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
