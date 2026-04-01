import { useState, useEffect, useMemo } from "react";
import {
  RiCheckLine, RiTimeLine, RiAlertLine,
  RiArrowDownSLine, RiExternalLinkLine, RiMoneyDollarCircleLine,
  RiMessage2Line,
} from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { payments as paymentStore, sessions as sessionStore, students as studentStore } from "@/lib/storage";
import { formatCurrency, formatDate, formatTime, getInitials, getCurrentMonthRange } from "@/lib/utils";

const METHOD_OPTIONS = ["PayLah", "PayNow", "Cash", "Bank Transfer", "Other"];

function PaymentRow({ payment, session, student, onMarkPaid }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{student ? getInitials(student.name) : "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{student?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">
            {session ? `${formatDate(session.date)} · ${formatTime(session.time)}` : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold">{formatCurrency(payment.amount)}</span>
          {(payment.status === "pending" || payment.status === "overdue") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onMarkPaid(payment); }}
            >
              <RiCheckLine className="h-3 w-3" />
              Paid
            </Button>
          )}
          {payment.status === "paid" && <Badge variant={payment.status}>{payment.status}</Badge>}
          <RiArrowDownSLine className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-3.5 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Subject</p><p className="font-medium">{student?.subject}</p></div>
            <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{session?.duration}h</p></div>
            <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-medium">{formatCurrency(student?.ratePerHour)}/hr</p></div>
            <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium">{payment.method || "—"}</p></div>
            {payment.paidDate && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Paid On</p>
                <p className="font-medium">{formatDate(payment.paidDate)}</p>
              </div>
            )}
          </div>

          {(payment.status === "pending" || payment.status === "overdue") && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onMarkPaid(payment); }}
              >
                <RiCheckLine className="h-3.5 w-3.5" />
                Mark as Paid
              </Button>
              <Button
                size="sm"
                variant="whatsapp"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (student) {
                    const msg = `Hi ${student.parentName}, gentle reminder that payment of ${formatCurrency(payment.amount)} for ${student.name}'s ${student.subject} session on ${formatDate(session?.date)} is due. Thank you!`;
                    window.open(`https://wa.me/65${student.parentPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                  }
                }}
              >
                <RiExternalLinkLine className="h-3.5 w-3.5" />
                Chase via WA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Payments() {
  const [allPayments, setAllPayments] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [markingPaid, setMarkingPaid] = useState(null);
  const [payMethod, setPayMethod] = useState("PayLah");
  const [filterStudent, setFilterStudent] = useState("all");

  const load = () => {
    setAllPayments(paymentStore.getAll());
    setAllSessions(sessionStore.getAll());
    setAllStudents(studentStore.getAll());
  };

  useEffect(() => { load(); }, []);

  const { start, end } = getCurrentMonthRange();

  const stats = useMemo(() => {
    const paid = allPayments.filter((p) => p.status === "paid" && p.paidDate >= start && p.paidDate <= end).reduce((s, p) => s + Number(p.amount), 0);
    const pending = allPayments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    const overdue = allPayments.filter((p) => p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);
    return { paid, pending, overdue, overdueCount: allPayments.filter((p) => p.status === "overdue").length };
  }, [allPayments, start, end]);

  const enriched = useMemo(() => {
    return allPayments.map((p) => ({
      payment: p,
      session: allSessions.find((s) => s.id === p.sessionId) || null,
      student: allStudents.find((s) => s.id === p.studentId) || null,
    }));
  }, [allPayments, allSessions, allStudents]);

  const filtered = useMemo(() => {
    return enriched
      .filter(({ payment, student }) => {
        const matchTab =
          activeTab === "all" ||
          payment.status === activeTab;
        const matchStudent =
          filterStudent === "all" || payment.studentId === filterStudent;
        return matchTab && matchStudent;
      })
      .sort((a, b) => {
        // Sort overdue/pending first, then by date desc
        const order = { overdue: 0, pending: 1, paid: 2, waived: 3 };
        return (order[a.payment.status] ?? 4) - (order[b.payment.status] ?? 4) ||
          (b.session?.date || "").localeCompare(a.session?.date || "");
      });
  }, [enriched, activeTab, filterStudent]);

  const handleMarkPaid = () => {
    paymentStore.markPaid(markingPaid.id);
    paymentStore.update(markingPaid.id, { method: payMethod });
    setMarkingPaid(null);
    load();
  };

  // Monthly earnings per student
  const studentEarnings = useMemo(() => {
    return allStudents.map((s) => {
      const total = allPayments
        .filter((p) => p.studentId === s.id && p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = allPayments
        .filter((p) => p.studentId === s.id && (p.status === "pending" || p.status === "overdue"))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      return { student: s, total, pending };
    }).sort((a, b) => b.total - a.total);
  }, [allStudents, allPayments]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">Track and manage tuition fees</p>
        </div>
        {stats.overdueCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              const overdueItems = enriched.filter(({ payment }) => payment.status === "overdue");
              overdueItems.forEach(({ student, payment, session }) => {
                if (!student) return;
                const msg = `Hi ${student.parentName}, gentle reminder that payment of ${formatCurrency(payment.amount)} for ${student.name}'s ${student.subject} session on ${formatDate(session?.date)} is outstanding. Thank you!`;
                window.open(`https://wa.me/65${student.parentPhone}?text=${encodeURIComponent(msg)}`, "_blank");
              });
            }}
          >
            <RiMessage2Line className="h-4 w-4" />
            Chase {stats.overdueCount} Overdue
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium">Collected</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium">Pending</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium">Overdue</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(stats.overdue)}</p>
            {stats.overdueCount > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{stats.overdueCount} sessions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-student breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Earnings by Student</CardTitle>
          <CardDescription>All time collected vs pending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {studentEarnings.map(({ student, total, pending }) => (
            <div key={student.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{student.name}</p>
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    <span className="font-semibold">{formatCurrency(total)}</span>
                    {pending > 0 && <span className="text-muted-foreground">+{formatCurrency(pending)}</span>}
                  </div>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: total + pending > 0 ? `${(total / (total + pending)) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payments list */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-2.5 h-6">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-2.5 h-6">Pending</TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs px-2.5 h-6">Overdue</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs px-2.5 h-6">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {allStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <RiMoneyDollarCircleLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payments in this category</p>
            </div>
          ) : (
            filtered.map(({ payment, session, student }) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                session={session}
                student={student}
                onMarkPaid={setMarkingPaid}
              />
            ))
          )}
        </div>
      </div>

      {/* Mark paid modal */}
      <Dialog open={!!markingPaid} onOpenChange={(o) => !o && setMarkingPaid(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>Select the payment method used.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-xl font-bold">{formatCurrency(markingPaid?.amount)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Payment Method</p>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingPaid(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} className="bg-green-600 hover:bg-green-700 text-white">
              <RiCheckLine className="h-4 w-4" />
              Confirm Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
