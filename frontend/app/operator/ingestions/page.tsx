import { AppShell } from "@/components/AppShell";

const rows = [
  { id: "#1234", title: "수능_국어_2024", status: "처리 중", progress: "65%", action: "상세" },
  { id: "#1233", title: "모의고사_수학", status: "완료", progress: "100%", action: "상세" },
  { id: "#1232", title: "평가원_영어", status: "실패", progress: "-", action: "재시도" },
];

export default function IngestionPage() {
  return (
    <AppShell title="추출 작업 관리" role="operator">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="section-title">작업 목록</h2>
          <div className="flex gap-2">
            {"전체 처리 중 완료 실패".split(" ").map((label) => (
              <button key={label} className="badge">
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-5 items-center gap-2 rounded-2xl bg-white/70 px-4 py-3">
              <span>{row.id}</span>
              <span className="col-span-2">{row.title}</span>
              <span>{row.status}</span>
              <button className="rounded-full border border-ink/20 px-3 py-1 text-xs">{row.action}</button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-2 text-sm">
          <button className="rounded-full border border-ink/20 px-3 py-1">이전</button>
          {Array.from({ length: 5 }).map((_, index) => (
            <button key={index} className="rounded-full border border-ink/20 px-3 py-1">
              {index + 1}
            </button>
          ))}
          <button className="rounded-full border border-ink/20 px-3 py-1">다음</button>
        </div>
      </div>
    </AppShell>
  );
}
