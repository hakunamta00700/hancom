import { AppShell } from "@/components/AppShell";

export default function StudentExamPage() {
  return (
    <AppShell title="문제 풀이" role="student">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">문제 1 / 20</h2>
          <div className="flex gap-2 text-sm">
            <button className="rounded-full border border-ink/20 px-3 py-2">임시 저장</button>
            <button className="rounded-full bg-ink px-3 py-2 text-white">제출</button>
          </div>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
          <div className="h-56 rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-4 text-sm">
          <p>19. 다음 글의 내용과 부합하지 않는 것은?</p>
          <div className="mt-4 space-y-2">
            {[
              "선택지 1",
              "선택지 2",
              "선택지 3",
              "선택지 4",
              "선택지 5",
            ].map((choice, index) => (
              <label key={choice} className="flex items-center gap-2">
                <input type="radio" name="choice" defaultChecked={index === 2} />
                {choice}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {Array.from({ length: 10 }).map((_, index) => (
            <button key={index} className="rounded-full border border-ink/20 px-3 py-1">
              {index + 1}
            </button>
          ))}
        </div>
        <div className="flex justify-between">
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">이전 문제</button>
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">다음 문제</button>
        </div>
      </div>
    </AppShell>
  );
}
