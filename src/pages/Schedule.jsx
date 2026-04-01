import { useState, useEffect } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiAddLine, RiTimeLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { sessions as sessionStore, students as studentStore, payments as paymentStore } from "@/lib/storage";
import { formatCurrency, getWeekDates } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["upcoming", "completed", "no-show", "cancelled"];
const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT = {
  upcoming: "bg-primary",
  completed: "bg-green-500",
  "no-show": "bg-red-400",
  cancelled: "bg-muted-foreground",
};

// Convert "HH:MM" → { hour, minute, ampm }
function parseTime(str) {
  const [h, m] = (str || "10:00").split(":").map(Number);
  return {
    hour: String(h % 12 || 12),
    minute: MINUTES.includes(String(m).padStart(2, "0")) ? String(m).padStart(2, "0") : "00",
    ampm: h >= 12 ? "PM" : "AM",
  };
}
function buildTime(hour, minute, ampm) {
  let h = Number(hour);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimePicker({ value, onChange }) {
  const { hour, minute, ampm } = parseTime(value);
  const update = (field, val) => {
    const next = { hour, minute, ampm, [field]: val };
    onChange(buildTime(next.hour, next.minute, next.ampm));
  };
  return (
    <div className="flex gap-2">
      <Select value={hour} onValueChange={(v) => update("hour", v)}>
        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={minute} onValueChange={(v) => update("minute", v)}>
        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={ampm} onValueChange={(v) => update("ampm", v)}>
        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SessionForm({ initial, students, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { studentId: initial.studentId, date: initial.date, time: initial.time, duration: String(initial.duration), status: initial.status, notes: initial.notes || "" }
      : { studentId: "", date: "", time: "10:00", duration: "1", status: "upcoming", notes: "" }
  );
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const valid = form.studentId && form.date && form.time && form.duration;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }} className="space-y-4 mt-3">
      <div className="space-y-1.5">
        <Label>Student *</Label>
        <Select value={form.studentId} onValueChange={setVal("studentId")}>
          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.subject} ({s.level})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Duration *</Label>
          <Select value={form.duration} onValueChange={setVal("duration")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DURATION_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{d}h</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Time *</Label>
        <TimePicker value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={setVal("status")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Topics covered, homework assigned…" value={form.notes} onChange={set("notes")} className="h-20" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!valid}>Save Session</Button>
      </DialogFooter>
    </form>
  );
}

function SessionPill({ session, student, onClick }) {
  const payment = paymentStore.getBySession(session.id);
  const [h, m] = session.time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const timeStr = `${hour}:${String(m).padStart(2, "0")} ${ampm}`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card px-2.5 py-2 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[session.status] || "bg-muted-foreground")} />
        <span className="text-xs font-semibold truncate leading-none">{student?.name || "—"}</span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate">{student?.subject}</p>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
        <RiTimeLine className="h-3 w-3 shrink-0" />{timeStr} · {session.duration}h
      </p>
      {payment && (payment.status === "pending" || payment.status === "overdue") && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(payment.amount)} · {payment.status}</p>
      )}
    </button>
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

  const load = () => { setAllSessions(sessionStore.getAll()); setAllStudents(studentStore.getAll()); };
  useEffect(() => { load(); }, []);

  const refDate = new Date();
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refDate);
  const today = new Date().toISOString().split("T")[0];

  const sessionsByDate = weekDates.reduce((acc, date) => {
    acc[date] = allSessions.filter((s) => s.date === date).sort((a, b) => a.time.localeCompare(b.time));
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
    load(); setShowAdd(false);
  };

  const handleEdit = (form) => {
    sessionStore.update(editing.id, { ...form, duration: Number(form.duration) });
    const student = allStudents.find((s) => s.id === form.studentId);
    const pmt = paymentStore.getBySession(editing.id);
    if (pmt && pmt.status === "pending" && student)
      paymentStore.update(pmt.id, { amount: Number(student.ratePerHour) * Number(form.duration), studentId: form.studentId });
    load(); setEditing(null);
  };

  const openAdd = (date) => { setPrefilledDate(date || ""); setShowAdd(true); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <Button size="sm" onClick={() => openAdd(today)}>
          <RiAddLine className="h-4 w-4" />
          Add Session
        </Button>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((o) => o - 1)}>
          <RiArrowLeftSLine className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setWeekOffset(0)}>
          This Week
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((o) => o + 1)}>
          <RiArrowRightSLine className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop: 7-col grid / Mobile: vertical list */}
      <div className="hidden sm:grid sm:grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const daySessions = sessionsByDate[date] || [];
          const isToday = date === today;
          return (
            <div key={date} className="flex flex-col gap-1.5">
              <button
                onClick={() => openAdd(date)}
                className={cn(
                  "rounded-lg px-2 py-2 text-left transition-colors group",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                )}
              >
                <p className="text-xs font-semibold">{DAY_LABELS[i]}</p>
                <p className={cn("text-[10px]", isToday ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {new Date(date).getDate()}
                </p>
              </button>
              <div className="space-y-1.5">
                {daySessions.length === 0 ? (
                  <div className="h-12 flex items-center justify-center rounded-lg border border-dashed border-border/60">
                    <p className="text-[10px] text-muted-foreground/50">—</p>
                  </div>
                ) : (
                  daySessions.map((sess) => (
                    <SessionPill
                      key={sess.id}
                      session={sess}
                      student={allStudents.find((s) => s.id === sess.studentId)}
                      onClick={() => setEditing(sess)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical day rows */}
      <div className="flex flex-col gap-3 sm:hidden">
        {weekDates.map((date, i) => {
          const daySessions = sessionsByDate[date] || [];
          const isToday = date === today;
          return (
            <div key={date} className="flex gap-3">
              {/* Day label */}
              <div className={cn(
                "w-12 shrink-0 rounded-lg flex flex-col items-center justify-center py-2",
                isToday ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <p className="text-[11px] font-semibold">{DAY_LABELS[i]}</p>
                <p className={cn("text-sm font-bold", isToday ? "text-primary-foreground" : "text-foreground")}>
                  {new Date(date).getDate()}
                </p>
              </div>
              {/* Sessions or empty */}
              <div className="flex-1 space-y-1.5">
                {daySessions.length === 0 ? (
                  <button
                    onClick={() => openAdd(date)}
                    className="w-full h-full min-h-[52px] rounded-lg border border-dashed border-border/60 flex items-center justify-center text-[11px] text-muted-foreground/50"
                  >
                    Tap to add
                  </button>
                ) : (
                  daySessions.map((sess) => (
                    <SessionPill
                      key={sess.id}
                      session={sess}
                      student={allStudents.find((s) => s.id === sess.studentId)}
                      onClick={() => setEditing(sess)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      <ResponsiveDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        title="Add Session"
        description="Schedule a new tuition session."
      >
        <SessionForm
          initial={prefilledDate ? { studentId: "", date: prefilledDate, time: "10:00", duration: "1", status: "upcoming", notes: "" } : null}
          students={allStudents}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </ResponsiveDialog>

      {/* Edit modal */}
      <ResponsiveDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit Session"
        description="Update session details."
      >
        {editing && (
          <>
            <SessionForm initial={editing} students={allStudents} onSave={handleEdit} onCancel={() => setEditing(null)} />
            <div className="mt-2 mb-2">
              <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setDeleting(editing); setEditing(null); }}>
                Delete Session
              </Button>
            </div>
          </>
        )}
      </ResponsiveDialog>

      {/* Delete confirm */}
      <ResponsiveDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete session?"
        description="This session and its payment record will be removed."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { sessionStore.delete(deleting.id); load(); setDeleting(null); }}>Delete</Button>
          </>
        }
      >
        <div />
      </ResponsiveDialog>
    </div>
  );
}
