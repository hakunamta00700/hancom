"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { problemsApi } from "@/lib/api/problems";
import type { Problem } from "@/lib/api/problems";
import { apiClient } from "@/lib/api/client";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  const loadProblem = async () => {
    try {
      const data = await problemsApi.get(problemId);
      setProblem(data);
    } catch (err) {
      console.error("문항 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = problem?.image_file
    ? `${apiClient["baseURL"]}${problem.image_file}`
    : null;

  const getTagValue = (category: string) => {
    const tag = problem?.tags.find((t) => t.category === category);
    return tag?.name || "-";
  };

  if (loading) {
    return (
      <AppShell title="문항 상세" role="teacher">
        <div className="card p-6 text-center text-slate">로딩 중...</div>
      </AppShell>
    );
  }

  if (!problem) {
    return (
      <AppShell title="문항 상세" role="teacher">
        <div className="card p-6 text-center text-slate">문항을 찾을 수 없습니다.</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="문항 상세" role="teacher">
      <div className="card p-6 space-y-6">
        {imageUrl && (
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm text-slate mb-3">문항 이미지</p>
            <img src={imageUrl} alt="문제" className="w-full rounded-2xl" />
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm text-slate mb-3">메타데이터</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">과목:</span>
                <span>{getTagValue("subject")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">단원:</span>
                <span>{getTagValue("chapter")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">유형:</span>
                <span>{getTagValue("type")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">난이도:</span>
                <span>{problem.difficulty || "-"}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm text-slate mb-3">추출된 텍스트</p>
            <pre className="text-xs bg-white/80 p-3 rounded-2xl overflow-auto max-h-48">
              {JSON.stringify(problem.text_content || {}, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm"
          >
            돌아가기
          </button>
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">
            시험지에 추가
          </button>
        </div>
      </div>
    </AppShell>
  );
}
