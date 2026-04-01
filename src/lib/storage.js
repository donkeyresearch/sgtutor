import { generateId } from "./utils";

const KEYS = {
  students: "sgtutor_students",
  sessions: "sgtutor_sessions",
  payments: "sgtutor_payments",
  templates: "sgtutor_templates",
};

function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Students ───────────────────────────────────────────────────────────────
export const students = {
  getAll: () => getAll(KEYS.students),
  getById: (id) => getAll(KEYS.students).find((s) => s.id === id) || null,
  create: (data) => {
    const list = getAll(KEYS.students);
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(record);
    saveAll(KEYS.students, list);
    return record;
  },
  update: (id, data) => {
    const list = getAll(KEYS.students).map((s) => (s.id === id ? { ...s, ...data } : s));
    saveAll(KEYS.students, list);
  },
  delete: (id) => {
    saveAll(KEYS.students, getAll(KEYS.students).filter((s) => s.id !== id));
  },
};

// ─── Sessions ───────────────────────────────────────────────────────────────
export const sessions = {
  getAll: () => getAll(KEYS.sessions),
  getById: (id) => getAll(KEYS.sessions).find((s) => s.id === id) || null,
  getByStudent: (studentId) => getAll(KEYS.sessions).filter((s) => s.studentId === studentId),
  getByDateRange: (start, end) =>
    getAll(KEYS.sessions).filter((s) => s.date >= start && s.date <= end),
  create: (data) => {
    const list = getAll(KEYS.sessions);
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(record);
    saveAll(KEYS.sessions, list);
    return record;
  },
  update: (id, data) => {
    const list = getAll(KEYS.sessions).map((s) => (s.id === id ? { ...s, ...data } : s));
    saveAll(KEYS.sessions, list);
  },
  delete: (id) => {
    saveAll(KEYS.sessions, getAll(KEYS.sessions).filter((s) => s.id !== id));
  },
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = {
  getAll: () => getAll(KEYS.payments),
  getBySession: (sessionId) => getAll(KEYS.payments).find((p) => p.sessionId === sessionId) || null,
  getByStudent: (studentId) => getAll(KEYS.payments).filter((p) => p.studentId === studentId),
  create: (data) => {
    const list = getAll(KEYS.payments);
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(record);
    saveAll(KEYS.payments, list);
    return record;
  },
  update: (id, data) => {
    const list = getAll(KEYS.payments).map((p) => (p.id === id ? { ...p, ...data } : p));
    saveAll(KEYS.payments, list);
  },
  markPaid: (id) => {
    const list = getAll(KEYS.payments).map((p) =>
      p.id === id ? { ...p, status: "paid", paidDate: new Date().toISOString().split("T")[0] } : p
    );
    saveAll(KEYS.payments, list);
  },
  // Auto-escalate pending payments whose session date has passed to overdue
  syncOverdue: () => {
    const today = new Date().toISOString().split("T")[0];
    const allSessions = getAll(KEYS.sessions);
    const sessionDateMap = Object.fromEntries(allSessions.map((s) => [s.id, s.date]));
    const list = getAll(KEYS.payments).map((p) => {
      if (p.status !== "pending") return p;
      const sessionDate = sessionDateMap[p.sessionId];
      if (sessionDate && sessionDate < today) return { ...p, status: "overdue" };
      return p;
    });
    saveAll(KEYS.payments, list);
  },
};

// ─── Templates ───────────────────────────────────────────────────────────────
export const templates = {
  getAll: () => getAll(KEYS.templates),
  getById: (id) => getAll(KEYS.templates).find((t) => t.id === id) || null,
  create: (data) => {
    const list = getAll(KEYS.templates);
    const record = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(record);
    saveAll(KEYS.templates, list);
    return record;
  },
  update: (id, data) => {
    const list = getAll(KEYS.templates).map((t) => (t.id === id ? { ...t, ...data } : t));
    saveAll(KEYS.templates, list);
  },
  delete: (id) => {
    saveAll(KEYS.templates, getAll(KEYS.templates).filter((t) => t.id !== id));
  },
  reset: (defaults) => saveAll(KEYS.templates, defaults),
};

// ─── Seed / Init ─────────────────────────────────────────────────────────────
export function initSeedData() {
  if (localStorage.getItem("sgtutor_seeded")) return;

  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];

  const s1 = students.create({ name: "Aiden Tan", subject: "Mathematics", level: "Sec 3", parentName: "Mrs Tan", parentPhone: "91234567", ratePerHour: 60 });
  const s2 = students.create({ name: "Bella Lim", subject: "English", level: "Pri 5", parentName: "Mr Lim", parentPhone: "87654321", ratePerHour: 50 });
  const s3 = students.create({ name: "Caleb Wong", subject: "Physics", level: "Sec 4", parentName: "Mrs Wong", parentPhone: "93456789", ratePerHour: 70 });

  const makeDate = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return fmt(d);
  };

  const sess = [
    sessions.create({ studentId: s1.id, date: makeDate(-7), time: "10:00", duration: 1.5, status: "completed", notes: "Covered quadratic equations" }),
    sessions.create({ studentId: s2.id, date: makeDate(-5), time: "14:00", duration: 1, status: "completed", notes: "Essay writing practice" }),
    sessions.create({ studentId: s3.id, date: makeDate(-3), time: "16:00", duration: 2, status: "no-show", notes: "" }),
    sessions.create({ studentId: s1.id, date: makeDate(1), time: "10:00", duration: 1.5, status: "upcoming", notes: "" }),
    sessions.create({ studentId: s2.id, date: makeDate(2), time: "14:00", duration: 1, status: "upcoming", notes: "" }),
    sessions.create({ studentId: s3.id, date: makeDate(3), time: "16:00", duration: 2, status: "upcoming", notes: "" }),
    sessions.create({ studentId: s1.id, date: makeDate(-14), time: "10:00", duration: 1.5, status: "completed", notes: "" }),
    sessions.create({ studentId: s2.id, date: makeDate(-12), time: "14:00", duration: 1, status: "completed", notes: "" }),
  ];

  payments.create({ sessionId: sess[0].id, studentId: s1.id, amount: 90, status: "paid", paidDate: makeDate(-6), method: "PayLah" });
  payments.create({ sessionId: sess[1].id, studentId: s2.id, amount: 50, status: "paid", paidDate: makeDate(-4), method: "PayLah" });
  payments.create({ sessionId: sess[2].id, studentId: s3.id, amount: 0, status: "waived", paidDate: null, method: null });
  payments.create({ sessionId: sess[3].id, studentId: s1.id, amount: 90, status: "pending", paidDate: null, method: null });
  payments.create({ sessionId: sess[4].id, studentId: s2.id, amount: 50, status: "pending", paidDate: null, method: null });
  payments.create({ sessionId: sess[5].id, studentId: s3.id, amount: 140, status: "pending", paidDate: null, method: null });
  payments.create({ sessionId: sess[6].id, studentId: s1.id, amount: 90, status: "paid", paidDate: makeDate(-13), method: "PayNow" });
  payments.create({ sessionId: sess[7].id, studentId: s2.id, amount: 50, status: "overdue", paidDate: null, method: null });

  const defaultTemplates = [
    {
      id: generateId(),
      label: "Session Reminder",
      body: "Hi {{parentName}}, just a reminder that {{studentName}}'s {{subject}} session is tomorrow ({{date}}) at {{time}}. See you then! 😊",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      label: "Payment Request",
      body: "Hi {{parentName}}, hope {{studentName}} is doing well! A gentle reminder that payment of ${{amount}} for the {{month}} sessions is due. You may transfer via PayLah/PayNow to 9XXXXXXX. Thank you! 🙏",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      label: "No-Show Policy",
      body: "Hi {{parentName}}, we missed {{studentName}} at today's session. As per our arrangement, a cancellation fee may apply for no-shows without 24h notice. Please let me know if everything is okay. 🙂",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      label: "Rate Confirmation",
      body: "Hi {{parentName}}, just confirming that the tuition rate for {{studentName}} is ${{rate}}/hr for {{subject}} ({{level}}). Looking forward to our sessions! 📚",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      label: "Monthly Summary",
      body: "Hi {{parentName}}, here's {{studentName}}'s tuition summary for {{month}}:\n\n📅 Sessions: {{sessionCount}}\n⏱ Total hours: {{totalHours}}h\n💰 Total: ${{totalAmount}}\n\nThank you for your continued support!",
      createdAt: new Date().toISOString(),
    },
  ];
  templates.reset(defaultTemplates);

  localStorage.setItem("sgtutor_seeded", "1");
}
