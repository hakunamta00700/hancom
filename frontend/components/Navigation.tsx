"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/hooks";

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ink text-white flex items-center justify-center font-display text-lg">
            H
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate">Hancom</p>
            <p className="font-display text-lg">Academy Studio</p>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user && (
            <>
              <span className="rounded-full bg-ink/5 px-3 py-1">
                안녕하세요, {user.name}
              </span>
              <Link
                href="/settings"
                className="rounded-full border border-ink/20 px-3 py-1 hover:bg-ink/5"
              >
                설정
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-ink/20 px-3 py-1 hover:bg-ink/5"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function RoleNav({ role }: { role: "operator" | "teacher" | "student" }) {
  const operator = [
    { href: "/operator", label: "대시보드" },
    { href: "/operator/upload", label: "파일 업로드" },
    { href: "/operator/ingestions", label: "추출 작업" },
    { href: "/operator/review", label: "검수 작업" },
    { href: "/operator/problems", label: "문항 관리" },
  ];
  const teacher = [
    { href: "/teacher", label: "대시보드" },
    { href: "/teacher/search", label: "문항 검색" },
    { href: "/teacher/exams/new", label: "시험지 제작" },
    { href: "/teacher/exams", label: "시험지 목록" },
    { href: "/teacher/classes", label: "반/학생군 관리" },
  ];
  const student = [
    { href: "/student", label: "시험지 목록" },
    { href: "/student/exams", label: "문제 풀이" },
    { href: "/student/incorrect-answers", label: "오답 노트" },
  ];

  const items = role === "operator" ? operator : role === "teacher" ? teacher : student;

  return (
    <nav className="hidden w-56 flex-col gap-2 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-soft md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-2xl px-4 py-3 text-sm text-slate transition hover:bg-ink hover:text-white"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
