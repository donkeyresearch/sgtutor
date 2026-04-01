import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function getDayName(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-SG", { weekday: "short" });
}

export function getMonthYear(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-SG", { month: "long", year: "numeric" });
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getWhatsAppUrl(phone, message) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("65") ? cleaned : `65${cleaned}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function getWeekDates(referenceDate = new Date()) {
  const day = referenceDate.getDay();
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function isSameDay(a, b) {
  return a === b;
}

export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}
