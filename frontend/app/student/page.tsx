import { AppShell } from "@/components/AppShell";

const exams = [
  { title: "중간고사_국어_1학년", total: 20, time: 60, date: "2026-01-27" },
  { title: "기말고사_수학_1학년", total: 25, time: 90, date: "2026-01-25" },
];

export default function StudentHome() {
  return (
    <AppShell title="시험지 목록" role="student">
      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <div key={exam.title} className="card p-6">
            <h3 className="font-display text-xl">{exam.title}</h3>
            <p className="mt-2 text-sm text-slate">총 {exam.total}문제 · 제한시간 {exam.time}분</p>
            <p className="mt-1 text-xs text-slate">배포일 {exam.date}</p>
            <button className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-white">시작하기</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
