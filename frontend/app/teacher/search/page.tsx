import { AppShell } from "@/components/AppShell";

const cards = Array.from({ length: 6 }).map((_, index) => ({
  id: index,
  subject: "국어",
  chapter: index % 2 === 0 ? "문학" : "독서",
  type: "객관식",
  difficulty: 2 + (index % 3),
}));

export default function SearchPage() {
  return (
    <AppShell title="문항 검색" role="teacher">
      <div className="card p-6">
        <h2 className="section-title">검색 조건</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <option>과목: 국어</option>
          </select>
          <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <option>단원: 전체</option>
          </select>
          <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <option>유형: 객관식</option>
          </select>
          <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <option>난이도: 전체</option>
          </select>
          <select className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <option>출제시기: 2024</option>
          </select>
          <input
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="키워드 검색"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">검색</button>
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">초기화</button>
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">조건 저장</button>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate">검색 결과 234개</p>
            <h2 className="section-title">정렬</h2>
          </div>
          <div className="flex gap-2 text-sm">
            <button className="badge">최신순</button>
            <button className="badge">난이도순</button>
            <button className="badge">출제시기순</button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-3xl bg-white/70 p-4">
              <div className="h-36 rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-display text-lg">{card.subject} {card.chapter}</p>
                <p className="text-slate">{card.type} · 난이도 {card.difficulty}</p>
              </div>
              <button className="mt-4 w-full rounded-full border border-ink/20 px-3 py-2 text-sm">선택</button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-2 text-sm">
          <button className="rounded-full border border-ink/20 px-3 py-1">이전</button>
          <button className="rounded-full border border-ink/20 px-3 py-1">1</button>
          <button className="rounded-full border border-ink/20 px-3 py-1">2</button>
          <button className="rounded-full border border-ink/20 px-3 py-1">3</button>
          <button className="rounded-full border border-ink/20 px-3 py-1">다음</button>
        </div>
      </div>
    </AppShell>
  );
}
