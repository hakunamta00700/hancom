import { AppShell } from "@/components/AppShell";

const selected = [
  { id: 1, label: "국어 문학 객관식 3" },
  { id: 2, label: "국어 문법 객관식 2" },
  { id: 3, label: "국어 독서 객관식 4" },
];

export default function ExamBuilderPage() {
  return (
    <AppShell title="시험지 제작" role="teacher">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">시험지 정보</h2>
            <div className="mt-4 space-y-4">
              <input className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" placeholder="중간고사_국어_1학년" />
              <textarea className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" rows={3} placeholder="설명" />
            </div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">조건 설정</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <option>과목: 국어</option>
              </select>
              <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <option>단원: 전체</option>
              </select>
              <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <option>유형: 객관식</option>
              </select>
              <input className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm" placeholder="난이도 1-5" />
              <input className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm" placeholder="총 문제 수 20" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate">난이도 분포</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm" placeholder="쉬움 30%" />
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm" placeholder="보통 50%" />
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm" placeholder="어려움 20%" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">자동 추천</button>
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">검색으로 찾기</button>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">선택된 문항 (5/20)</h2>
            <div className="mt-4 space-y-3">
              {selected.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm">
                  <span>{item.id}. {item.label}</span>
                  <div className="flex gap-2 text-xs">
                    <button className="rounded-full border border-ink/20 px-2 py-1">삭제</button>
                    <button className="rounded-full border border-ink/20 px-2 py-1">↑</button>
                    <button className="rounded-full border border-ink/20 px-2 py-1">↓</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">난이도 분포</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { label: "쉬움", value: "20%" },
                { label: "보통", value: "40%" },
                { label: "어려움", value: "20%" },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-slate">
                    <span>{bar.label}</span>
                    <span>{bar.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink/10">
                    <div className="h-2 rounded-full bg-teal" style={{ width: bar.value }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">미리보기</button>
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">저장</button>
              <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">PDF 생성</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
