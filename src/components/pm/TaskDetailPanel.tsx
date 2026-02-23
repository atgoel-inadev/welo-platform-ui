import { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Clock,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Send,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { taskService, Task, TaskComment, Assignment } from '../../services/taskService';
import { userService } from '../../services/userService';
import { User as UserType } from '../../services/authService';
import { useAppSelector } from '../../hooks/useRedux';

interface TaskDetailPanelProps {
  task: Task | null;
  projectTeamMembers: UserType[];
  onClose: () => void;
  onReassigned: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  QUEUED:      { color: 'bg-gray-100 text-gray-700',    label: 'Queued' },
  ASSIGNED:    { color: 'bg-blue-100 text-blue-700',    label: 'Assigned' },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-700', label: 'In Progress' },
  SUBMITTED:   { color: 'bg-purple-100 text-purple-700', label: 'Submitted' },
  APPROVED:    { color: 'bg-green-100 text-green-700',  label: 'Approved' },
  REJECTED:    { color: 'bg-red-100 text-red-700',      label: 'Rejected' },
  SKIPPED:     { color: 'bg-gray-100 text-gray-500',    label: 'Skipped' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.QUEUED;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CommentThread({
  comment,
  allUsers,
  currentUserId,
  onResolve,
  onDelete,
  onReply,
}: {
  comment: TaskComment;
  allUsers: UserType[];
  currentUserId: string;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const author = allUsers.find((u) => u.id === comment.userId);
  const authorName = author ? `${(author as any).firstName ?? ''} ${(author as any).lastName ?? ''}`.trim() || author.name : 'Unknown';
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <div className={`rounded-lg border ${comment.isResolved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{authorName}</span>
                <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                {comment.isResolved && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Resolved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!comment.isResolved && (
                  <>
                    <button
                      onClick={() => onReply(comment.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => onResolve(comment.id)}
                      className="text-xs text-green-600 hover:text-green-800 px-2 py-0.5 rounded hover:bg-green-50"
                    >
                      Resolve
                    </button>
                  </>
                )}
                {comment.userId === currentUserId && !comment.isResolved && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {expanded && (
            <div className="px-3 pb-3 space-y-2">
              {comment.replies.map((reply) => {
                const replyAuthor = allUsers.find((u) => u.id === reply.userId);
                const replyName = replyAuthor
                  ? `${(replyAuthor as any).firstName ?? ''} ${(replyAuthor as any).lastName ?? ''}`.trim() || replyAuthor.name
                  : 'Unknown';
                return (
                  <div key={reply.id} className="flex items-start gap-2 bg-gray-50 rounded p-2">
                    <CornerDownRight className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {replyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-800">{replyName}</span>
                        <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskDetailPanel({ task, projectTeamMembers, onClose, onReassigned }: TaskDetailPanelProps) {
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showReassign, setShowReassign] = useState(false);
  const [reassignUserId, setReassignUserId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load all users for user name resolution
  useEffect(() => {
    userService.listUsers({ limit: 200 }).then((r) => setAllUsers(r.data)).catch(() => {});
  }, []);

  const loadComments = useCallback(async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const data = await taskService.getTaskComments(task.id);
      setComments(data);
    } catch {
      // non-fatal
    } finally {
      setLoadingComments(false);
    }
  }, [task]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  if (!task) return null;

  const assignedUser = allUsers.find(
    (u) => task.assignments?.some?.((a: Assignment) => a.userId === u.id && ['ASSIGNED', 'IN_PROGRESS'].includes(a.status))
  );
  const assignedUserName = assignedUser
    ? `${(assignedUser as any).firstName ?? ''} ${(assignedUser as any).lastName ?? ''}`.trim() || assignedUser.name
    : null;

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setSubmittingComment(true);
    setError('');
    try {
      await taskService.addTaskComment(task.id, commentText.trim(), currentUser.id, replyToId ?? undefined);
      setCommentText('');
      setReplyToId(null);
      await loadComments();
    } catch (e: any) {
      setError(e.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    if (!currentUser) return;
    try {
      await taskService.resolveTaskComment(task.id, commentId, currentUser.id);
      await loadComments();
    } catch (e: any) {
      setError(e.message || 'Failed to resolve comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Delete this comment?')) return;
    try {
      await taskService.deleteTaskComment(task.id, commentId, currentUser.id);
      await loadComments();
    } catch (e: any) {
      setError(e.message || 'Failed to delete comment');
    }
  };

  const handleReassign = async () => {
    if (!reassignUserId) return;
    setReassigning(true);
    setError('');
    setSuccess('');
    try {
      await taskService.reassignTask(task.id, reassignUserId, reassignReason || undefined);
      setSuccess('Task reassigned successfully');
      setShowReassign(false);
      setReassignUserId('');
      setReassignReason('');
      onReassigned();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  const candidatesForReassign = projectTeamMembers.filter(
    (u) => (u as any).role === 'ANNOTATOR' || (u as any).role === 'REVIEWER'
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={task.status} />
              <span className="text-xs text-gray-500 font-mono">{task.externalId}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate max-w-sm">
              {(task as any).fileName || task.dataPayload?.sourceData?.title || task.externalId}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status/feedback banners */}
          {error && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mx-5 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* ── Task Metadata ── */}
          <div className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Info</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900 capitalize">{task.taskType?.toLowerCase() ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priority</dt>
                <dd className="font-medium text-gray-900">{task.priority ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">File Type</dt>
                <dd className="font-medium text-gray-900">{task.fileType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Review Level</dt>
                <dd className="font-medium text-gray-900">
                  {(task as any).currentReviewLevel ?? 0} / {(task as any).maxReviewLevel ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Assignments</dt>
                <dd className="font-medium text-gray-900">
                  {(task as any).completedAssignments ?? 0} / {(task as any).totalAssignmentsRequired ?? 1}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Consensus</dt>
                <dd className="font-medium text-gray-900">
                  {task.requiresConsensus ? (task as any).consensusReached ? '✓ Reached' : 'Pending' : 'N/A'}
                </dd>
              </div>
              {task.dueDate && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Due Date</dt>
                  <dd className="font-medium text-gray-900">{new Date(task.dueDate).toLocaleDateString()}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">{new Date(task.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* ── Current Assignment ── */}
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Assignment</h3>
              <button
                onClick={() => { setShowReassign((v) => !v); setError(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
              >
                <RefreshCw className="w-3 h-3" />
                Reallocate
              </button>
            </div>

            {assignedUserName ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-semibold text-sm">
                  {assignedUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignedUserName}</p>
                  <p className="text-xs text-gray-500">{assignedUser?.email}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                <User className="w-4 h-4" />
                Unassigned
              </div>
            )}

            {/* Reassign form */}
            {showReassign && (
              <div className="mt-3 p-3 border border-blue-200 bg-blue-50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-blue-800">Reassign to a team member:</p>
                <select
                  value={reassignUserId}
                  onChange={(e) => setReassignUserId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select user...</option>
                  {candidatesForReassign.map((u) => {
                    const name = `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim() || u.name;
                    return (
                      <option key={u.id} value={u.id}>
                        {name} ({(u as any).role ?? u.role})
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowReassign(false); setReassignUserId(''); setReassignReason(''); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!reassignUserId || reassigning}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {reassigning ? 'Reassigning...' : 'Confirm Reassign'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Assignment History ── */}
          {task.assignments && task.assignments.length > 0 && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assignment History</h3>
              <div className="space-y-2">
                {(task.assignments as Assignment[]).slice().reverse().map((a) => {
                  const u = allUsers.find((x) => x.id === a.userId);
                  const uName = u ? `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim() || u.name : a.userId.slice(0, 8) + '…';
                  return (
                    <div key={a.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{uName}</span>
                        <span className="text-gray-500 ml-2">({a.workflowStage})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          a.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                          a.status === 'RELEASED' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'}`}
                      >
                        {a.status}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(a.assignedAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Comments ── */}
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Comments
                {comments.length > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-700 text-xs rounded-full px-1.5 py-0.5 font-normal">
                    {comments.length}
                  </span>
                )}
              </h3>
              <button onClick={loadComments} className="text-gray-400 hover:text-gray-600">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reply context */}
            {replyToId && (
              <div className="mb-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded">
                <CornerDownRight className="w-3.5 h-3.5" />
                Replying to comment
                <button onClick={() => setReplyToId(null)} className="ml-auto text-blue-500 hover:text-blue-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Add comment */}
            <div className="flex gap-2 mb-4">
              <textarea
                rows={2}
                placeholder={replyToId ? 'Write a reply…' : 'Add a comment or note for this task…'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || submittingComment}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1 self-start"
              >
                {submittingComment ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Comment list */}
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to add one.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <CommentThread
                    key={c.id}
                    comment={c}
                    allUsers={allUsers}
                    currentUserId={currentUser?.id ?? ''}
                    onResolve={handleResolve}
                    onDelete={handleDeleteComment}
                    onReply={(parentId) => { setReplyToId(parentId); setCommentText(''); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
