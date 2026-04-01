import { useState, useEffect } from "react";
import {
  RiSendPlaneLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiFileCopyLine, RiCheckLine, RiMessage2Line,
  RiArrowDownSLine, RiArrowUpSLine,
} from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { templates as templateStore, students as studentStore, sessions as sessionStore, payments as paymentStore } from "@/lib/storage";
import { getInitials, getWhatsAppUrl, formatCurrency, getCurrentMonthRange, formatDate, formatTime } from "@/lib/utils";

const VARIABLES = ["{{parentName}}", "{{studentName}}", "{{subject}}", "{{level}}", "{{date}}", "{{time}}", "{{amount}}", "{{rate}}", "{{month}}", "{{sessionCount}}", "{{totalHours}}", "{{totalAmount}}"];

function resolveTemplate(body, student, session, payment) {
  if (!student) return body;
  const now = new Date();
  const { start, end } = getCurrentMonthRange();
  const allSessions = sessionStore.getAll().filter(
    (s) => s.studentId === student.id && s.date >= start && s.date <= end && s.status === "completed"
  );
  const totalHours = allSessions.reduce((sum, s) => sum + Number(s.duration), 0);
  const totalAmount = paymentStore.getByStudent(student.id)
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return body
    .replace(/{{parentName}}/g, student.parentName)
    .replace(/{{studentName}}/g, student.name)
    .replace(/{{subject}}/g, student.subject)
    .replace(/{{level}}/g, student.level)
    .replace(/{{rate}}/g, formatCurrency(student.ratePerHour))
    .replace(/{{date}}/g, session ? formatDate(session.date) : formatDate(now.toISOString().split("T")[0]))
    .replace(/{{time}}/g, session ? formatTime(session.time) : "")
    .replace(/{{amount}}/g, payment ? formatCurrency(payment.amount) : "")
    .replace(/{{month}}/g, now.toLocaleDateString("en-SG", { month: "long", year: "numeric" }))
    .replace(/{{sessionCount}}/g, String(allSessions.length))
    .replace(/{{totalHours}}/g, String(totalHours))
    .replace(/{{totalAmount}}/g, formatCurrency(totalAmount));
}

function TemplateCard({ template, students, onEdit, onDelete }) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const student = students.find((s) => s.id === selectedStudent) || null;
  const preview = resolveTemplate(template.body, student, null, null);

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    if (!student) return;
    window.open(getWhatsAppUrl(student.parentPhone, preview), "_blank");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold">{template.label}</CardTitle>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(template)}>
              <RiEditLine className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(template)}
            >
              <RiDeleteBinLine className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Raw template */}
        <div
          className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 cursor-pointer select-none"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-foreground text-[11px]">Template</span>
            {expanded ? <RiArrowUpSLine className="h-3 w-3" /> : <RiArrowDownSLine className="h-3 w-3" />}
          </div>
          {expanded ? (
            <p className="whitespace-pre-line">{template.body}</p>
          ) : (
            <p className="truncate">{template.body}</p>
          )}
        </div>

        {/* Student selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">Send to</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground text-xs">· {s.parentName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {student && (
          <div className="bg-[#dcf8c6] rounded-lg p-3 text-xs text-gray-800 whitespace-pre-line font-[system-ui] border border-green-200/60">
            <p className="text-[10px] font-semibold text-green-700 mb-1.5 uppercase tracking-wide">WhatsApp Preview</p>
            {preview}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleCopy}>
            {copied ? <RiCheckLine className="h-3.5 w-3.5 text-green-600" /> : <RiFileCopyLine className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            className="flex-1 text-xs"
            disabled={!student}
            onClick={handleSend}
          >
            <RiSendPlaneLine className="h-3.5 w-3.5" />
            Send via WA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const EMPTY_TEMPLATE = { label: "", body: "" };

function TemplateForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_TEMPLATE);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const insertVar = (v) => setForm((f) => ({ ...f, body: f.body + v }));
  const valid = form.label && form.body;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }} className="space-y-4 mt-3">
      <div className="space-y-1.5">
        <Label>Template Name *</Label>
        <Input placeholder="e.g. Monthly Invoice" value={form.label} onChange={set("label")} required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Message Body *</Label>
        </div>
        <Textarea
          placeholder="Type your message here. Use variables like {{studentName}}..."
          value={form.body}
          onChange={set("body")}
          className="h-32"
          required
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVar(v)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!valid}>Save Template</Button>
      </DialogFooter>
    </form>
  );
}

export default function Messages() {
  const [templateList, setTemplateList] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setTemplateList(templateStore.getAll());
    setStudents(studentStore.getAll());
  };

  useEffect(() => { load(); }, []);

  const handleAdd = (form) => {
    templateStore.create(form);
    load();
    setShowAdd(false);
  };

  const handleEdit = (form) => {
    templateStore.update(editing.id, form);
    load();
    setEditing(null);
  };

  const handleDelete = () => {
    templateStore.delete(deleting.id);
    load();
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">WhatsApp templates for parents</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <RiAddLine className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 p-3.5">
        <RiMessage2Line className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-800">One-tap WhatsApp sending</p>
          <p className="text-xs text-green-600 mt-0.5">Select a student to preview the message, then tap "Send via WA" to open WhatsApp with the parent's number and message pre-filled.</p>
        </div>
      </div>

      {/* Templates grid */}
      {templateList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RiMessage2Line className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No templates yet</p>
          <p className="text-sm mt-1">Create your first message template</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templateList.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              students={students}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
            <DialogDescription>Create a reusable WhatsApp message template.</DialogDescription>
          </DialogHeader>
          <TemplateForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update this message template.</DialogDescription>
          </DialogHeader>
          {editing && <TemplateForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template?</DialogTitle>
            <DialogDescription>Remove "{deleting?.label}" permanently.</DialogDescription>
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
