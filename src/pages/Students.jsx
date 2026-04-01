import { useState, useEffect } from "react";
import { Plus, Search, Phone, BookOpen, Trash2, Edit, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    <form
      onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }}
      className="space-y-4 mt-3"
    >
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
          <Label>Rate / Hour ($) *</Label>
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
  const sessionCount = sessionStore.getByStudent(student.id).length;
  const completedCount = sessionStore.getByStudent(student.id).filter((s) => s.status === "completed").length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="text-sm font-semibold">{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{student.name}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="upcoming" className="text-[10px]">{student.level}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />{student.subject}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => window.open(getWhatsAppUrl(student.parentPhone, `Hi ${student.parentName}!`), "_blank")}
                  className="text-[#25D366] hover:text-[#20bd5a] hover:bg-green-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(student)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(student)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs font-semibold">{sessionCount}</p>
                <p className="text-[10px] text-muted-foreground">Sessions</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs font-semibold">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs font-semibold text-green-600">{formatCurrency(student.ratePerHour)}</p>
                <p className="text-[10px] text-muted-foreground">/ hr</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{student.parentName} · {student.parentPhone}</span>
            </div>
          </div>
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

  const handleAdd = (form) => {
    studentStore.create(form);
    load();
    setShowAdd(false);
  };

  const handleEdit = (form) => {
    studentStore.update(editing.id, form);
    load();
    setEditing(null);
  };

  const handleDelete = () => {
    studentStore.delete(deleting.id);
    load();
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">{list.length} registered</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search students, subjects, levels..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
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

      {/* Add modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Fill in the student and parent details.</DialogDescription>
          </DialogHeader>
          <StudentForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information.</DialogDescription>
          </DialogHeader>
          {editing && <StudentForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Student?</DialogTitle>
            <DialogDescription>
              This will remove <strong>{deleting?.name}</strong> and all their data. This cannot be undone.
            </DialogDescription>
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
