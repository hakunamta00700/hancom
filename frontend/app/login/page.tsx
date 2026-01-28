import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
      <div className="grid w-full gap-10 rounded-[32px] border border-white/80 bg-white/70 p-10 shadow-card md:grid-cols-2">
        <div className="space-y-6">
          <p className="badge">로그인</p>
          <h1 className="font-display text-4xl text-ink">학원 문제 제출기</h1>
          <p className="text-sm text-slate">
            운영자, 교사, 학생 역할에 맞춘 업무 흐름을 한 번에.
          </p>
          <div className="rounded-3xl bg-ink/90 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em]">Quick Links</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/operator" className="hover:text-sun">운영자 콘솔</Link>
              <Link href="/teacher" className="hover:text-sun">교사 콘솔</Link>
              <Link href="/student" className="hover:text-sun">학생 화면</Link>
            </div>
          </div>
        </div>
        <form className="space-y-5">
          <div>
            <label className="text-sm text-slate">이메일</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="teacher@academy.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-sm text-slate">비밀번호</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="********"
              type="password"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" />
              자동 로그인
            </label>
            <button type="button" className="text-teal">비밀번호를 잊으셨나요?</button>
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-ink px-4 py-3 text-white shadow-soft"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}
