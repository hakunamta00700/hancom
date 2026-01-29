"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/auth/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("유효하지 않은 링크입니다.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (!token) {
      setError("유효하지 않은 링크입니다.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/70 p-10 shadow-card">
          <h1 className="font-display text-3xl text-ink">비밀번호 재설정 완료</h1>
          <p className="mt-4 text-sm text-slate">
            비밀번호가 성공적으로 재설정되었습니다. 로그인 페이지로 이동합니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/70 p-10 shadow-card">
        <h1 className="font-display text-3xl text-ink">비밀번호 재설정</h1>
        <p className="mt-2 text-sm text-slate">새 비밀번호를 입력해주세요.</p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm text-slate">새 비밀번호</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="최소 8자 이상"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm text-slate">비밀번호 확인</label>
            <input
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
              placeholder="비밀번호를 다시 입력하세요"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-white shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "처리 중..." : "비밀번호 재설정"}
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
