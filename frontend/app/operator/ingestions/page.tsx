"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ingestionJobsApi, sourceDocumentsApi } from "@/lib/api/source-documents";
import type { IngestionJob, SourceDocument } from "@/lib/api/source-documents";

const statusLabels: Record<string, string> = {
  pending: "대기 중",
  processing: "처리 중",
  completed: "완료",
  failed: "실패",
};

export default function IngestionPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [documents, setDocuments] = useState<Record<string, SourceDocument>>({});
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
    // 5초마다 진행 중인 작업 상태 갱신
    const interval = setInterval(() => {
      if (jobs.some((j) => j.status === "processing" || j.status === "pending")) {
        loadJobs();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await ingestionJobsApi.list(statusFilter);
      setJobs(response.results);

      // 소스 문서 정보 로드
      const docIds = [...new Set(response.results.map((j) => j.source_document))];
      const docPromises = docIds.map((id) => sourceDocumentsApi.get(id));
      const docs = await Promise.all(docPromises);
      const docMap: Record<string, SourceDocument> = {};
      docs.forEach((doc) => {
        docMap[doc.id] = doc;
      });
      setDocuments(docMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await ingestionJobsApi.retry(jobId);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "재시도에 실패했습니다.");
    }
  };

  return (
    <AppShell title="추출 작업 관리" role="operator">
      <div className="card p-6">
        {error && (
          <div className="mb-4 rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">작업 목록</h2>
          <div className="flex gap-2">
            {["전체", "pending", "processing", "completed", "failed"].map((status) => (
              <button
                key={status}
                className={`badge ${statusFilter === status || (status === "전체" && !statusFilter) ? "bg-ink text-white" : ""}`}
                onClick={() => setStatusFilter(status === "전체" ? undefined : status)}
              >
                {status === "전체" ? status : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="mt-6 text-center text-slate">로딩 중...</div>
        ) : jobs.length === 0 ? (
          <div className="mt-6 text-center text-slate">작업이 없습니다.</div>
        ) : (
          <>
            <div className="mt-6 space-y-3 text-sm">
              {jobs.map((job) => {
                const doc = documents[job.source_document];
                return (
                  <div
                    key={job.id}
                    className="grid grid-cols-5 items-center gap-2 rounded-2xl bg-white/70 px-4 py-3"
                  >
                    <span className="text-xs text-slate">#{job.id.slice(0, 8)}</span>
                    <span className="col-span-2">{doc?.title || "로딩 중..."}</span>
                    <span>{statusLabels[job.status] || job.status}</span>
                    <div className="flex gap-2">
                      {job.status === "failed" ? (
                        <button
                          onClick={() => handleRetry(job.id)}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs hover:bg-ink/5"
                        >
                          재시도
                        </button>
                      ) : (
                        <span className="text-xs text-slate">
                          {job.status === "processing" || job.status === "completed"
                            ? `${job.progress}%`
                            : "-"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 페이지네이션은 나중에 구현 */}
          </>
        )}
      </div>
    </AppShell>
  );
}
