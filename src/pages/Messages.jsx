import { useState, useEffect } from "react";
import {
  RiSendPlaneLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiFileCopyLine, RiCheckLine, RiMessage2Line,
} from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate">{template.label}</CardTitle>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(template)}>
              <RiEditLine className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(template)}
            >
              <RiDeleteBinLine className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Raw template */}
        <div className="rounded-lg bg-muted/60 p-3.5 overflow-hidden">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Template</p>
          <p className="text-sm text-foreground/70 line-clamp-3 break-words leading-relaxed">{template.body}</p>
        </div>

        {/* Student selector */}
        <div className="space-y-2">
          <Label className="text-sm">Send to</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Select student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span>{s.name}</span>
                  <span className="text-muted-foreground ml-1 text-xs">· {s.parentName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {student && (
          <div className="rounded-lg bg-muted p-3.5 overflow-hidden">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
            <p className="text-sm text-foreground whitespace-pre-line break-words leading-relaxed">{preview}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
            {copied ? <RiCheckLine className="h-4 w-4" /> : <RiFileCopyLine className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            className="flex-1"
            disabled={!student}
            onClick={handleSend}
          >
            <RiSendPlaneLine className="h-4 w-4" />
            Send via WA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateForm({ initial, onSave, onCancel }) {
  const EMPTY = { label: "", body: "" };
  const [form, setForm] = useState(initial || EMPTY);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const insertVar = (v) => setForm((f) => ({ ...f, body: f.body + v }));
  const valid = form.label && form.body;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(form); }} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Template Name *</Label>
        <Input placeholder="e.g. Monthly Invoice" value={form.label} onChange={set("label")} required />
      </div>
      <div className="space-y-1.5">
        <Label>Message Body *</Label>
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
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={!valid}>Save Template</Button>
      </div>
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

      {/* Info banner — neutral */}
      <div className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3.5">
        <RiMessage2Line className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a student to preview the message, then tap <strong className="text-foreground font-medium">Send via WA</strong> to open WhatsApp with the parent's number pre-filled.
        </p>
      </div>

      {/* Templates */}
      {templateList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RiMessage2Line className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No templates yet</p>
          <p className="text-sm mt-1">Create your first message template</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templateList.map((t) => (
            <TemplateCard key={t.id} template={t} students={students} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <ResponsiveDialog open={showAdd} onOpenChange={setShowAdd} title="New Template" description="Create a reusable WhatsApp message template.">
        <TemplateForm onSave={(form) => { templateStore.create(form); load(); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
      </ResponsiveDialog>

      <ResponsiveDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit Template" description="Update this message template.">
        {editing && <TemplateForm initial={editing} onSave={(form) => { templateStore.update(editing.id, form); load(); setEditing(null); }} onCancel={() => setEditing(null)} />}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete Template?"
        description={deleting ? `Remove "${deleting.label}" permanently.` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { templateStore.delete(deleting.id); load(); setDeleting(null); }}>Delete</Button>
          </>
        }
      >
        <div />
      </ResponsiveDialog>
    </div>
  );
}
