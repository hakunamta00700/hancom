"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/auth/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.login({ email, password });
      // 사용자 정보를 가져와서 역할에 따라 리다이렉트
      const user = await authApi.getMe();
      const roleRoutes: Record<string, string> = {
        admin: "/operator",
        operator: "/operator",
        teacher: "/teacher",
        student: "/student",
      };
      router.push(roleRoutes[user.role] || "/operator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-slate">이메일</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="teacher@academy.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm text-slate">비밀번호</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="********"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              자동 로그인
            </label>
            <Link href="/forgot-password" className="text-teal hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-white shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
