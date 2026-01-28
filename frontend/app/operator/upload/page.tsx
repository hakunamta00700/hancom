import { AppShell } from "@/components/AppShell";

export default function UploadPage() {
  return (
    <AppShell title="파일 업로드" role="operator">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <div className="rounded-3xl border border-dashed border-ink/30 bg-white/60 p-10 text-center">
            <p className="font-display text-xl">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="mt-2 text-sm text-slate">PDF, PNG, JPG (최대 50MB)</p>
            <button className="mt-6 rounded-full bg-ink px-5 py-2 text-sm text-white">파일 선택</button>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { name: "수능_국어_2024.pdf", size: "50MB" },
              { name: "모의고사_수학_1회.pdf", size: "30MB" },
            ].map((file) => (
              <div key={file.name} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{file.name}</p>
                  <p className="text-xs text-slate">{file.size}</p>
                </div>
                <button className="text-xs text-coral">삭제</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="section-title">소스 문서 정보</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-slate">제목</label>
              <input className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-slate">출처</label>
              <input className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-slate">출제 연도</label>
                <input className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" placeholder="2024" />
              </div>
              <div>
                <label className="text-sm text-slate">월</label>
                <input className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" placeholder="3" />
              </div>
              <div>
                <label className="text-sm text-slate">회차</label>
                <input className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" placeholder="1" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate">저작권 정보</label>
              <textarea className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3" rows={4} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">취소</button>
              <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">업로드 및 추출 시작</button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
