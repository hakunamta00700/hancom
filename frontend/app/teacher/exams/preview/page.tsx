import { AppShell } from "@/components/AppShell";

export default function ExamPreviewPage() {
  return (
    <AppShell title="시험지 미리보기" role="teacher">
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-sm text-slate">중간고사_국어_1학년</p>
          <h2 className="section-title">총 20문제 · 예상 60분</h2>
        </div>
        <div className="h-96 rounded-3xl border border-ink/10 bg-white/70 flex items-center justify-center text-sm text-slate">
          PDF 미리보기 영역
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="badge">쉬움 20%</span>
          <span className="badge">보통 40%</span>
          <span className="badge">어려움 20%</span>
          <span className="badge">미분류 20%</span>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">뒤로</button>
          <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">수정</button>
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">PDF 다운로드</button>
        </div>
      </div>
    </AppShell>
  );
}
