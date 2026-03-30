"use client";

import { useState, useMemo, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  Filter,
  Search,
  CalendarDays,
  Layers,
  Zap,
  MoreVertical,
  ArrowUpRight,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, startOfToday, addDays, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignee_id: string | null;
  project_id: string | null;
  projects?: { id: string; name: string } | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
} | null;

type Project = { id: string; name: string };

interface MyTasksClientProps {
  tasks: Task[];
  profile: Profile;
  projects: Project[];
  userId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string; next: string }
> = {
  todo: {
    label: "To Do",
    icon: <Circle className="w-3.5 h-3.5" />,
    color: "text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    next: "in_progress",
  },
  in_progress: {
    label: "In Progress",
    icon: <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
    next: "done",
  },
  review: {
    label: "In Review",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950",
    next: "done",
  },
  done: {
    label: "Done",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    next: "todo",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  low: { label: "Low", color: "text-slate-400", dot: "bg-slate-300" },
  medium: { label: "Medium", color: "text-amber-500", dot: "bg-amber-400" },
  high: { label: "High", color: "text-orange-500", dot: "bg-orange-400" },
  urgent: { label: "Urgent", color: "text-red-500", dot: "bg-red-500" },
};

const STATUS_ORDER = ["todo", "in_progress", "review", "done"];
const PRIORITY_ORDER = ["urgent", "high", "medium", "low"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDueState(due_date: string | null): "overdue" | "due_soon" | "upcoming" | "none" {
  if (!due_date) return "none";
  const today = startOfToday();
  const due = parseISO(due_date);
  if (isBefore(due, today)) return "overdue";
  if (isBefore(due, addDays(today, 2))) return "due_soon";
  return "upcoming";
}

function formatDue(due_date: string): string {
  const today = startOfToday();
  const due = parseISO(due_date);
  if (format(due, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Today";
  if (format(due, "yyyy-MM-dd") === format(addDays(today, 1), "yyyy-MM-dd")) return "Tomorrow";
  return format(due, "MMM d");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  return (
    <button
      onClick={onClick}
      title="Click to advance status"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
        cfg.bg,
        cfg.color,
        onClick && "hover:opacity-80 active:scale-95 cursor-pointer"
      )}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "inherit" }}>
      <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      <span className={cfg.color}>{cfg.label}</span>
    </span>
  );
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange: (id: string, newStatus: string) => void;
}) {
  const dueState = getDueState(task.due_date);
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;

  const isOverdue = dueState === "overdue" && task.status !== "done";
  const isDueSoon = dueState === "due_soon" && task.status !== "done";

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isOverdue
          ? "border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20"
          : isDueSoon
          ? "border-amber-200 dark:border-amber-900/60"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      {/* Overdue accent strip */}
      {isOverdue && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-red-400 rounded-full" />
      )}

      <div className="p-4">
        {/* Top row: status + priority + overflow */}
        <div className="flex items-center justify-between mb-2.5">
          <StatusBadge
            status={task.status}
            onClick={() => onStatusChange(task.id, cfg.next)}
          />
          <div className="flex items-center gap-2">
            <PriorityDot priority={task.priority} />
          </div>
        </div>

        {/* Title */}
        <p
          className={cn(
            "text-sm font-semibold leading-snug mb-1.5",
            task.status === "done"
              ? "line-through text-slate-400 dark:text-slate-600"
              : isOverdue
              ? "text-red-800 dark:text-red-200"
              : "text-slate-800 dark:text-slate-100"
          )}
        >
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Footer: project + due date */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {task.projects ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Layers className="w-3 h-3" />
              {task.projects.name}
            </span>
          ) : (
            <span />
          )}

          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isOverdue
                  ? "text-red-500"
                  : isDueSoon
                  ? "text-amber-500"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              {!isOverdue && <CalendarDays className="w-3 h-3" />}
              {formatDue(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  projectFilter,
  setProjectFilter,
  projects,
  activeCount,
}: {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
  projects: Project[];
  activeCount: number;
}) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
        />
      </div>

      {/* Filter pills — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_CONFIG[s].label })),
          ]}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "all", label: "All Priority" },
            ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_CONFIG[p].label })),
          ]}
          icon={<Zap className="w-3.5 h-3.5" />}
        />
        <Select
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "all", label: "All Projects" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          icon={<Layers className="w-3.5 h-3.5" />}
        />
        {activeCount > 0 && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setProjectFilter("all");
            }}
            className="flex-shrink-0 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-colors"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  const isActive = value !== "all";
  return (
    <div className="relative flex-shrink-0">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none pl-7 pr-7 py-2 text-xs font-medium rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
          isActive
            ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner({ tasks }: { tasks: Task[] }) {
  const today = startOfToday();
  const overdue = tasks.filter(
    (t) => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== "done"
  ).length;
  const dueSoon = tasks.filter(
    (t) =>
      t.due_date &&
      !isBefore(parseISO(t.due_date), today) &&
      isBefore(parseISO(t.due_date), addDays(today, 2)) &&
      t.status !== "done"
  ).length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  const stats = [
    { label: "Total", value: tasks.length, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800" },
    { label: "In Progress", value: inProgress, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Due Soon", value: dueSoon, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
    { label: "Overdue", value: overdue, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950" },
    { label: "Completed", value: done, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn("rounded-xl p-3 text-center", s.bg)}
        >
          <p className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Group View ───────────────────────────────────────────────────────────────

type GroupBy = "status" | "priority" | "project" | "due";

function GroupSection({
  title,
  tasks,
  onStatusChange,
  color,
  defaultOpen = true,
}: {
  title: string;
  tasks: Task[];
  onStatusChange: (id: string, s: string) => void;
  color?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-widest",
            color ?? "text-slate-500 dark:text-slate-400"
          )}
        >
          {title}
        </span>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 transition-transform ml-auto",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyTasksClient({
  tasks: initialTasks,
  profile,
  projects,
  userId,
}: MyTasksClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // Active filter count
  const activeFilterCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    projectFilter !== "all",
    search !== "",
  ].filter(Boolean).length;

  // Filtered tasks
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, projectFilter]);

  // Grouped tasks
  const grouped = useMemo(() => {
    if (groupBy === "status") {
      return STATUS_ORDER.map((s) => ({
        key: s,
        title: STATUS_CONFIG[s]?.label ?? s,
        tasks: filtered.filter((t) => t.status === s),
        color: STATUS_CONFIG[s]?.color,
        defaultOpen: s !== "done",
      })).filter((g) => g.tasks.length > 0);
    }
    if (groupBy === "priority") {
      return PRIORITY_ORDER.map((p) => ({
        key: p,
        title: PRIORITY_CONFIG[p]?.label ?? p,
        tasks: filtered.filter((t) => t.priority === p),
        color: PRIORITY_CONFIG[p]?.color,
        defaultOpen: true,
      })).filter((g) => g.tasks.length > 0);
    }
    if (groupBy === "project") {
      const projectMap = new Map<string, Task[]>();
      filtered.forEach((t) => {
        const key = t.project_id ?? "no_project";
        if (!projectMap.has(key)) projectMap.set(key, []);
        projectMap.get(key)!.push(t);
      });
      return Array.from(projectMap.entries()).map(([key, tasks]) => ({
        key,
        title: tasks[0]?.projects?.name ?? "No Project",
        tasks,
        color: "text-slate-600 dark:text-slate-300",
        defaultOpen: true,
      }));
    }
    // groupBy === "due"
    const today = startOfToday();
    const groups = [
      {
        key: "overdue",
        title: "Overdue",
        tasks: filtered.filter(
          (t) => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== "done"
        ),
        color: "text-red-500",
        defaultOpen: true,
      },
      {
        key: "today",
        title: "Due Today",
        tasks: filtered.filter(
          (t) =>
            t.due_date &&
            format(parseISO(t.due_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
        ),
        color: "text-amber-500",
        defaultOpen: true,
      },
      {
        key: "this_week",
        title: "This Week",
        tasks: filtered.filter(
          (t) =>
            t.due_date &&
            isAfter(parseISO(t.due_date), today) &&
            isBefore(parseISO(t.due_date), addDays(today, 7))
        ),
        color: "text-blue-500",
        defaultOpen: true,
      },
      {
        key: "later",
        title: "Later",
        tasks: filtered.filter(
          (t) => !t.due_date || isAfter(parseISO(t.due_date), addDays(today, 7))
        ),
        color: "text-slate-400",
        defaultOpen: false,
      },
    ].filter((g) => g.tasks.length > 0);
    return groups;
  }, [filtered, groupBy]);

  // Quick status update
  async function handleStatusChange(taskId: string, newStatus: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Failed to update task status:", error);
      // Revert
      setTasks(initialTasks);
    }
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              My Tasks
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hey {firstName} — here's everything on your plate.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Group By control */}
            <div className="relative">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="status">By Status</option>
                <option value="priority">By Priority</option>
                <option value="project">By Project</option>
                <option value="due">By Due Date</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBanner tasks={tasks} />

        {/* Filters */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          projects={projects}
          activeCount={activeFilterCount}
        />

        {/* Task groups */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
              {activeFilterCount > 0 ? "No tasks match your filters" : "No tasks assigned to you"}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {activeFilterCount > 0
                ? "Try adjusting your filters to see more tasks."
                : "Tasks assigned to you will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((g) => (
              <GroupSection
                key={g.key}
                title={g.title}
                tasks={g.tasks}
                onStatusChange={handleStatusChange}
                color={g.color}
                defaultOpen={g.defaultOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
