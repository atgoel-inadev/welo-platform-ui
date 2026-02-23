import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  BarChart2,
  MessageSquare,
  UserCheck,
  Layers,
} from 'lucide-react';
import { taskService, Task, TaskFilterDto } from '../../services/taskService';
import { batchService, Batch } from '../../services/batchService';
import { projectService } from '../../services/projectService';
import { userService, ProjectTeamMember } from '../../services/userService';
import { User as UserType } from '../../services/authService';
import { useAppSelector } from '../../hooks/useRedux';
import { TaskDetailPanel } from '../../components/pm/TaskDetailPanel';

// ── Types ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SKIPPED', label: 'Skipped' },
];

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  QUEUED:      { color: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-400',    label: 'Queued' },
  ASSIGNED:    { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    label: 'Assigned' },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'In Progress' },
  SUBMITTED:   { color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', label: 'Submitted' },
  APPROVED:    { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',   label: 'Approved' },
  REJECTED:    { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',     label: 'Rejected' },
  SKIPPED:     { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-300',    label: 'Skipped' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.QUEUED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 text-left transition-all w-full ${
        active ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </button>
  );
}

// ── Batch Accordion Row ────────────────────────────────────────────────────

function BatchSection({
  batch,
  tasks,
  allUsers,
  onTaskClick,
}: {
  batch: Batch;
  tasks: Task[];
  allUsers: UserType[];
  onTaskClick: (task: Task) => void;
}) {
  const [open, setOpen] = useState(true);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    tasks.forEach((t) => { c[t.status] = (c[t.status] ?? 0) + 1; });
    return c;
  }, [tasks]);

  const completionPct = tasks.length > 0
    ? Math.round(((counts.APPROVED ?? 0) / tasks.length) * 100)
    : 0;

  function resolveUserName(userId: string | undefined): string {
    if (!userId) return '—';
    const u = allUsers.find((x) => x.id === userId);
    if (!u) return userId.slice(0, 8) + '…';
    return `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim() || u.name;
  }

  function getAssignedUserId(task: Task): string | undefined {
    if (!task.assignments) return undefined;
    const active = (task.assignments as any[]).find(
      (a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS',
    );
    return active?.userId;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Batch header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{batch.name}</span>
            <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
              {tasks.length} tasks
            </span>
            <span className="text-xs text-gray-500 capitalize">{batch.status?.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{completionPct}% approved</span>
          </div>
        </div>
        {/* Mini status chips */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {Object.entries(counts).slice(0, 4).map(([status, count]) => (
            <span key={status} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
              {count} {STATUS_CONFIG[status]?.label ?? status}
            </span>
          ))}
        </div>
      </button>

      {/* Tasks table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task / File</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Review Lvl</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No tasks in this batch match the current filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const assignedId = getAssignedUserId(task);
                  const assignedName = resolveUserName(assignedId);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => onTaskClick(task)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {(task as any).fileName || task.externalId}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{task.externalId}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {assignedId ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {assignedName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-800">{assignedName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-sm text-gray-700">
                          {(task as any).currentReviewLevel ?? 0}/{(task as any).maxReviewLevel ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-sm text-gray-700">{task.priority}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">
                        <span className="text-xs text-gray-400">
                          {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onTaskClick(task)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export const ProjectTaskDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // Data
  const [project, setProject] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [quickStatusFilter, setQuickStatusFilter] = useState('');

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');

    try {
      const [projectData, batchList, teamData, usersData] = await Promise.all([
        projectService.fetchProjectById(projectId),
        batchService.listBatches(projectId),
        userService.getProjectTeam(projectId),
        userService.listUsers({ limit: 200 }),
      ]);

      setProject(projectData);
      setBatches(batchList);
      setTeamMembers(teamData);
      setAllUsers(usersData.data);

      // Load tasks for project
      const filter: TaskFilterDto = {
        projectId,
        pageSize: PAGE_SIZE,
        page,
      };
      if (statusFilter) filter.status = statusFilter as any;
      if (batchFilter) filter.batchId = batchFilter;
      if (assigneeFilter) filter.assignedTo = assigneeFilter;

      const result = await taskService.listTasksForPM(filter);
      setTasks(result.tasks ?? []);
      setTotal(result.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load task data');
    } finally {
      setLoading(false);
    }
  }, [projectId, page, statusFilter, batchFilter, assigneeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const s = {
      total: total,
      queued: 0, assigned: 0, inProgress: 0, submitted: 0, approved: 0, rejected: 0,
    };
    tasks.forEach((t) => {
      if (t.status === 'QUEUED') s.queued++;
      else if (t.status === 'ASSIGNED') s.assigned++;
      else if (t.status === 'IN_PROGRESS') s.inProgress++;
      else if (t.status === 'SUBMITTED') s.submitted++;
      else if (t.status === 'APPROVED') s.approved++;
      else if (t.status === 'REJECTED') s.rejected++;
    });
    return s;
  }, [tasks, total]);

  // ── Client-side filtering / grouping ──────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let result = tasks;
    const effectiveStatus = quickStatusFilter || statusFilter;
    if (effectiveStatus) result = result.filter((t) => t.status === effectiveStatus);
    if (batchFilter) result = result.filter((t) => t.batchId === batchFilter);
    if (assigneeFilter) {
      result = result.filter((t) =>
        t.assignments?.some?.((a: any) =>
          a.userId === assigneeFilter && ['ASSIGNED', 'IN_PROGRESS'].includes(a.status),
        ),
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          ((t as any).fileName ?? '').toLowerCase().includes(q) ||
          t.externalId.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, quickStatusFilter, statusFilter, batchFilter, assigneeFilter, searchQuery]);

  // Group filtered tasks by batch
  const tasksByBatch = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach((t) => {
      const arr = map.get(t.batchId) ?? [];
      arr.push(t);
      map.set(t.batchId, arr);
    });
    return map;
  }, [filteredTasks]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const teamMemberUsers: UserType[] = useMemo(
    () => teamMembers.map((m) => m.user).filter(Boolean) as UserType[],
    [teamMembers],
  );

  const resolveUserName = (userId: string | undefined) => {
    if (!userId) return '—';
    const u = allUsers.find((x) => x.id === userId);
    if (!u) return userId.slice(0, 8) + '…';
    return `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim() || u.name;
  };

  const handleQuickStatus = (status: string) => {
    setQuickStatusFilter((prev) => (prev === status ? '' : status));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading && tasks.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-500">Loading task dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/ops/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Task Dashboard
            </h1>
            {project && (
              <p className="text-gray-500 mt-0.5">
                {project.name} · {project.project_type}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/ops/projects/${projectId}/batch-upload`}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Batch
            </Link>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} icon={Layers} color="bg-gray-100 text-gray-600"
          onClick={() => handleQuickStatus('')} active={quickStatusFilter === ''} />
        <StatCard label="Queued" value={stats.queued} icon={Clock} color="bg-gray-100 text-gray-500"
          onClick={() => handleQuickStatus('QUEUED')} active={quickStatusFilter === 'QUEUED'} />
        <StatCard label="In Progress" value={stats.inProgress + stats.assigned} icon={Play} color="bg-yellow-100 text-yellow-600"
          onClick={() => handleQuickStatus('IN_PROGRESS')} active={quickStatusFilter === 'IN_PROGRESS'} />
        <StatCard label="Submitted" value={stats.submitted} icon={UserCheck} color="bg-purple-100 text-purple-600"
          onClick={() => handleQuickStatus('SUBMITTED')} active={quickStatusFilter === 'SUBMITTED'} />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="bg-green-100 text-green-600"
          onClick={() => handleQuickStatus('APPROVED')} active={quickStatusFilter === 'APPROVED'} />
        <StatCard label="Rejected" value={stats.rejected} icon={AlertCircle} color="bg-red-100 text-red-600"
          onClick={() => handleQuickStatus('REJECTED')} active={quickStatusFilter === 'REJECTED'} />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by file name or task ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters || statusFilter || batchFilter || assigneeFilter
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter || batchFilter || assigneeFilter) && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {[statusFilter, batchFilter, assigneeFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {(statusFilter || batchFilter || assigneeFilter || searchQuery || quickStatusFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setBatchFilter('');
                setAssigneeFilter('');
                setSearchQuery('');
                setQuickStatusFilter('');
              }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setQuickStatusFilter(''); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Batch</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assignees</option>
                {teamMembers.map((m) => {
                  if (!m.user) return null;
                  const name = resolveUserName(m.userId);
                  return (
                    <option key={m.userId} value={m.userId}>
                      {name} ({m.role})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary line ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span> tasks
          {total > PAGE_SIZE && (
            <span> (of {total} total — use filters to narrow down)</span>
          )}
          {quickStatusFilter && (
            <> with status <StatusBadge status={quickStatusFilter} /></>
          )}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          {teamMembers.length} team members · {batches.length} batches
        </div>
      </div>

      {/* ── Batch-grouped Task List ────────────────────────────────────────── */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <BarChart2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No batches yet</h3>
          <p className="text-gray-500 mb-5 text-sm">
            Upload a batch to start tracking tasks for this project.
          </p>
          <Link
            to={`/ops/projects/${projectId}/batch-upload`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Upload First Batch
          </Link>
        </div>
      ) : tasksByBatch.size === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No tasks match your filters</h3>
          <p className="text-sm text-gray-500">Try removing filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches
            .filter((b) => tasksByBatch.has(b.id))
            .map((batch) => (
              <BatchSection
                key={batch.id}
                batch={batch}
                tasks={tasksByBatch.get(batch.id) ?? []}
                allUsers={allUsers}
                onTaskClick={setSelectedTask}
              />
            ))}

          {/* Tasks for batches not in batch list (shouldn't normally happen) */}
          {(() => {
            const knownBatchIds = new Set(batches.map((b) => b.id));
            const orphanTasks: Task[] = [];
            tasksByBatch.forEach((tArr, bId) => {
              if (!knownBatchIds.has(bId)) orphanTasks.push(...tArr);
            });
            if (orphanTasks.length === 0) return null;
            return (
              <BatchSection
                batch={{ id: 'other', name: 'Other Tasks', status: 'CREATED' } as any}
                tasks={orphanTasks}
                allUsers={allUsers}
                onTaskClick={setSelectedTask}
              />
            );
          })()}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Task Detail Panel ────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectTeamMembers={teamMemberUsers}
          onClose={() => setSelectedTask(null)}
          onReassigned={() => {
            setSelectedTask(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
