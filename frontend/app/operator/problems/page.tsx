import { AppShell } from "@/components/AppShell";

const problems = Array.from({ length: 6 }).map((_, index) => ({
  id: 5600 + index,
  subject: "국어",
  type: "객관식",
  difficulty: 3 + (index % 2),
  status: index % 2 === 0 ? "검수 완료" : "검수 대기",
}));

export default function ProblemsPage() {
  return (
    <AppShell title="문항 관리" role="operator">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">문항 목록</h2>
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">문항 등록</button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {problems.map((problem) => (
            <div key={problem.id} className="rounded-3xl bg-white/70 p-4">
              <p className="text-xs text-slate">문항 #{problem.id}</p>
              <p className="mt-2 font-display text-xl">{problem.subject} · {problem.type}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="badge">난이도 {problem.difficulty}</span>
                <span className="badge">{problem.status}</span>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <button className="rounded-full border border-ink/20 px-3 py-1">상세</button>
                <button className="rounded-full border border-ink/20 px-3 py-1">편집</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
