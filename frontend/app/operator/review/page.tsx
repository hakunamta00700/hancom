"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { reviewApi } from "@/lib/api/review";
import type { ReviewTask, Problem } from "@/lib/api/review";
import { apiClient } from "@/lib/api/client";

export default function ReviewPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ReviewTask | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, in_progress: 0 });
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  
  // 필터링 및 정렬 상태
  const [statusFilter, setStatusFilter] = useState("pending");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [minConfidence, setMinConfidence] = useState("");
  const [ordering, setOrdering] = useState<"-created_at" | "created_at" | "confidence" | "-confidence">("-created_at");
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadSubjects();
    loadTasks();
    loadStats();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, subjectFilter, minConfidence, ordering]);

  useEffect(() => {
    if (currentTask) {
      loadProblem(currentTask.problem);
    }
  }, [currentTask]);

  const loadSubjects = async () => {
    try {
      const { subjectsApi } = await import("@/lib/api/subjects");
      const data = await subjectsApi.list();
      setSubjects(data.map((s) => ({ id: s.id, name: s.name })));
    } catch (err) {
      console.error("과목 로드 실패:", err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.list({
        status: statusFilter || undefined,
        subject_id: subjectFilter || undefined,
        min_confidence: minConfidence ? parseFloat(minConfidence) : undefined,
        ordering,
      });
      setTasks(response.results);
      if (response.results.length > 0 && !currentTask) {
        setCurrentTask(response.results[0]);
      } else if (response.results.length === 0) {
        setCurrentTask(null);
        setCurrentProblem(null);
      }
    } catch (err) {
      console.error("작업 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProblem = async (problemId: string) => {
    try {
      const problem = await reviewApi.getProblem(problemId);
      setCurrentProblem(problem);
    } catch (err) {
      console.error("문항 로드 실패:", err);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reviewApi.stats();
      setStats(statsData);
    } catch (err) {
      console.error("통계 로드 실패:", err);
    }
  };

  const handleApprove = async () => {
    if (!currentTask) return;
    try {
      await reviewApi.approve(currentTask.id);
      await loadTasks();
      await loadStats();
      if (tasks.length > 1) {
        const nextIndex = tasks.findIndex((t) => t.id === currentTask.id) + 1;
        if (nextIndex < tasks.length) {
          setCurrentTask(tasks[nextIndex]);
        } else {
          setCurrentTask(null);
          setCurrentProblem(null);
        }
      } else {
        setCurrentTask(null);
        setCurrentProblem(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "승인 실패");
    }
  };

  const handleReject = async () => {
    if (!currentTask) return;
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }
    try {
      await reviewApi.reject(currentTask.id, rejectReason);
      setRejectReason("");
      await loadTasks();
      await loadStats();
      if (tasks.length > 1) {
        const nextIndex = tasks.findIndex((t) => t.id === currentTask.id) + 1;
        if (nextIndex < tasks.length) {
          setCurrentTask(tasks[nextIndex]);
        } else {
          setCurrentTask(null);
          setCurrentProblem(null);
        }
      } else {
        setCurrentTask(null);
        setCurrentProblem(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "반려 실패");
    }
  };

  const imageUrl = currentProblem?.image_file
    ? `${apiClient["baseURL"]}${currentProblem.image_file}`
    : null;
  
  const originalDocumentUrl = currentProblem?.source_document_info?.file
    ? `${apiClient["baseURL"]}${currentProblem.source_document_info.file}`
    : null;
  
  const isPdf = currentProblem?.source_document_info?.file_type === "PDF";

  return (
    <AppShell title="검수 작업" role="operator">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="badge">검수 대기 {stats.pending}개</div>
          <div className="badge">검수 완료 {stats.approved}개</div>
        </div>
        
        {/* 필터링 및 정렬 UI */}
        <div className="grid gap-4 md:grid-cols-4">
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">상태: 대기 중</option>
            <option value="in_progress">상태: 진행 중</option>
            <option value="approved">상태: 승인됨</option>
            <option value="rejected">상태: 반려됨</option>
          </select>
          
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">과목: 전체</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="최소 신뢰도 (0-100)"
            value={minConfidence}
            onChange={(e) => setMinConfidence(e.target.value)}
          />
          
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value as typeof ordering)}
          >
            <option value="-created_at">정렬: 최신순</option>
            <option value="created_at">정렬: 오래된순</option>
            <option value="confidence">정렬: 신뢰도 높은순</option>
            <option value="-confidence">정렬: 신뢰도 낮은순</option>
          </select>
        </div>
        {loading ? (
          <div className="text-center text-slate">로딩 중...</div>
        ) : !currentTask || !currentProblem ? (
          <div className="text-center text-slate">검수 대기 문항이 없습니다.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              {imageUrl && (
                <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                  <p className="text-sm text-slate">크롭된 문항 이미지</p>
                  <img src={imageUrl} alt="문제" className="mt-3 w-full rounded-2xl" />
                </div>
              )}
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm text-slate">추출된 텍스트</p>
                <textarea
                  className="mt-3 h-40 w-full rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm"
                  value={JSON.stringify(currentProblem.text_content || {}, null, 2)}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm text-slate">자동 태깅 결과</p>
                <div className="mt-3 grid gap-3">
                  {currentProblem.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm"
                    >
                      <span className="text-slate">{tag.category}</span>
                      <span>{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 메타데이터 입력 폼 */}
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate">메타데이터 입력</p>
                  <button
                    onClick={() => setShowMetadataForm(!showMetadataForm)}
                    className="text-xs text-ink hover:underline"
                  >
                    {showMetadataForm ? "접기" : "펼치기"}
                  </button>
                </div>
                {showMetadataForm && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                        placeholder="연도"
                        value={metadataExamYear}
                        onChange={(e) => setMetadataExamYear(e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        max="12"
                        className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                        placeholder="월"
                        value={metadataExamMonth}
                        onChange={(e) => setMetadataExamMonth(e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                        placeholder="회차"
                        value={metadataExamRound}
                        onChange={(e) => setMetadataExamRound(e.target.value)}
                      />
                    </div>
                    <textarea
                      className="w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                      rows={3}
                      placeholder="저작권 정보"
                      value={metadataCopyright}
                      onChange={(e) => setMetadataCopyright(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        // TODO: 메타데이터 저장 API 호출
                        alert("메타데이터 저장 기능은 추후 구현 예정입니다.");
                      }}
                      className="w-full rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
                    >
                      메타데이터 저장
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
                <p className="text-sm text-slate">반려 사유</p>
                <textarea
                  className="mt-3 h-24 w-full rounded-2xl border border-ink/10 bg-white/80 p-3 text-sm"
                  placeholder="반려 사유를 입력하세요..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-2">
                <button
                  onClick={handleReject}
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-coral/10"
                >
                  반려
                </button>
                <button
                  onClick={handleApprove}
                  className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
                >
                  승인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
