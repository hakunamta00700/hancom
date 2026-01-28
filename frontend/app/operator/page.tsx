import { AppShell } from "@/components/AppShell";
import { ActivityList, StatCard, TaskTable } from "@/components/Widgets";

export default function OperatorDashboard() {
  return (
    <AppShell title="운영자 대시보드" role="operator">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="총 문항 수" value="1,234" trend="+12% 이번 주" />
        <StatCard label="검수 대기" value="56" trend="24시간 내 처리 필요" />
        <StatCard label="시험지 수" value="89" trend="이번 달 14건 생성" />
      </section>
      <ActivityList />
      <TaskTable />
    </AppShell>
  );
}
