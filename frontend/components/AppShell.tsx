import Link from "next/link";
import { ReactNode } from "react";
import { RoleNav, TopNav } from "./Navigation";

interface AppShellProps {
  title: string;
  role: "operator" | "teacher" | "student";
  children: ReactNode;
}

export function AppShell({ title, role, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-8">
        <RoleNav role={role} />
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="badge">{role.toUpperCase()} CONSOLE</p>
              <h1 className="section-title mt-3 text-3xl">{title}</h1>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-ink/20 bg-white/80 px-4 py-2 text-sm shadow-soft"
            >
              로그아웃
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
