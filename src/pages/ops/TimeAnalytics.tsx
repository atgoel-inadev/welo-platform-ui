import { useEffect, useState } from 'react';
import { Clock, Users, UserCheck, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import {
  taskService,
  TimeAnalytics as TimeAnalyticsData,
  TimeAnalyticsQueryDto,
} from '../../services/taskService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatAvg(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  return formatDuration(Math.round(seconds));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const TimeAnalytics = () => {
  const [data, setData] = useState<TimeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TimeAnalyticsQueryDto>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await taskService.getTimeAnalytics(filters);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load time analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TimeAnalyticsQueryDto, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  const summary = data?.summary;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track time spent by annotators and reviewers across tasks
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Filters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project ID</label>
            <input
              type="text"
              value={filters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              placeholder="Filter by project..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Batch ID</label>
            <input
              type="text"
              value={filters.batchId || ''}
              onChange={(e) => handleFilterChange('batchId', e.target.value)}
              placeholder="Filter by batch..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
            <input
              type="text"
              value={filters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-24 animate-pulse">
              <div className="bg-gray-100 rounded-lg h-full" />
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {!loading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Annotators"
            value={String(summary.totalAnnotators)}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            label="Total Reviewers"
            value={String(summary.totalReviewers)}
            icon={UserCheck}
            color="bg-teal-500"
          />
          <StatCard
            label="Total Annotation Time"
            value={formatDuration(summary.totalAnnotationTime)}
            sub={`Avg ${formatAvg(summary.averageAnnotationTime)} per task`}
            icon={Clock}
            color="bg-purple-500"
          />
          <StatCard
            label="Total Review Time"
            value={formatDuration(summary.totalReviewTime)}
            sub={`Avg ${formatAvg(summary.averageReviewTime)} per review`}
            icon={Clock}
            color="bg-amber-500"
          />
          <StatCard
            label="Avg Annotation Time"
            value={formatAvg(summary.averageAnnotationTime)}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <StatCard
            label="Avg Review Time"
            value={formatAvg(summary.averageReviewTime)}
            icon={BarChart2}
            color="bg-rose-500"
          />
        </div>
      )}

      {/* Annotator Metrics Table */}
      {!loading && data && data.annotatorMetrics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Annotator Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tasks</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Time</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Avg per Task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.annotatorMetrics.map((m, i) => (
                  <tr key={m.userId} className={i % 2 === 0 ? '' : 'bg-gray-50/40'}>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <span className="font-mono text-xs text-gray-500">{m.userId}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">{m.totalTasks}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{formatDuration(m.totalTimeSpent)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {formatAvg(m.averageTimePerTask)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviewer Metrics Table */}
      {!loading && data && data.reviewerMetrics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <UserCheck size={16} className="text-teal-500" />
            <h2 className="text-base font-semibold text-gray-900">Reviewer Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Reviews</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Time</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Avg per Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.reviewerMetrics.map((m, i) => (
                  <tr key={m.userId} className={i % 2 === 0 ? '' : 'bg-gray-50/40'}>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <span className="font-mono text-xs text-gray-500">{m.userId}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">{m.totalReviews}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{formatDuration(m.totalTimeSpent)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs font-medium">
                        {formatAvg(m.averageTimePerReview)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Efficiency Table */}
      {!loading && data && data.taskMetrics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">Task Efficiency</h2>
            <span className="ml-auto text-xs text-gray-400">{data.taskMetrics.length} tasks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Task ID</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Estimated</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actual</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.taskMetrics.map((m, i) => (
                  <tr key={m.taskId} className={i % 2 === 0 ? '' : 'bg-gray-50/40'}>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-gray-500">{m.taskId}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">{formatDuration(m.estimatedDuration)}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{formatDuration(m.actualDuration)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        m.efficiency >= 90
                          ? 'bg-green-100 text-green-700'
                          : m.efficiency >= 70
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {m.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && !error &&
        data.annotatorMetrics.length === 0 &&
        data.reviewerMetrics.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Clock size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No time data available yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Time data will appear once annotators and reviewers complete tasks.
            </p>
          </div>
        )}
    </div>
  );
};

export default TimeAnalytics;
