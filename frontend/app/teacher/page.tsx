import { AppShell } from "@/components/AppShell";
import { ActivityList, StatCard } from "@/components/Widgets";

export default function TeacherDashboard() {
  return (
    <AppShell title="교사 대시보드" role="teacher">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="보관 문항" value="8,240" trend="검색 저장 24건" />
        <StatCard label="시험지" value="32" trend="이번 달 5건 제작" />
        <StatCard label="공유됨" value="12" trend="동료 교사 공유" />
      </section>
      <ActivityList />
    </AppShell>
  );
}
