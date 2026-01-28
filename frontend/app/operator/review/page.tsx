import { AppShell } from "@/components/AppShell";

export default function ReviewPage() {
  return (
    <AppShell title="검수 작업" role="operator">
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="badge">검수 대기 56개</div>
          <div className="badge">검수 완료 1,178개</div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <p className="text-sm text-slate">원문 이미지</p>
              <div className="mt-3 h-56 rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
            </div>
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <p className="text-sm text-slate">크롭된 문항 이미지</p>
              <div className="mt-3 h-56 rounded-2xl bg-gradient-to-br from-slate-100 to-white" />
            </div>
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <p className="text-sm text-slate">추출된 텍스트</p>
              <textarea className="mt-3 h-40 w-full rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm" defaultValue="19. 다음 글의 내용과 부합하지 않는 것은?" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <p className="text-sm text-slate">자동 태깅 결과</p>
              <div className="mt-3 grid gap-3">
                {[
                  { label: "과목", value: "국어" },
                  { label: "단원", value: "문학" },
                  { label: "유형", value: "객관식" },
                  { label: "난이도", value: "3" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm">
                    <span className="text-slate">{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <p className="text-sm text-slate">메타데이터</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2" placeholder="2024" />
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2" placeholder="3" />
                <input className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2" placeholder="1" />
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">반려</button>
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">수정 후 재제출</button>
              <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">승인</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
