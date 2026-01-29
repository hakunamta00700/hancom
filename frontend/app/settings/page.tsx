"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth/api";
import type { User } from "@/lib/auth/types";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        setName(userData.name);
      } catch {
        router.push("/login");
      }
    };
    loadUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const updated = await authApi.updateProfile({ name });
      setUser(updated);
      setSuccess("프로필이 업데이트되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(oldPassword, newPassword);
      setSuccess("비밀번호가 변경되었습니다.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-display text-3xl text-ink">설정</h1>

      <div className="mt-8 space-y-8">
        {/* 프로필 정보 */}
        <section className="card p-6">
          <h2 className="section-title">프로필 정보</h2>
          <form className="mt-4 space-y-4" onSubmit={handleUpdateProfile}>
            {error && (
              <div className="rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl bg-teal/10 border border-teal/30 px-4 py-3 text-sm text-teal">
                {success}
              </div>
            )}
            <div>
              <label className="text-sm text-slate">이메일</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                type="email"
                value={user.email}
                disabled
              />
            </div>
            <div>
              <label className="text-sm text-slate">이름</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm text-slate">역할</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                type="text"
                value={user.role}
                disabled
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              저장
            </button>
          </form>
        </section>

        {/* 비밀번호 변경 */}
        <section className="card p-6">
          <h2 className="section-title">비밀번호 변경</h2>
          <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
            <div>
              <label className="text-sm text-slate">현재 비밀번호</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm text-slate">새 비밀번호</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm text-slate">새 비밀번호 확인</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
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
              disabled={loading}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              비밀번호 변경
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
