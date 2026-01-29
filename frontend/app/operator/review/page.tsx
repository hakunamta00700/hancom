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

  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  useEffect(() => {
    if (currentTask) {
      loadProblem(currentTask.problem);
    }
  }, [currentTask]);

  const loadTasks = async () => {
    try {
      const response = await reviewApi.list("pending");
      setTasks(response.results);
      if (response.results.length > 0 && !currentTask) {
        setCurrentTask(response.results[0]);
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

  return (
    <AppShell title="검수 작업" role="operator">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="badge">검수 대기 {stats.pending}개</div>
          <div className="badge">검수 완료 {stats.approved}개</div>
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
