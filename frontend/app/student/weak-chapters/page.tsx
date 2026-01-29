"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi, type WeakChapter } from "@/lib/api/student";

export default function WeakChaptersPage() {
  const router = useRouter();
  const [weakChapters, setWeakChapters] = useState<WeakChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("");

  useEffect(() => {
    loadWeakChapters();
  }, []);

  const loadWeakChapters = async () => {
    try {
      const response = await studentApi.getWeakChapters();
      setWeakChapters(response.results);
    } catch (err) {
      console.error("약점 단원 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChapters = filterSubject
    ? weakChapters.filter((chapter) => chapter.subject_id === filterSubject)
    : weakChapters;

  const subjects = Array.from(
    new Set(weakChapters.map((chapter) => chapter.subject_id))
  ).map((subjectId) => {
    const chapter = weakChapters.find((c) => c.subject_id === subjectId);
    return {
      id: subjectId,
      name: chapter?.subject_name || "",
    };
  });

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 50) return "text-coral";
    if (accuracy < 70) return "text-orange-500";
    return "text-teal";
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy < 50) return "bg-coral/10 border-coral/30 text-coral";
    if (accuracy < 70) return "bg-orange-500/10 border-orange-500/30 text-orange-500";
    return "bg-teal/10 border-teal/30 text-teal";
  };

  return (
    <AppShell title="약점 단원" role="student">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">약점 단원 분석</h2>
          <select
            className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">과목: 전체</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-slate">로딩 중...</div>
        ) : filteredChapters.length === 0 ? (
          <div className="text-center text-slate">
            {weakChapters.length === 0
              ? "약점 단원 데이터가 없습니다. 시험지를 풀어보세요."
              : "선택한 과목의 약점 단원이 없습니다."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.chapter_id}
                className="rounded-3xl border border-ink/10 bg-white/70 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge">{chapter.subject_name}</span>
                      <h3 className="font-display text-lg">{chapter.chapter_name}</h3>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate">총 문제 수:</span>
                        <span className="ml-2 font-semibold">
                          {chapter.total_problems}문제
                        </span>
                      </div>
                      <div>
                        <span className="text-slate">정답 수:</span>
                        <span className="ml-2 font-semibold">
                          {chapter.correct_answers}문제
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`badge ${getAccuracyBadge(chapter.accuracy)}`}
                    >
                      정확도 {chapter.accuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* 정확도 바 */}
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs text-slate">
                    <span>정확도</span>
                    <span>{chapter.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-ink/10">
                    <div
                      className={`h-3 rounded-full ${
                        chapter.accuracy < 50
                          ? "bg-coral"
                          : chapter.accuracy < 70
                          ? "bg-orange-500"
                          : "bg-teal"
                      }`}
                      style={{ width: `${Math.min(chapter.accuracy, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 추천 문제 링크 */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() =>
                      router.push(
                        `/teacher/search?chapter_id=${chapter.chapter_id}`
                      )
                    }
                    className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
                  >
                    추천 문제 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 약점 단원 요약 통계 */}
        {filteredChapters.length > 0 && (
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-6">
            <h3 className="text-sm font-semibold mb-4">약점 단원 요약</h3>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="rounded-2xl bg-coral/10 border border-coral/30 p-4">
                <p className="text-xs text-slate mb-1">심각한 약점</p>
                <p className="text-2xl font-bold text-coral">
                  {filteredChapters.filter((c) => c.accuracy < 50).length}개
                </p>
                <p className="text-xs text-slate mt-1">정확도 50% 미만</p>
              </div>
              <div className="rounded-2xl bg-orange-500/10 border border-orange-500/30 p-4">
                <p className="text-xs text-slate mb-1">보통 약점</p>
                <p className="text-2xl font-bold text-orange-500">
                  {filteredChapters.filter(
                    (c) => c.accuracy >= 50 && c.accuracy < 70
                  ).length}
                  개
                </p>
                <p className="text-xs text-slate mt-1">정확도 50-70%</p>
              </div>
              <div className="rounded-2xl bg-teal/10 border border-teal/30 p-4">
                <p className="text-xs text-slate mb-1">양호한 단원</p>
                <p className="text-2xl font-bold text-teal">
                  {filteredChapters.filter((c) => c.accuracy >= 70).length}개
                </p>
                <p className="text-xs text-slate mt-1">정확도 70% 이상</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
