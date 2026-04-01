import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, CreditCard, MessageSquare, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/students", icon: Users, label: "Students" },
  { to: "/schedule", icon: CalendarDays, label: "Schedule" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/messages", icon: MessageSquare, label: "Messages" },
];

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border flex md:hidden safe-bottom">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-background sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">SGTutor</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tuition Manager</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">SGTutor v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header className="flex md:hidden items-center gap-2.5 px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <p className="font-semibold text-sm">SGTutor</p>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
