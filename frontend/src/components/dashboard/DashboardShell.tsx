"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import ThemeToggle from "@/components/shared/ThemeToggle";
import {
  AUTH_USER_KEY,
  changeEmail as changeAuthEmail,
  changePassword as changeAuthPassword,
  clearAuthSession,
  deleteAccount as deleteAuthAccount,
  fetchCurrentUser,
  getStoredAuthToken,
  getStoredAuthUser,
  type AuthUser,
  updateProfile as updateAuthProfile,
} from "@/lib/auth";
import {
  createExpense,
  deleteBudget,
  deleteExpense,
  fetchAdminOverview,
  fetchBudgets,
  fetchDashboardSummary,
  fetchExpenses,
  fetchMonthlyReports,
  type Budget,
  type DashboardSummary,
  type Expense,
  type MonthlyReport,
  updateExpense,
  upsertBudget,
} from "@/lib/finance";

const categories = ["Food", "Rent", "Shopping", "Travel", "Bills", "Health", "Entertainment", "Savings", "Other"];
const paymentMethods = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];
type DashboardNavId = "dashboard" | "Budget" | "Report" | "Profile";

const dashboardNavItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "Budget", label: "Budget" },
  { id: "Report", label: "Report" },
] as const;

type ExpenseFormState = {
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
};

type ExpenseFilterType = "date" | "category" | "paymentMethod";

type ProfileFormState = {
  name: string;
  username: string;
  phone: string;
  profilePicture: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger";
  createdAt: string;
};

function getCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function getCurrentDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultExpenseForm(): ExpenseFormState {
  return {
    amount: "",
    category: categories[0],
    date: getCurrentDateInputValue(),
    paymentMethod: paymentMethods[0],
    notes: "",
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getDisplayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function PieChart({ items }: { items: Array<{ name: string; amount: number }> }) {
  const colors = ["#f4a17e", "#1e3a8a", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b"];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const segments = items.reduce<Array<{ name: string; percent: number; offset: number; color: string }>>(
    (allSegments, item, index) => {
      const usedOffset =
        allSegments.length > 0
          ? allSegments[allSegments.length - 1].offset + allSegments[allSegments.length - 1].percent
          : 0;

      allSegments.push({
        name: item.name,
        percent: (item.amount / total) * 100,
        offset: usedOffset,
        color: colors[index % colors.length],
      });

      return allSegments;
    },
    [],
  );

  if (!items.length || total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-[var(--auth-muted)]">No category data yet</div>;
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-56 w-56 -rotate-90">
        {segments.map((segment) => (
          <circle
            key={segment.name}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={segment.color}
            strokeWidth="7"
            strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
            strokeDashoffset={-segment.offset}
          />
        ))}
      </svg>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-sm">{item.name}</span>
            </div>
            <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ points }: { points: Array<{ date: string; amount: number }> }) {
  if (!points.length) {
    return <div className="flex h-56 items-center justify-center text-sm text-[var(--auth-muted)]">No trend data yet</div>;
  }

  const maxAmount = Math.max(...points.map((point) => point.amount), 1);
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? 20 : 20 + (index / (points.length - 1)) * 300;
      const y = 180 - (point.amount / maxAmount) * 140;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 340 200" className="h-56 w-full">
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="20" y1={y} x2="320" y2={y} stroke="var(--auth-border)" strokeWidth="1" />
      ))}
      <path d={path} fill="none" stroke="var(--auth-accent)" strokeWidth="4" strokeLinecap="round" />
      {points.map((point, index) => {
        const x = points.length === 1 ? 20 : 20 + (index / (points.length - 1)) * 300;
        const y = 180 - (point.amount / maxAmount) * 140;
        return (
          <g key={`${point.date}-${index}`}>
            <circle cx={x} cy={y} r="4.5" fill="var(--auth-accent)" />
            <text x={x} y="194" textAnchor="middle" fontSize="10" fill="var(--auth-muted)">
              {new Date(point.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function shiftMonth(monthValue: string, delta: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function getTodayDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function CalendarNavIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M14.5 6 8.5 12l6 6" : "M9.5 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonthlyCalendar({
  monthValue,
  onMonthChange,
  selectedDate,
  onSelectDate,
}: {
  monthValue: string;
  onMonthChange: (nextMonth: string) => void;
  selectedDate: string;
  onSelectDate: (nextDate: string) => void;
}) {
  const [year, month] = monthValue.split("-").map(Number);
  const today = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: `${index + 1}`.padStart(2, "0"),
    label: new Date(2025, index, 1).toLocaleDateString("en-US", { month: "short" }),
  }));
  const yearOptions = Array.from({ length: 7 }, (_, index) => `${today.getFullYear() - 3 + index}`);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - startOffset);
  const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const cells = Array.from({ length: 35 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const isCurrentMonth = cellDate.getMonth() === month - 1 && cellDate.getFullYear() === year;
    const isToday =
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear();

    return {
      key: cellDate.toISOString(),
      value: `${cellDate.getFullYear()}-${`${cellDate.getMonth() + 1}`.padStart(2, "0")}-${`${cellDate.getDate()}`.padStart(2, "0")}`,
      label: cellDate.getDate(),
      isCurrentMonth,
      isToday,
      isSelected: `${cellDate.getFullYear()}-${`${cellDate.getMonth() + 1}`.padStart(2, "0")}-${`${cellDate.getDate()}`.padStart(2, "0")}` === selectedDate,
    };
  });

  return (
    <div className="w-full max-w-[240px] rounded-[24px] border border-[color:color-mix(in_srgb,var(--auth-accent)_28%,var(--auth-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--auth-surface-strong)_94%,transparent),color-mix(in_srgb,var(--auth-accent-soft)_35%,var(--auth-surface)))] p-3 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
      <div className="flex flex-col gap-2">
        <div className="flex w-full items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(monthValue, -1))}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface-strong)] text-[var(--auth-muted)] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-[color:color-mix(in_srgb,var(--auth-accent)_42%,var(--auth-border))] hover:bg-[var(--auth-surface)] hover:text-[var(--auth-accent)]"
            aria-label="Previous month"
          >
            <CalendarNavIcon direction="left" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <div className="relative min-w-0">
              <select
                value={`${month}`.padStart(2, "0")}
                onChange={(event) => onMonthChange(`${year}-${event.target.value}`)}
                className="w-[64px] appearance-none bg-transparent px-1 py-1 pr-4 text-center text-[18px] font-semibold tracking-[-0.02em] text-[var(--auth-ink)] outline-none"
                aria-label="Select month"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]">
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <div className="relative min-w-0">
              <select
                value={`${year}`}
                onChange={(event) => onMonthChange(`${event.target.value}-${`${month}`.padStart(2, "0")}`)}
                className="w-[78px] appearance-none bg-transparent px-1 py-1 pr-4 text-center text-[18px] font-semibold tracking-[-0.02em] text-[var(--auth-ink)] outline-none"
                aria-label="Select year"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-[var(--auth-muted)]">
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                  <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(monthValue, 1))}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface-strong)] text-[var(--auth-muted)] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-[color:color-mix(in_srgb,var(--auth-accent)_42%,var(--auth-border))] hover:bg-[var(--auth-surface)] hover:text-[var(--auth-accent)]"
            aria-label="Next month"
          >
            <CalendarNavIcon direction="right" />
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {dayLabels.map((day) => (
          <div key={day} className="rounded-lg px-1 py-1.5 text-[10px] font-extrabold tracking-[0.08em] text-[var(--auth-muted)]">
            {day}
          </div>
        ))}
        {cells.map((cell) => (
          <button
            type="button"
            key={cell.key}
            onClick={() => onSelectDate(cell.value)}
            className={`relative flex h-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
              cell.isSelected
                ? "border border-[#f48a5c] bg-[#f48a5c] text-white shadow-[0_12px_24px_rgba(244,138,92,0.35)]"
              : cell.isCurrentMonth
                  ? "bg-transparent text-[var(--auth-ink)] hover:bg-[rgba(244,161,126,0.14)]"
                  : "bg-transparent text-[var(--auth-muted)]"
            }`}
          >
            <span>{cell.label}</span>
            {cell.isToday ? <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${cell.isSelected ? "bg-white" : "bg-emerald-500"}`} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function SidebarIcon({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? "currentColor" : "var(--auth-muted)";

  switch (id) {
    case "dashboard":
      return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 5.5h7v5H4zM13 5.5h7v8h-7zM4 12.5h7v6H4zM13 15.5h7v3h-7z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" /></svg>;
    case "Budget":
      return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 8.5h16M7 5.5h10M7 11.5v6M12 11.5v6M17 11.5v6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "Report":
      return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M6 19.5h12M8 16.5v-5M12 16.5V8M16 16.5v-8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" /></svg>;
    case "Profile":
      return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 19.5a7 7 0 0 1 14 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.8" /></svg>;
  }
}

function PanelToggleIcon({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d={open ? "M15 6 9 12l6 6" : "M9 6l6 6-6 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M10 6H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M13 8l4 4-4 4M9 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function NotificationIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M15 17.5H5.5l1.4-1.6a2 2 0 0 0 .5-1.3v-3.3a4.6 4.6 0 1 1 9.2 0v3.3c0 .49.18.97.5 1.34l1.4 1.56H15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.5 20a1.9 1.9 0 0 0 3 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PencilIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="m4 20 4.2-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m12.5 6.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5.5h6V7M8 10v7M12 10v7M16 10v7M6.5 7l.7 11a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.7-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function createProfileFormState(user: AuthUser | null): ProfileFormState {
  return {
    name: user?.name || "",
    username: user?.username || "",
    phone: user?.phone || "",
    profilePicture: user?.profilePicture || "",
  };
}

export default function DashboardShell() {
  const router = useRouter();
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => (typeof window === "undefined" ? null : getStoredAuthUser()));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [adminOverview, setAdminOverview] = useState<Awaited<ReturnType<typeof fetchAdminOverview>> | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateInputValue);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(createDefaultExpenseForm);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseMessage, setExpenseMessage] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => createProfileFormState(typeof window === "undefined" ? null : getStoredAuthUser()));
  const [profileMessage, setProfileMessage] = useState("");
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [filterType, setFilterType] = useState<ExpenseFilterType>("date");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [budgetCategory, setBudgetCategory] = useState(categories[0]);
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [reportMonthValue, setReportMonthValue] = useState(getCurrentMonth);
  const [reportResult, setReportResult] = useState<MonthlyReport | null>(null);
  const [reportLookupMessage, setReportLookupMessage] = useState("");
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState<DashboardNavId>("dashboard");

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      router.replace("/");
      return;
    }
    fetchCurrentUser(token)
      .then((currentUser) => {
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
        setProfileForm(createProfileFormState(currentUser));
        setEmailForm({ email: currentUser.email, password: "" });
        setStatus("ready");
      })
      .catch((error: Error) => {
        clearAuthSession();
        setErrorMessage(error.message);
        setStatus("error");
      });
  }, [router]);

  const buildExpenseQuery = () => {
    const params = new URLSearchParams();
    params.set("month", selectedMonth);
    if (search.trim()) params.set("search", search.trim());
    if (dateFilter) params.set("date", dateFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (paymentFilter) params.set("paymentMethod", paymentFilter);
    return params.toString();
  };

  const shouldShowPersonalNotifications = user?.role !== "admin";

  const pushNotifications = (items: NotificationItem[]) => {
    if (!items.length) return;
    setNotifications((current) => {
      const seen = new Set(current.map((item) => item.id));
      const next = [...items.filter((item) => !seen.has(item.id)), ...current];
      return next.slice(0, 12);
    });
  };

  const pushPersonalNotification = (item: NotificationItem) => {
    if (!shouldShowPersonalNotifications) return;
    pushNotifications([item]);
  };

  const resetExpenseEditor = () => {
    setEditingExpenseId(null);
    setExpenseForm(createDefaultExpenseForm());
    setExpenseMessage("");
  };

  const buildBudgetNotifications = (budgetStatus: DashboardSummary["budgetStatus"]) =>
    budgetStatus
      .filter((budget) => budget.alertLevel !== "safe")
      .map<NotificationItem>((budget) => {
        const overBy = Math.max(budget.spent - budget.limit, 0);
        const isDanger = budget.alertLevel === "danger";
        return {
          id: `budget-${budget.month}-${budget.category}-${budget.alertLevel}-${Math.round(budget.spent)}`,
          title: isDanger ? `${budget.category} budget exceeded` : `${budget.category} budget warning`,
          description: isDanger
            ? `${budget.category} is over budget by ${formatCurrency(overBy)} for ${budget.month}.`
            : `${budget.category} has used ${budget.percentUsed.toFixed(0)}% of its ${budget.month} budget.`,
          tone: isDanger ? "danger" : "warning",
          createdAt: `${budget.month}-01T00:00:00.000Z`,
        };
      });

  const buildSuggestionNotifications = (suggestions: string[] = []) =>
    suggestions.map<NotificationItem>((suggestion, index) => ({
      id: `suggestion-${selectedMonth}-${index}-${suggestion}`,
      title: "Smart suggestion",
      description: suggestion,
      tone: "info",
      createdAt: `${selectedMonth}-01T00:00:00.000Z`,
    }));

  const buildAdminNotifications = (overview: NonNullable<typeof adminOverview>) => {
    const monthLabel = formatMonthLabel(overview.month);

    return overview.userSpending
      .filter((entry) => entry.role === "user")
      .flatMap<NotificationItem>((entry) => {
        const userName = getDisplayNameFromEmail(entry.email);
        const items: NotificationItem[] = [];

        if (entry.createdAt.startsWith(`${overview.month}-`)) {
          items.push({
            id: `admin-user-joined-${entry.userId}-${overview.month}`,
            title: "New user joined",
            description: `${userName} created an account in ${monthLabel}.`,
            tone: "info",
            createdAt: entry.createdAt,
          });
        }

        if (entry.expenseCount > 0 && entry.latestExpenseAt) {
          items.push({
            id: `admin-user-expense-${entry.userId}-${overview.month}-${entry.expenseCount}`,
            title: "New expense activity",
            description: `${userName} added ${entry.expenseCount} expense${entry.expenseCount === 1 ? "" : "s"} totaling ${formatCurrency(entry.totalSpent)} in ${monthLabel}.`,
            tone: "info",
            createdAt: entry.latestExpenseAt,
          });
        }

        return items;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  };

  const refreshDashboard = async () => {
    const [dashboardData, expenseData, budgetData] = await Promise.all([
      fetchDashboardSummary(selectedMonth),
      fetchExpenses(buildExpenseQuery()),
      fetchBudgets(selectedMonth),
    ]);

    const adminData = user?.role === "admin" ? await fetchAdminOverview(selectedMonth) : null;

    setSummary(dashboardData);
    setExpenses(expenseData.expenses);
    setBudgets(budgetData.budgets);
    setAdminOverview(adminData);
    pushNotifications(
      user?.role === "admin" && adminData
        ? buildAdminNotifications(adminData)
        : [
            ...buildBudgetNotifications(dashboardData.budgetStatus),
            ...buildSuggestionNotifications(dashboardData.suggestions),
          ],
    );
  };

  useEffect(() => {
    if (status !== "ready") return;
    refreshDashboard().catch((error: Error) => setErrorMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedMonth]);

  useEffect(() => {
    if (status !== "ready") return;
    const timeout = window.setTimeout(() => {
      fetchExpenses(buildExpenseQuery())
        .then((data) => setExpenses(data.expenses))
        .catch((error: Error) => setErrorMessage(error.message));
    }, 250);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedMonth, search, dateFilter, categoryFilter, paymentFilter]);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationPanelRef.current) return;
      if (!notificationPanelRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!user) return;
    setProfileForm(createProfileFormState(user));
    setEmailForm((current) => ({ ...current, email: user.email }));
  }, [user]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/");
  };

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExpenseMessage("");
    setIsSavingExpense(true);
    try {
      const payload = {
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        paymentMethod: expenseForm.paymentMethod,
        notes: expenseForm.notes,
      };
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        setExpenseMessage("Expense updated successfully.");
        pushPersonalNotification({
          id: `expense-updated-${editingExpenseId}-${Date.now()}`,
          title: "Expense updated",
          description: `${expenseForm.category} was updated to ${formatCurrency(Number(expenseForm.amount || 0))}.`,
          tone: "info",
          createdAt: new Date().toISOString(),
        });
      } else {
        await createExpense(payload);
        setExpenseMessage("Expense added successfully.");
        pushPersonalNotification({
          id: `expense-added-${Date.now()}`,
          title: "Expense added",
          description: `${formatCurrency(Number(expenseForm.amount || 0))} added to ${expenseForm.category}.`,
          tone: "info",
          createdAt: new Date().toISOString(),
        });
      }
      resetExpenseEditor();
      setIsExpenseModalOpen(false);
      await refreshDashboard();
    } catch (error) {
      setExpenseMessage(error instanceof Error ? error.message : "Unable to save expense.");
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleBudgetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBudgetMessage("");
    setIsSavingBudget(true);
    try {
      await upsertBudget({ category: budgetCategory, month: selectedMonth, limit: Number(budgetLimit) });
      setBudgetLimit("");
      setBudgetMessage("Budget saved successfully.");
      pushPersonalNotification({
        id: `budget-saved-${budgetCategory}-${selectedMonth}-${Date.now()}`,
        title: "Budget saved",
        description: `${budgetCategory} budget set to ${formatCurrency(Number(budgetLimit || 0))} for ${selectedMonth}.`,
        tone: "info",
        createdAt: new Date().toISOString(),
      });
      await refreshDashboard();
    } catch (error) {
      setBudgetMessage(error instanceof Error ? error.message : "Unable to save budget.");
    } finally {
      setIsSavingBudget(false);
    }
  };

  const startEditingExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      amount: `${expense.amount}`,
      category: expense.category,
      date: expense.date.slice(0, 10),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    });
    setExpenseMessage("Editing existing expense.");
    setIsExpenseModalOpen(true);
  };

  const openNewExpenseModal = () => {
    resetExpenseEditor();
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    resetExpenseEditor();
  };

  const clearAllFilters = () => {
    setDateFilter("");
    setCategoryFilter("");
    setPaymentFilter("");
  };

  const handleReportLookup = async () => {
    setIsLoadingReport(true);
    setReportLookupMessage("");

    try {
      const data = await fetchMonthlyReports();
      const matchedReport = data.reports.find((report) => report.month === reportMonthValue) || null;
      setReportResult(matchedReport);
      setReportLookupMessage(matchedReport ? "" : `No saved monthly report found for ${reportMonthValue}.`);
    } catch (error) {
      setReportResult(null);
      setReportLookupMessage(error instanceof Error ? error.message : "Unable to load the monthly report.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("");
    setIsSavingProfile(true);

    try {
      const response = await updateAuthProfile(profileForm);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
      setProfileMessage(response.message);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfileForm((current) => ({ ...current, profilePicture: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailMessage("");
    setIsSavingEmail(true);

    try {
      const response = await changeAuthEmail(emailForm);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
      setEmailForm({ email: response.user.email, password: "" });
      setEmailMessage(response.message);
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : "Unable to change email.");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setIsSavingPassword(true);

    try {
      const response = await changeAuthPassword(passwordForm);
      setPasswordForm({ currentPassword: "", nextPassword: "" });
      setPasswordMessage(response.message);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteMessage("");
    setIsDeletingAccount(true);

    try {
      const response = await deleteAuthAccount(deletePassword);
      clearAuthSession();
      setDeleteMessage(response.message);
      router.replace("/");
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "Unable to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      pushPersonalNotification({
        id: `expense-deleted-${expense.id}-${Date.now()}`,
        title: "Expense removed",
        description: `${formatCurrency(expense.amount)} removed from ${expense.category}.`,
        tone: "info",
        createdAt: new Date().toISOString(),
      });
      await refreshDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete expense.");
    }
  };

  const handleDeleteBudget = async (category: string) => {
    try {
      await deleteBudget(category, selectedMonth);
      pushPersonalNotification({
        id: `budget-deleted-${category}-${selectedMonth}-${Date.now()}`,
        title: "Budget removed",
        description: `${category} budget was removed for ${selectedMonth}.`,
        tone: "warning",
        createdAt: new Date().toISOString(),
      });
      await refreshDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete budget.");
    }
  };

  const totalBudgetLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalBudgetSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const totalBudgetRemaining = Math.max(totalBudgetLimit - totalBudgetSpent, 0);
  const alertCount = summary?.budgetStatus.filter((budget) => budget.alertLevel !== "safe").length || 0;
  const reportCount = summary?.reports?.length || 0;
  const reportMonthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: `${index + 1}`.padStart(2, "0"),
    label: new Date(2025, index, 1).toLocaleDateString("en-US", { month: "long" }),
  }));
  const reportYearOptions = Array.from({ length: 7 }, (_, index) => `${new Date().getFullYear() - 3 + index}`);
  const userName =
    user?.username?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0]?.replace(/[._-]+/g, " ") ||
    "FinTrack user";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const isAdminUser = user?.role === "admin";
  const adminReportRows = summary?.reports || [];
  const adminUsersById = new Map((adminOverview?.userSpending || []).map((entry) => [entry.userId, entry]));
  const isDashboardView = activeNavItem === "dashboard";
  const isBudgetView = activeNavItem === "Budget";
  const isReportView = activeNavItem === "Report";
  const isProfileView = activeNavItem === "Profile";

  const handleMonthChange = (nextMonth: string) => {
    setSelectedMonth(nextMonth);
    const todayValue = getTodayDateValue();
    const nextMonthPrefix = `${nextMonth}-`;
    setSelectedDate(todayValue.startsWith(nextMonthPrefix) ? todayValue : `${nextMonth}-01`);
  };

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--auth-bg)]"><p className="text-sm text-[var(--auth-muted)]">Loading your dashboard...</p></div>;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--auth-bg)] px-6 text-[var(--auth-ink)]">
        <div className="max-w-md rounded-3xl border border-[var(--auth-border)] bg-[var(--auth-card)] p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <h1 className="text-xl font-semibold">Session expired</h1>
          <p className="mt-3 text-sm text-[var(--auth-muted)]">{errorMessage || "Please sign in again to continue."}</p>
          <button type="button" onClick={handleLogout} className="auth-primary-button mt-6">Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--auth-bg)] py-3 pr-3 pl-0 text-[var(--auth-ink)] md:py-5 md:pr-5 md:pl-0">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1500px] gap-4 overflow-x-hidden">
        <aside
          className={`fixed top-3 left-0 z-30 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-[32px] bg-[var(--auth-bg)] p-4 transition-all duration-300 md:top-5 ${
            sidebarOpen ? "w-[280px]" : "w-[88px]"
          }`}
          style={{ left: "max(0px, calc((100vw - min(1500px, 100vw)) / 2))" }}
        >
          <div className={`flex items-center ${sidebarOpen ? "justify-between gap-3" : "justify-center"}`}>
            <div className={`min-w-0 items-center gap-3 overflow-hidden ${sidebarOpen ? "flex" : "hidden"}`}>
              <Image src="/fintrack-logo.svg" alt="FinTrack logo" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" priority />
              {sidebarOpen ? (
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold tracking-[-0.03em]">FinTrack</p>
                  <span className="block text-xs text-[var(--auth-muted)]">Finance workspace</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-muted)] transition hover:bg-[var(--auth-surface-strong)] hover:text-[var(--auth-ink)]"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelToggleIcon open={sidebarOpen} />
            </button>
          </div>

          <div className="mt-6 space-y-2">
            {(isAdminUser ? dashboardNavItems.filter((item) => item.id === "dashboard") : dashboardNavItems).map((item) => {
              const active = activeNavItem === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNavItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition ${
                    active
                      ? "border-transparent bg-[var(--auth-accent)] text-[var(--auth-accent-text)] shadow-[0_18px_34px_rgba(244,161,126,0.22)]"
                      : "border-transparent bg-transparent text-[var(--auth-muted)] hover:border-[var(--auth-border)] hover:bg-[var(--auth-surface)] hover:text-[var(--auth-ink)]"
                  } ${sidebarOpen ? "justify-start" : "justify-center"}`}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/45 text-current dark:bg-slate-950/20">
                    <SidebarIcon id={item.id} active={active} />
                  </span>
                  {sidebarOpen ? (
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{item.label}</span>
                      <span className={`block truncate text-xs ${active ? "text-[color:rgba(64,38,27,0.8)]" : "text-[var(--auth-muted)]"}`}></span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-[26px] bg-transparent p-3">
            {isAdminUser ? (
              <div className={`flex w-full items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4a17e,#1e3a8a)] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
                  {userInitials || "FT"}
                </div>
                {sidebarOpen ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">{userName}</p>
                    <span className="block truncate text-xs text-[var(--auth-muted)]">Admin account</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveNavItem("Profile")}
                className={`flex w-full items-center gap-3 rounded-[22px] text-left transition ${sidebarOpen ? "" : "justify-center"} hover:bg-[var(--auth-surface)]`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4a17e,#1e3a8a)] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
                  {userInitials || "FT"}
                </div>
                {sidebarOpen ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold capitalize">{userName}</p>
                    <span className="block truncate text-xs text-[var(--auth-muted)]">Personal account</span>
                  </div>
                ) : null}
              </button>
            )}
            <div className={`mt-3 flex gap-2 ${sidebarOpen ? "" : "justify-center"}`}>
              <button
                type="button"
                onClick={handleLogout}
                className={`inline-flex items-center gap-2 rounded-full border border-[var(--auth-border)] bg-[var(--auth-card)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--auth-surface-strong)] ${
                  sidebarOpen ? "" : "h-10 w-10 justify-center px-0"
                }`}
                aria-label="Logout"
              >
                <LogoutIcon />
                {sidebarOpen ? <span>Logout</span> : null}
              </button>
            </div>
          </div>
        </aside>

        <main className={`min-w-0 flex-1 space-y-6 overflow-x-hidden transition-[margin] duration-300 ${sidebarOpen ? "ml-[296px]" : "ml-[104px]"}`}>
          <header className="rounded-[32px] bg-transparent px-5 pt-2 pb-5">
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <div className="flex w-full justify-end lg:w-auto">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="relative" ref={notificationPanelRef}>
                    <button
                      type="button"
                      onClick={() => setIsNotificationOpen((current) => !current)}
                      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-muted)] transition hover:bg-[var(--auth-surface-strong)] hover:text-[var(--auth-ink)]"
                      aria-label="Notifications"
                    >
                      <NotificationIcon />
                      {notifications.length ? <span className="absolute right-2 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--auth-accent)] px-1 text-[10px] font-bold text-[var(--auth-accent-text)]">{Math.min(notifications.length, 9)}</span> : null}
                    </button>
                    {isNotificationOpen ? (
                      <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[320px] rounded-[24px] border border-[var(--auth-border)] bg-[var(--auth-card)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--auth-ink)]">Notifications</p>
                            <p className="text-xs text-[var(--auth-muted)]">{user?.role === "admin" ? "New users and user expense activity" : "Budget alerts and recent actions"}</p>
                          </div>
                          {notifications.length ? <button type="button" onClick={() => setNotifications([])} className="text-xs font-semibold text-[var(--auth-accent)]">Clear all</button> : null}
                        </div>
                        <div className="mt-4 space-y-3">
                          {notifications.length ? notifications.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3">
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === "danger" ? "bg-red-500" : item.tone === "warning" ? "bg-amber-500" : "bg-sky-500"}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[var(--auth-ink)]">{item.title}</p>
                                  <p className="mt-1 text-xs text-[var(--auth-muted)]">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          )) : <div className="rounded-2xl border border-dashed border-[var(--auth-border)] px-4 py-6 text-center text-sm text-[var(--auth-muted)]">{user?.role === "admin" ? "Notifications will appear when users join and add expenses." : "Notifications will appear as you manage expenses and budgets."}</div>}
                        </div>
                      </div>
                    ) : null}
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              {isAdminUser ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="pt-[10px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--auth-muted)]">Admin</p>
                      <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Overview and monthly user reports</h1>
                    </div>
                    <article className="flex min-h-[200px] flex-col justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--auth-muted)]">Current overview month</p>
                        <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{adminOverview?.month || selectedMonth}</h2>
                      </div>
                      <p className="mt-3 text-sm text-[var(--auth-muted)]">Showing only admin summary and monthly report data for users.</p>
                    </article>
                  </div>

                  <div className="flex flex-col items-end self-end">
                    <MonthlyCalendar
                      monthValue={selectedMonth}
                      onMonthChange={handleMonthChange}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>
                </div>
              ) : isDashboardView ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(180px,0.95fr)_minmax(170px,0.85fr)_minmax(170px,0.85fr)_260px] xl:items-end">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="pt-[10px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--auth-muted)]">{activeNavItem}</p>
                      <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Welcome back, {userName}</h1>
                    </div>
                    <article className="flex min-h-[200px] flex-col justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--auth-accent)_44%,var(--auth-border))] hover:bg-[color:color-mix(in_srgb,var(--auth-surface-strong)_94%,var(--auth-card))] hover:shadow-[0_24px_42px_rgba(15,23,42,0.12)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--auth-muted)]">Current month spend</p>
                        <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{formatCurrency(summary?.totalSpent || 0)}</h2>
                      </div>
                      <p className="mt-3 text-sm text-[var(--auth-muted)]">Month: {summary?.currentMonth || selectedMonth}</p>
                    </article>
                  </div>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--auth-accent)_44%,var(--auth-border))] hover:bg-[color:color-mix(in_srgb,var(--auth-surface-strong)_94%,var(--auth-card))] hover:shadow-[0_24px_42px_rgba(15,23,42,0.12)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">Top category</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{summary?.topCategory?.name || "No data"}</h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">{summary?.topCategory ? formatCurrency(summary.topCategory.amount) : "Add expenses to see trends"}</p>
                  </article>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--auth-accent)_44%,var(--auth-border))] hover:bg-[color:color-mix(in_srgb,var(--auth-surface-strong)_94%,var(--auth-card))] hover:shadow-[0_24px_42px_rgba(15,23,42,0.12)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">Top payment methods</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">
                        {summary?.topPaymentMethods.length ? summary.topPaymentMethods.map((item) => item.name).join(", ") : "No data"}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">Top 3 methods this month</p>
                  </article>

                  <div className="flex flex-col items-end self-end">
                    <MonthlyCalendar
                      monthValue={selectedMonth}
                      onMonthChange={handleMonthChange}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>
                </div>
              ) : null}

              {isBudgetView ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(190px,0.95fr)_minmax(170px,0.85fr)_minmax(170px,0.85fr)_260px] xl:items-end">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="pt-[10px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--auth-muted)]">Budget</p>
                      <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Plan limits for {selectedMonth}</h1>
                    </div>
                    <article className="flex min-h-[200px] flex-col justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--auth-muted)]">Total budget</p>
                        <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{formatCurrency(totalBudgetLimit)}</h2>
                      </div>
                      <p className="mt-3 text-sm text-[var(--auth-muted)]">{budgets.length} categories budgeted this month</p>
                    </article>
                  </div>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">Spent vs budget</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{formatCurrency(totalBudgetSpent)}</h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">Remaining: {formatCurrency(totalBudgetRemaining)}</p>
                  </article>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">Alerts</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{alertCount}</h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">Categories near or over their limit</p>
                  </article>

                  <div className="flex flex-col items-end self-end">
                    <MonthlyCalendar
                      monthValue={selectedMonth}
                      onMonthChange={handleMonthChange}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>
                </div>
              ) : null}

              {isReportView ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(190px,0.95fr)_minmax(170px,0.85fr)_minmax(170px,0.85fr)_260px] xl:items-end">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="pt-[10px]">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--auth-muted)]">Report</p>
                      <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Review insights</h1>
                    </div>
                    <article className="flex min-h-[200px] flex-col justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--auth-muted)]">Reports available</p>
                        <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{reportCount}</h2>
                      </div>
                      <p className="mt-3 text-sm text-[var(--auth-muted)]">Generated SQL report snapshots</p>
                    </article>
                  </div>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">This month total</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{formatCurrency(summary?.totalSpent || 0)}</h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">Month: {summary?.currentMonth || selectedMonth}</p>
                  </article>

                  <article className="flex min-h-[200px] flex-col self-end justify-between rounded-[24px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_94%,transparent)] px-5 py-4 text-left shadow-[0_18px_38px_rgba(15,23,42,0.07)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--auth-muted)]">Top category</p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-tight text-[var(--auth-ink)]">{summary?.topCategory?.name || "No data"}</h2>
                    </div>
                    <p className="mt-3 text-sm text-[var(--auth-muted)]">Use this to spot recurring spend patterns</p>
                  </article>

                  <div className="flex flex-col items-end self-end">
                    <MonthlyCalendar
                      monthValue={selectedMonth}
                      onMonthChange={handleMonthChange}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          {errorMessage ? <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{errorMessage}</div> : null}

          {isAdminUser ? (
            <section className="space-y-6">
              {adminOverview ? (
                <article className="rounded-[28px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Admin overview</h2>
                      <p className="mt-1 text-sm text-[var(--auth-muted)]">Total users and combined spending for {adminOverview.month}.</p>
                    </div>
                    <div className="text-sm text-[var(--auth-muted)]">
                      Users: <span className="font-semibold text-[var(--auth-ink)]">{adminOverview.totalUsers}</span> · Total spend:{" "}
                      <span className="font-semibold text-[var(--auth-ink)]">{formatCurrency(adminOverview.totalSpentAcrossUsers)}</span>
                    </div>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-[var(--auth-muted)]">
                        <tr>
                          <th className="pb-3 pr-4 font-medium">Email</th>
                          <th className="pb-3 pr-4 font-medium">User ID</th>
                          <th className="pb-3 pr-4 font-medium">Role</th>
                          <th className="pb-3 font-medium">Monthly Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOverview.userSpending.map((entry) => (
                          <tr key={entry.userId} className="border-t border-[var(--auth-border)] align-top">
                            <td className="py-4 pr-4 font-medium text-[var(--auth-ink)]">{entry.email}</td>
                            <td className="py-4 pr-4 text-[var(--auth-muted)]">{entry.userId}</td>
                            <td className="py-4 pr-4 capitalize">{entry.role}</td>
                            <td className="py-4 font-semibold">{formatCurrency(entry.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ) : null}

              <article className="rounded-[28px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Monthly reports by user</h2>
                    <p className="mt-1 text-sm text-[var(--auth-muted)]">Synced with real user emails from the admin overview list.</p>
                  </div>
                  <p className="text-sm text-[var(--auth-muted)]">{adminReportRows.length} report{adminReportRows.length === 1 ? "" : "s"}</p>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[var(--auth-muted)]">
                      <tr>
                        <th className="pb-3 pr-4 font-medium">User Id</th>
                        <th className="pb-3 pr-4 font-medium">Month</th>
                        <th className="pb-3 pr-4 font-medium">Total Spent</th>
                        <th className="pb-3 pr-4 font-medium">Top Category</th>
                        <th className="pb-3 font-medium">Overbudget Categories</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReportRows.map((report) => {
                        const linkedUser = adminUsersById.get(report.userId);

                        return (
                          <tr key={`${report.userId}-${report.month}`} className="border-t border-[var(--auth-border)] align-top">
                            <td className="py-4 pr-4 font-medium text-[var(--auth-ink)]">{linkedUser?.email || report.userId}</td>
                            <td className="py-4 pr-4">{report.month}</td>
                            <td className="py-4 pr-4 font-semibold">{formatCurrency(report.totalSpent)}</td>
                            <td className="py-4 pr-4">{report.topCategory || "None"}</td>
                            <td className="py-4">{report.overbudgetCategories.length ? report.overbudgetCategories.join(", ") : "None"}</td>
                          </tr>
                        );
                      })}
                      {!adminReportRows.length ? <tr><td colSpan={5} className="py-10 text-center text-[var(--auth-muted)]">No monthly reports found for any users.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : null}

          {!isAdminUser && isDashboardView ? (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <article className="rounded-[28px] bg-transparent p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Expenses</h2>
                    <p>Track your spending!</p>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input type="search" placeholder="Search expenses" value={search} onChange={(event) => setSearch(event.target.value)} className="auth-input md:w-[260px]" />
                    <button type="button" onClick={openNewExpenseModal} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--auth-accent)] px-4 py-3 text-sm font-semibold text-[var(--auth-accent-text)] shadow-[0_14px_30px_rgba(244,161,126,0.26)] transition hover:brightness-[1.03]">
                      <PlusIcon />
                      <span>Add</span>
                    </button>
                    <button type="button" onClick={() => setIsFilterModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm font-semibold text-[var(--auth-ink)] transition hover:border-[color:color-mix(in_srgb,var(--auth-accent)_42%,var(--auth-border))] hover:bg-[var(--auth-surface-strong)]">
                      <FilterIcon />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>
                {(dateFilter || categoryFilter || paymentFilter) ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {dateFilter ? <span className="rounded-full bg-[var(--auth-surface)] px-3 py-1 text-xs font-semibold text-[var(--auth-muted)]">Date: {formatDate(dateFilter)}</span> : null}
                    {categoryFilter ? <span className="rounded-full bg-[var(--auth-surface)] px-3 py-1 text-xs font-semibold text-[var(--auth-muted)]">Category: {categoryFilter}</span> : null}
                    {paymentFilter ? <span className="rounded-full bg-[var(--auth-surface)] px-3 py-1 text-xs font-semibold text-[var(--auth-muted)]">Method: {paymentFilter}</span> : null}
                    <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-[var(--auth-accent)] underline-offset-4 hover:underline">Clear</button>
                  </div>
                ) : null}
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[var(--auth-muted)]">
                      <tr>
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 pr-4 font-medium">Category</th>
                        <th className="pb-3 pr-4 font-medium">Method</th>
                        <th className="pb-3 pr-4 font-medium">Amount</th>
                        <th className="pb-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-t border-[var(--auth-border)] align-top">
                          <td className="py-4 pr-4">{formatDate(expense.date)}</td>
                          <td className="py-4 pr-4">{expense.category}</td>
                          <td className="py-4 pr-4">{expense.paymentMethod}</td>
                          <td className="py-4 pr-4 font-semibold">
                            <div className="group relative inline-flex">
                              <span>{formatCurrency(expense.amount)}</span>
                              {expense.notes ? (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-52 -translate-x-1/2 rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)] px-3 py-2 text-left text-xs font-medium text-[var(--auth-muted)] shadow-[0_18px_38px_rgba(15,23,42,0.14)] group-hover:block">
                                  {expense.notes}
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-muted)] transition hover:border-[color:color-mix(in_srgb,var(--auth-accent)_42%,var(--auth-border))] hover:text-[var(--auth-accent)]" onClick={() => startEditingExpense(expense)} aria-label={`Edit expense on ${formatDate(expense.date)}`}>
                                <PencilIcon />
                              </button>
                              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100" onClick={() => handleDeleteExpense(expense)} aria-label={`Delete expense on ${formatDate(expense.date)}`}>
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!expenses.length ? <tr><td colSpan={5} className="py-10 text-center text-[var(--auth-muted)]">No expenses found for the selected filters.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </section>
          ) : null}

          {!isAdminUser && isBudgetView ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[28px] bg-transparent p-6">
              <h2 className="text-xl font-semibold">Monthly budget</h2>
              <p className="mt-1 text-sm text-[var(--auth-muted)]">Set category limits and keep this month under control.</p>
              <form onSubmit={handleBudgetSubmit} className="mt-5 grid gap-4">
                <select value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)} className="auth-input">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                <input type="number" min="0" step="0.01" placeholder="Monthly limit" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} className="auth-input" />
                {budgetMessage ? <p className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm text-[var(--auth-muted)]">{budgetMessage}</p> : null}
                <button type="submit" className="auth-primary-button" disabled={isSavingBudget}>{isSavingBudget ? "Saving budget..." : "Save Budget"}</button>
              </form>
            </article>
          </section>
          ) : null}

          {!isAdminUser && isReportView ? (
          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-[28px] bg-transparent p-6">
              <h2 className="text-xl font-semibold">Category-wise spending</h2>
              <p className="mt-1 text-sm text-[var(--auth-muted)]">Pie-style breakdown for the selected month.</p>
              <div className="mt-4"><PieChart items={summary?.categoryBreakdown || []} /></div>
            </article>

            <article className="rounded-[28px] bg-transparent p-6">
              <h2 className="text-xl font-semibold">Spending over time</h2>
              <p className="mt-1 text-sm text-[var(--auth-muted)]">Line graph based on your current month expenses.</p>
              <div className="mt-4"><TrendChart points={summary?.spendingTrend || []} /></div>
            </article>
          </section>
          ) : null}

          {!isAdminUser && isReportView ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="col-span-full rounded-[28px] bg-transparent p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Monthly report</h2>
                  <p className="mt-1 text-sm text-[var(--auth-muted)]">Select the month and year to get the report.</p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <select
                    value={reportMonthValue.split("-")[1]}
                    onChange={(event) => setReportMonthValue(`${reportMonthValue.split("-")[0]}-${event.target.value}`)}
                    className="auth-input md:w-[180px]"
                  >
                    {reportMonthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <select
                    value={reportMonthValue.split("-")[0]}
                    onChange={(event) => setReportMonthValue(`${event.target.value}-${reportMonthValue.split("-")[1]}`)}
                    className="auth-input md:w-[140px]"
                  >
                    {reportYearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <button type="button" onClick={handleReportLookup} className="auth-primary-button md:min-w-[110px]" disabled={isLoadingReport}>
                    {isLoadingReport ? "Loading..." : "Go"}
                  </button>
                </div>
              </div>
              <div className="mt-5">
                {reportLookupMessage ? (
                  <div className="rounded-2xl border border-dashed border-[var(--auth-border)] px-4 py-6 text-center text-sm text-[var(--auth-muted)]">{reportLookupMessage}</div>
                ) : reportResult ? (
                  <div className="rounded-[24px] border border-[var(--auth-border)] bg-[var(--auth-surface)] p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--auth-card)] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-muted)]">Month</p>
                        <p className="mt-2 text-lg font-semibold text-[var(--auth-ink)]">{reportResult.month}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--auth-card)] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-muted)]">Total Spent</p>
                        <p className="mt-2 text-lg font-semibold text-[var(--auth-ink)]">{formatCurrency(reportResult.totalSpent)}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--auth-card)] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-muted)]">Top Category</p>
                        <p className="mt-2 text-lg font-semibold text-[var(--auth-ink)]">{reportResult.topCategory}</p>
                      </div>
                      <div className="rounded-2xl bg-[var(--auth-card)] px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-muted)]">Overbudget Categories</p>
                        <p className="mt-2 text-lg font-semibold text-[var(--auth-ink)]">{reportResult.overbudgetCategories.length ? reportResult.overbudgetCategories.join(", ") : "None"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--auth-border)] px-4 py-6 text-center text-sm text-[var(--auth-muted)]">Select a month and year, then click Go to view the full saved report.</div>
                )}
              </div>
            </article>
          </section>
          ) : null}

          {!isAdminUser && isProfileView ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <article className="overflow-hidden rounded-[36px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                <div className="relative h-52 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_34%),linear-gradient(125deg,#88b8ea_0%,#c7daf8_35%,#f2d7c6_68%,#f3e7a2_100%)]">
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.28)_45%,rgba(255,255,255,0.78))]" />
                </div>

                <div className="relative px-6 pb-6 sm:px-8">
                  <div className="-mt-16 flex flex-col gap-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                      <button
                        type="button"
                        onClick={() => profileImageInputRef.current?.click()}
                        className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[32px] border-[5px] border-white bg-[linear-gradient(145deg,#f4a17e,#1e3a8a)] text-left shadow-[0_24px_50px_rgba(15,23,42,0.2)] transition hover:scale-[1.02]"
                        aria-label="Upload profile picture"
                      >
                        <div className="flex h-full w-full items-center justify-center overflow-hidden text-3xl font-black uppercase tracking-[0.08em] text-white">
                          {profileForm.profilePicture ? (
                            <Image src={profileForm.profilePicture} alt="Profile" fill unoptimized className="object-cover" />
                          ) : (userInitials || "FT")}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.82))] px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          Tap to change
                        </div>
                      </button>

                      <div className="pb-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--auth-muted)]">My profile</p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--auth-ink)]">{profileForm.name || profileForm.username || "Finance Tracker User"}</h2>
                        <p className="mt-2 text-sm text-[var(--auth-muted)]">Manage your picture, username, personal details, and secure account settings from one place.</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <span className="rounded-full border border-[var(--auth-border)] bg-white/85 px-4 py-2 font-medium text-[var(--auth-ink)]">{profileForm.username ? `@${profileForm.username}` : "@username"}</span>
                          <span className="rounded-full border border-[var(--auth-border)] bg-white/85 px-4 py-2 text-[var(--auth-muted)]">{user?.email || "No email available"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input ref={profileImageInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />

                  <form id="profile-form" onSubmit={handleProfileSubmit} className="mt-8">
                    <div className="overflow-hidden rounded-[30px] border border-[var(--auth-border)] bg-white/80">
                        <div className="border-b border-[var(--auth-border)] px-6 py-5">
                          <h3 className="text-lg font-semibold text-[var(--auth-ink)]">Profile details</h3>
                          <p className="mt-1 text-sm text-[var(--auth-muted)]">Keep your public account information up to date.</p>
                        </div>

                        <div className="grid gap-0 divide-y divide-[var(--auth-border)]">
                          <div className="grid gap-4 px-6 py-5 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                            <div>
                              <p className="text-sm font-semibold text-[var(--auth-ink)]">Full name</p>
                              <p className="mt-1 text-xs text-[var(--auth-muted)]">Displayed across your account.</p>
                            </div>
                            <input type="text" placeholder="Name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} className="auth-input" />
                          </div>

                          <div className="grid gap-4 px-6 py-5 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                            <div>
                              <p className="text-sm font-semibold text-[var(--auth-ink)]">Username</p>
                              <p className="mt-1 text-xs text-[var(--auth-muted)]">Shown in the sidebar and profile header.</p>
                            </div>
                            <input type="text" placeholder="Username" value={profileForm.username} onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))} className="auth-input" />
                          </div>

                          <div className="grid gap-4 px-6 py-5 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                            <div>
                              <p className="text-sm font-semibold text-[var(--auth-ink)]">Phone number</p>
                              <p className="mt-1 text-xs text-[var(--auth-muted)]">Used for account contact details.</p>
                            </div>
                            <input type="tel" placeholder="Phone number" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} className="auth-input" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-[var(--auth-border)] bg-[var(--auth-surface)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-[var(--auth-muted)]">Edit your details above, then save to update your profile.</p>
                          <button
                            type="submit"
                            className="auth-primary-button min-w-[170px]"
                            disabled={isSavingProfile}
                          >
                            {isSavingProfile ? "Updating profile..." : "Update profile"}
                          </button>
                        </div>
                    </div>
                  </form>

                  {profileMessage ? <p className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm text-[var(--auth-muted)]">{profileMessage}</p> : null}
                </div>
              </article>

              <div className="space-y-6">
                <article className="rounded-[30px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--auth-muted)]">Account access</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--auth-ink)]">Update sign-in settings</h2>
                  <p className="mt-2 text-sm text-[var(--auth-muted)]">Change your login email, refresh your password, and manage account safety.</p>
                </article>

                <article className="rounded-[30px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                  <h3 className="text-xl font-semibold text-[var(--auth-ink)]">Change email</h3>
                  <p className="mt-1 text-sm text-[var(--auth-muted)]">Your current login is <span className="font-semibold text-[var(--auth-ink)]">{user?.email || "not available"}</span>.</p>
                  <form onSubmit={handleEmailSubmit} className="mt-5 grid gap-4">
                    <input type="email" placeholder="New email" value={emailForm.email} onChange={(event) => setEmailForm((current) => ({ ...current, email: event.target.value }))} className="auth-input" />
                    <input type="password" placeholder="Current password" value={emailForm.password} onChange={(event) => setEmailForm((current) => ({ ...current, password: event.target.value }))} className="auth-input" />
                    {emailMessage ? <p className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm text-[var(--auth-muted)]">{emailMessage}</p> : null}
                    <button type="submit" className="auth-primary-button" disabled={isSavingEmail}>{isSavingEmail ? "Updating email..." : "Change email"}</button>
                  </form>
                </article>

                <article className="rounded-[30px] border border-[var(--auth-border)] bg-[color:color-mix(in_srgb,var(--auth-card)_96%,white)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                  <h3 className="text-xl font-semibold text-[var(--auth-ink)]">Change password</h3>
                  <p className="mt-1 text-sm text-[var(--auth-muted)]">Use your current password to confirm a new one.</p>
                  <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4">
                    <input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="auth-input" />
                    <input type="password" placeholder="New password" value={passwordForm.nextPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))} className="auth-input" />
                    {passwordMessage ? <p className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm text-[var(--auth-muted)]">{passwordMessage}</p> : null}
                    <button type="submit" className="auth-primary-button" disabled={isSavingPassword}>{isSavingPassword ? "Updating password..." : "Change password"}</button>
                  </form>
                </article>

                <article className="rounded-[30px] border border-red-200 bg-[linear-gradient(180deg,rgba(254,242,242,0.96),rgba(255,255,255,0.98))] p-6 shadow-[0_20px_50px_rgba(239,68,68,0.08)]">
                  <h3 className="text-xl font-semibold text-red-600">Delete account</h3>
                  <p className="mt-1 text-sm text-red-500">This permanently removes your account, expenses, budgets, reports, and saved profile details.</p>
                  <form onSubmit={handleDeleteAccount} className="mt-5 grid gap-4">
                    <input type="password" placeholder="Confirm with password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="auth-input" />
                    {deleteMessage ? <p className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600">{deleteMessage}</p> : null}
                    <button type="submit" className="inline-flex items-center justify-center rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600" disabled={isDeletingAccount}>{isDeletingAccount ? "Deleting account..." : "Delete account"}</button>
                  </form>
                </article>
              </div>
            </section>
          ) : null}

          {isExpenseModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-[30px] border border-[var(--auth-border)] bg-[var(--auth-card)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{editingExpenseId ? "Edit expense" : "Add expense"}</h2>
                    <p className="mt-1 text-sm text-[var(--auth-muted)]">Amount, category, date, payment method, and notes.</p>
                  </div>
                  <button type="button" onClick={closeExpenseModal} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-muted)] transition hover:bg-[var(--auth-surface-strong)] hover:text-[var(--auth-ink)]" aria-label="Close add expense dialog">
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleExpenseSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                  <input type="number" min="0" step="0.01" placeholder="Amount (e.g., 1200)" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} className="auth-input" />
                  <input type="date" value={expenseForm.date} onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))} className="auth-input" />
                  <select value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))} className="auth-input">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                  <select value={expenseForm.paymentMethod} onChange={(event) => setExpenseForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="auth-input">{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select>
                  <textarea placeholder="Notes" value={expenseForm.notes} onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))} className="auth-input min-h-28 resize-none py-3 md:col-span-2" />
                  {expenseMessage ? <p className="rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-3 text-sm text-[var(--auth-muted)] md:col-span-2">{expenseMessage}</p> : null}
                  <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                    <button type="button" onClick={closeExpenseModal} className="inline-flex items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] px-5 py-3 text-sm font-semibold text-[var(--auth-ink)] transition hover:bg-[var(--auth-surface-strong)]">Cancel</button>
                    <button type="submit" className="auth-primary-button md:min-w-[180px]" disabled={isSavingExpense}>{isSavingExpense ? (editingExpenseId ? "Updating expense..." : "Saving expense...") : (editingExpenseId ? "Update Expense" : "Add Expense")}</button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {isFilterModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[30px] border border-[var(--auth-border)] bg-[var(--auth-card)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Filter expenses</h2>
                    <p className="mt-1 text-sm text-[var(--auth-muted)]">Choose whether to filter by date, category, or payment method.</p>
                  </div>
                  <button type="button" onClick={() => setIsFilterModalOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-muted)] transition hover:bg-[var(--auth-surface-strong)] hover:text-[var(--auth-ink)]" aria-label="Close filter dialog">
                    <CloseIcon />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => setFilterType("date")} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${filterType === "date" ? "border-transparent bg-[var(--auth-accent)] text-[var(--auth-accent-text)]" : "border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-ink)] hover:bg-[var(--auth-surface-strong)]"}`}>Date</button>
                    <button type="button" onClick={() => setFilterType("category")} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${filterType === "category" ? "border-transparent bg-[var(--auth-accent)] text-[var(--auth-accent-text)]" : "border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-ink)] hover:bg-[var(--auth-surface-strong)]"}`}>Category</button>
                    <button type="button" onClick={() => setFilterType("paymentMethod")} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${filterType === "paymentMethod" ? "border-transparent bg-[var(--auth-accent)] text-[var(--auth-accent-text)]" : "border-[var(--auth-border)] bg-[var(--auth-surface)] text-[var(--auth-ink)] hover:bg-[var(--auth-surface-strong)]"}`}>Payment method</button>
                  </div>

                  {filterType === "date" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--auth-muted)]">Date</label>
                      <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="auth-input" />
                    </div>
                  ) : null}

                  {filterType === "category" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--auth-muted)]">Category</label>
                      <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="auth-input">
                        <option value="">All categories</option>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                  ) : null}

                  {filterType === "paymentMethod" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--auth-muted)]">Payment method</label>
                      <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="auth-input">
                        <option value="">All methods</option>
                        {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={clearAllFilters} className="inline-flex items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] px-5 py-3 text-sm font-semibold text-[var(--auth-ink)] transition hover:bg-[var(--auth-surface-strong)]">Clear</button>
                  <button type="button" onClick={() => setIsFilterModalOpen(false)} className="auth-primary-button sm:min-w-[140px]">Apply</button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
