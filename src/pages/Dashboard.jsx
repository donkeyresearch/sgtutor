import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import {
  RiGroupLine, RiCalendarLine, RiBankCardLine,
  RiLineChartLine, RiTimeLine, RiAlertLine,
} from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { students as studentStore, sessions as sessionStore, payments as paymentStore } from "@/lib/storage";
import { formatCurrency, formatDate, formatTime, getInitials, getCurrentMonthRange } from "@/lib/utils";

const earningsConfig = {
  amount: { label: "Earnings (SGD)", color: "var(--primary)" },
};

const paymentStatusConfig = {
  paid: { label: "Paid", color: "#3b4fd8" },
  pending: { label: "Pending", color: "#6b7ff0" },
  overdue: { label: "Overdue", color: "#a5aefc" },
  waived: { label: "Waived", color: "#d0d5fd" },
};

function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const allStudents = studentStore.getAll();
  const allSessions = sessionStore.getAll();
  const allPayments = paymentStore.getAll();

  const { start, end } = getCurrentMonthRange();

  const thisMonthSessions = allSessions.filter((s) => s.date >= start && s.date <= end);
  const completedThisMonth = thisMonthSessions.filter((s) => s.status === "completed");

  const totalEarnings = useMemo(() => {
    return allPayments
      .filter((p) => p.status === "paid" && p.paidDate >= start && p.paidDate <= end)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [allPayments, start, end]);

  const pendingAmount = useMemo(() => {
    return allPayments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [allPayments]);

  const overdueCount = allPayments.filter((p) => p.status === "overdue").length;

  // Upcoming sessions (next 7 days)
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const upcomingSessions = allSessions
    .filter((s) => s.status === "upcoming" && s.date >= today && s.date <= nextWeekStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  // Monthly earnings chart (last 6 months)
  const earningsChart = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const mStart = d.toISOString().split("T")[0];
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-SG", { month: "short" });
      const amount = allPayments
        .filter((p) => p.status === "paid" && p.paidDate >= mStart && p.paidDate <= mEnd)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      months.push({ month: label, amount });
    }
    return months;
  }, [allPayments]);

  // Payment status breakdown
  const paymentPie = useMemo(() => {
    const counts = { paid: 0, pending: 0, overdue: 0, waived: 0 };
    allPayments.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [allPayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Students" value={allStudents.length} sub="Active this month" icon={RiGroupLine} />
        <StatCard
          title="Sessions This Month"
          value={completedThisMonth.length}
          sub={`${thisMonthSessions.length} total scheduled`}
          icon={RiCalendarLine}
        />
        <StatCard
          title="Earnings (MTD)"
          value={formatCurrency(totalEarnings)}
          sub="This month, paid"
          icon={RiLineChartLine}
        />
        <StatCard
          title="Pending Collection"
          value={formatCurrency(pendingAmount)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : "All on time"}
          icon={RiBankCardLine}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Earnings</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={earningsConfig} className="h-[200px] w-full">
              <BarChart data={earningsChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(val) => [`$${val}`, ""]} />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status</CardTitle>
            <CardDescription>All sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentStatusConfig} className="h-[160px] w-full">
              <PieChart>
                <Pie
                  data={paymentPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {paymentPie.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={paymentStatusConfig[entry.name.toLowerCase()]?.color}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            {/* Inline legend matching the dot pattern */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {paymentPie.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: paymentStatusConfig[entry.name.toLowerCase()]?.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name} · {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming sessions + alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming sessions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <Link to="/schedule">
                <Button variant="ghost" size="sm" className="text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions</p>
            ) : (
              upcomingSessions.map((session) => {
                const student = studentStore.getById(session.studentId);
                return (
                  <div key={session.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{student ? getInitials(student.name) : "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{student?.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{formatDate(session.date)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(session.time)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Overdue payments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <RiAlertLine className="h-4 w-4 text-muted-foreground" />
                Overdue Payments
              </CardTitle>
              <Link to="/payments">
                <Button variant="ghost" size="sm" className="text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const overdues = allPayments.filter((p) => p.status === "overdue");
              if (overdues.length === 0) return (
                <p className="text-sm text-muted-foreground text-center py-4">All payments up to date 🎉</p>
              );
              return overdues.slice(0, 4).map((payment) => {
                const student = studentStore.getById(payment.studentId);
                return (
                  <div key={payment.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-red-50 text-red-600">{student ? getInitials(student.name) : "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{student?.subject}</p>
                    </div>
                    <Badge variant="overdue">{formatCurrency(payment.amount)}</Badge>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
