"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { studentApi } from "@/lib/api/student";
import { apiClient } from "@/lib/api/client";

interface IncorrectAnswer {
  attempt_id: string;
  exam_paper_title: string;
  problem: any;
  my_answer: string | number | null;
  submitted_at: string | null;
}

export default function IncorrectAnswersPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<IncorrectAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    loadIncorrectAnswers();
  }, []);

  const loadIncorrectAnswers = async () => {
    try {
      const response = await studentApi.getIncorrectAnswers();
      setAnswers(response.results);
    } catch (err) {
      console.error("오답 노트 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnswers = answers.filter((answer) => {
    if (filterSubject && answer.problem.tags) {
      const subjectTag = answer.problem.tags.find((t: any) => t.category === "subject");
      if (subjectTag && subjectTag.name !== filterSubject) return false;
    }
    if (filterDate && answer.submitted_at) {
      const answerDate = new Date(answer.submitted_at).toLocaleDateString();
      if (answerDate !== filterDate) return false;
    }
    return true;
  });

  const imageUrl = (problem: any) => {
    if (problem.image_file) {
      return `${apiClient["baseURL"]}${problem.image_file}`;
    }
    return null;
  };

  const getTagValue = (problem: any, category: string) => {
    const tag = problem.tags?.find((t: any) => t.category === category);
    return tag?.name || "-";
  };

  return (
    <AppShell title="오답 노트" role="student">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">오답 노트 ({filteredAnswers.length}개)</h2>
          <div className="flex gap-2 text-sm">
            <select
              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">과목: 전체</option>
              <option value="국어">국어</option>
              <option value="수학">수학</option>
              <option value="영어">영어</option>
            </select>
            <input
              type="date"
              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate">로딩 중...</div>
        ) : filteredAnswers.length === 0 ? (
          <div className="text-center text-slate">오답 노트가 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {filteredAnswers.map((answer, index) => {
              const imgUrl = imageUrl(answer.problem);
              return (
                <div key={index} className="rounded-3xl border border-ink/10 bg-white/70 p-6">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-display text-lg">{answer.exam_paper_title}</p>
                      <p className="text-slate">
                        {getTagValue(answer.problem, "subject")} · {getTagValue(answer.problem, "chapter")}
                      </p>
                      {answer.submitted_at && (
                        <p className="text-xs text-slate">
                          제출일: {new Date(answer.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {imgUrl && (
                    <div className="mb-4 rounded-2xl border border-ink/10 bg-white/80 p-4">
                      <img src={imgUrl} alt="문제" className="w-full rounded-xl" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-coral/10 border border-coral/30 p-4">
                      <p className="text-sm font-semibold text-coral mb-2">내 답안</p>
                      <p className="text-sm">
                        {typeof answer.my_answer === "number"
                          ? `선택지 ${answer.my_answer}`
                          : answer.my_answer || "답안 없음"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-teal/10 border border-teal/30 p-4">
                      <p className="text-sm font-semibold text-teal mb-2">정답</p>
                      <p className="text-sm">
                        {answer.problem.text_content?.choices?.find((c: any) => c.is_correct)?.number ||
                          "정답 정보 없음"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => router.push(`/student/exams/${answer.attempt_id}/result`)}
                      className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
                    >
                      결과 보기
                    </button>
                    <button
                      onClick={() => {
                        // 오답 문제 재풀이 기능 (추후 구현)
                        alert("재풀이 기능은 추후 구현 예정입니다.");
                      }}
                      className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
                    >
                      재풀이
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
