"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/auth/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/70 p-10 shadow-card">
          <h1 className="font-display text-3xl text-ink">이메일 확인</h1>
          <p className="mt-4 text-sm text-slate">
            {email}로 비밀번호 재설정 링크를 전송했습니다. 이메일을 확인해주세요.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-ink px-4 py-3 text-sm text-white"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/70 p-10 shadow-card">
        <h1 className="font-display text-3xl text-ink">비밀번호 재설정</h1>
        <p className="mt-2 text-sm text-slate">
          등록된 이메일 주소를 입력하시면 재설정 링크를 보내드립니다.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-slate">이메일</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-white shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "전송 중..." : "재설정 링크 전송"}
          </button>
          <Link
            href="/login"
            className="block text-center text-sm text-teal hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </form>
      </div>
    </main>
  );
}
