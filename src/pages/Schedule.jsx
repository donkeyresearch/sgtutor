import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, BookOpen, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sessions as sessionStore, students as studentStore, payments as paymentStore } from "@/lib/storage";
import { formatTime, getInitials, getWeekDates, formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = ["upcoming", "completed", "no-show", "cancelled"];
const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_FORM = { studentId: "", date: "", time: "10:00", duration: "1", status: "upcoming", notes: "" };

function SessionForm({ initial, students, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    studentId: initial.studentId,
    date: initial.date,
    time: initial.time,
    duration: String(initial.duration),
    status: initial.status,
    notes: initial.notes || "",
  } : EMPTY_FORM);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSelect = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const valid = form.studentId && form.date && form.time && form.duration;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }} className="space-y-4 mt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Student *</Label>
          <Select value={form.studentId} onValueChange={setSelect("studentId")}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} — {s.subject} ({s.level})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={set("date")} required />
        </div>
        <div className="space-y-1.5">
          <Label>Time *</Label>
          <Input type="time" value={form.time} onChange={set("time")} required />
        </div>
        <div className="space-y-1.5">
          <Label>Duration (hours) *</Label>
          <Select value={form.duration} onValueChange={setSelect("duration")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{d}h</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={setSelect("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea placeholder="Topics covered, homework assigned..." value={form.notes} onChange={set("notes")} className="h-20" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!valid}>Save Session</Button>
      </DialogFooter>
    </form>
  );
}

function SessionCard({ session, student, onEdit, onDelete }) {
  const payment = paymentStore.getBySession(session.id);

  return (
    <div
      className="group flex gap-2.5 p-2.5 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onEdit(session)}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{student ? getInitials(student.name) : "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold truncate">{student?.name || "Unknown"}</p>
          <Badge variant={session.status} className="text-[10px] shrink-0">{session.status.replace("-", " ")}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <BookOpen className="h-3 w-3" />{student?.subject}
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />{formatTime(session.time)} · {session.duration}h
        </p>
        {payment && (
          <Badge variant={payment.status} className="text-[10px] mt-1">{formatCurrency(payment.amount)} · {payment.status}</Badge>
        )}
      </div>
    </div>
  );
}

export default function Schedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [allSessions, setAllSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState("");

  const load = () => {
    setAllSessions(sessionStore.getAll());
    setAllStudents(studentStore.getAll());
  };

  useEffect(() => { load(); }, []);

  const refDate = new Date();
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refDate);

  const today = new Date().toISOString().split("T")[0];

  const sessionsByDate = weekDates.reduce((acc, date) => {
    acc[date] = allSessions
      .filter((s) => s.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});

  const weekLabel = (() => {
    const s = new Date(weekDates[0]);
    const e = new Date(weekDates[6]);
    return `${s.toLocaleDateString("en-SG", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}`;
  })();

  const handleAdd = (form) => {
    const student = allStudents.find((s) => s.id === form.studentId);
    const amount = student ? Number(student.ratePerHour) * Number(form.duration) : 0;
    const sess = sessionStore.create({ ...form, duration: Number(form.duration) });
    paymentStore.create({ sessionId: sess.id, studentId: form.studentId, amount, status: "pending", paidDate: null, method: null });
    load();
    setShowAdd(false);
  };

  const handleEdit = (form) => {
    sessionStore.update(editing.id, { ...form, duration: Number(form.duration) });
    // Update payment amount if session details changed
    const student = allStudents.find((s) => s.id === form.studentId);
    const pmt = paymentStore.getBySession(editing.id);
    if (pmt && pmt.status === "pending" && student) {
      paymentStore.update(pmt.id, { amount: Number(student.ratePerHour) * Number(form.duration), studentId: form.studentId });
    }
    load();
    setEditing(null);
  };

  const handleDelete = () => {
    sessionStore.delete(deleting.id);
    load();
    setDeleting(null);
    setEditing(null);
  };

  const openAdd = (date) => {
    setPrefilledDate(date || "");
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <Button size="sm" onClick={() => openAdd(today)}>
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="text-xs">
          This Week
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-7">
        {weekDates.map((date, i) => {
          const daySessions = sessionsByDate[date] || [];
          const isToday = date === today;
          return (
            <div key={date} className="flex flex-col gap-2">
              {/* Day header */}
              <div
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <div>
                  <p className={`text-[11px] font-semibold ${isToday ? "text-primary-foreground" : "text-foreground"}`}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={`text-[10px] ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {new Date(date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <button
                  onClick={() => openAdd(date)}
                  className={`rounded-full p-0.5 transition-colors ${isToday ? "hover:bg-white/20 text-primary-foreground" : "hover:bg-border text-muted-foreground"}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sessions */}
              <div className="space-y-1.5">
                {daySessions.length === 0 ? (
                  <div className="h-16 flex items-center justify-center rounded-lg border border-dashed border-border">
                    <p className="text-[10px] text-muted-foreground">Free</p>
                  </div>
                ) : (
                  daySessions.map((sess) => {
                    const student = allStudents.find((s) => s.id === sess.studentId);
                    return (
                      <SessionCard
                        key={sess.id}
                        session={sess}
                        student={student}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add session modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Session</DialogTitle>
            <DialogDescription>Schedule a new tuition session.</DialogDescription>
          </DialogHeader>
          <SessionForm
            initial={prefilledDate ? { ...EMPTY_FORM, date: prefilledDate } : null}
            students={allStudents}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit session modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update session details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <SessionForm initial={editing} students={allStudents} onSave={handleEdit} onCancel={() => setEditing(null)} />
              <div className="mt-2">
                <Button variant="destructive" size="sm" className="w-full" onClick={() => setDeleting(editing)}>
                  Delete Session
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Session?</DialogTitle>
            <DialogDescription>This session and its payment record will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
