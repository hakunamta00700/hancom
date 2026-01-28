import Link from "next/link";

export function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-[0.32em] text-slate">{label}</p>
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="text-sm text-teal">{trend}</p>
    </div>
  );
}

export function ActivityList() {
  const activities = [
    { time: "2026-01-27 10:30", text: "문항 추출 완료 - 수능 국어 모의고사" },
    { time: "2026-01-27 09:15", text: "검수 승인 - 문항 #5678" },
    { time: "2026-01-27 08:45", text: "시험지 생성 - 중간고사 국어" },
  ];
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">최근 활동</h2>
        <Link href="#" className="text-sm text-teal">모두 보기</Link>
      </div>
      <div className="mt-4 space-y-3">
        {activities.map((item) => (
          <div key={item.time} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
            <p className="text-sm text-ink">{item.text}</p>
            <span className="text-xs text-slate">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskTable() {
  const rows = [
    { id: "#1234", title: "수능_국어_2024.pdf", status: "처리 중", progress: "65%" },
    { id: "#1233", title: "모의고사_수학_1회.pdf", status: "완료", progress: "100%" },
    { id: "#1232", title: "평가원_영어_2023.pdf", status: "실패", progress: "-" },
  ];
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">추출 작업 현황</h2>
        <div className="flex gap-2 text-xs">
          <span className="badge">전체</span>
          <span className="badge">처리 중</span>
          <span className="badge">완료</span>
          <span className="badge">실패</span>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-5 items-center gap-2 rounded-2xl bg-white/70 px-4 py-3">
            <span>{row.id}</span>
            <span className="col-span-2">{row.title}</span>
            <span>{row.status}</span>
            <span className="text-right text-teal">{row.progress}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
