import { useState, useEffect } from "react";
import {
  RiAddLine, RiSearchLine, RiPhoneLine, RiBookOpenLine,
  RiDeleteBinLine, RiEditLine, RiMessage2Line, RiGroupLine,
} from "@remixicon/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { students as studentStore, sessions as sessionStore } from "@/lib/storage";
import { formatCurrency, getInitials, getWhatsAppUrl } from "@/lib/utils";

const SUBJECTS = ["Mathematics", "English", "Science", "Physics", "Chemistry", "Biology", "Chinese", "History", "Geography", "Literature", "Economics", "Additional Mathematics"];
const LEVELS = ["Pri 1", "Pri 2", "Pri 3", "Pri 4", "Pri 5", "Pri 6", "Sec 1", "Sec 2", "Sec 3", "Sec 4", "JC 1", "JC 2", "PSLE", "O-Level", "A-Level"];
const EMPTY_FORM = { name: "", subject: "", level: "", parentName: "", parentPhone: "", ratePerHour: "" };

function StudentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSelect = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const valid = form.name && form.subject && form.level && form.parentName && form.parentPhone && form.ratePerHour;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }} className="space-y-4 mt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Student Name *</Label>
          <Input placeholder="e.g. Aiden Tan" value={form.name} onChange={set("name")} required />
        </div>
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Select value={form.subject} onValueChange={setSelect("subject")}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Level *</Label>
          <Select value={form.level} onValueChange={setSelect("level")}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Rate / Hour (SGD) *</Label>
          <Input type="number" placeholder="e.g. 60" value={form.ratePerHour} onChange={set("ratePerHour")} min={1} required />
        </div>
        <div className="space-y-1.5">
          <Label>Parent Name *</Label>
          <Input placeholder="e.g. Mrs Tan" value={form.parentName} onChange={set("parentName")} required />
        </div>
        <div className="space-y-1.5">
          <Label>Parent WhatsApp *</Label>
          <Input placeholder="e.g. 91234567" value={form.parentPhone} onChange={set("parentPhone")} required />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!valid}>Save Student</Button>
      </DialogFooter>
    </form>
  );
}

function StudentCard({ student, onEdit, onDelete }) {
  const allSess = sessionStore.getByStudent(student.id);
  const completedCount = allSess.filter((s) => s.status === "completed").length;

  return (
    <Card>
      <CardContent className="p-5">
        {/* Top row: avatar + name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{student.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{student.subject} · {student.level}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.open(getWhatsAppUrl(student.parentPhone, `Hi ${student.parentName}!`), "_blank")}
            >
              <RiMessage2Line className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(student)}
            >
              <RiEditLine className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onDelete(student)}
            >
              <RiDeleteBinLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-4" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-base font-semibold">{allSess.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sessions</p>
          </div>
          <div>
            <p className="text-base font-semibold">{completedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Completed</p>
          </div>
          <div>
            <p className="text-base font-semibold">{formatCurrency(student.ratePerHour)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Per hour</p>
          </div>
        </div>

        {/* Parent contact */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RiPhoneLine className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{student.parentName} · {student.parentPhone}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Students() {
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => setList(studentStore.getAll());
  useEffect(() => { load(); }, []);

  const filtered = list.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.subject.toLowerCase().includes(query.toLowerCase()) ||
      s.level.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">{list.length} registered</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <RiAddLine className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, subject or level…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RiGroupLine className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No students found</p>
          <p className="text-sm mt-1">Add your first student to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Fill in the student and parent details.</DialogDescription>
          </DialogHeader>
          <StudentForm onSave={(form) => { studentStore.create(form); load(); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information.</DialogDescription>
          </DialogHeader>
          {editing && <StudentForm initial={editing} onSave={(form) => { studentStore.update(editing.id, form); load(); setEditing(null); }} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove student?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.name}</strong> and all their session data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { studentStore.delete(deleting.id); load(); setDeleting(null); }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
