/**
 * DemoWorkflow – guided end-to-end demo of the annotation cycle.
 *
 * Step 1  ▸ Configure a batch (name + media files)
 * Step 2  ▸ Create batch → allocate files → auto-assign to annotators
 * Step 3  ▸ Annotator annotates each task (links to /annotate/task/:id)
 * Step 4  ▸ Reviewer reviews each task  (links to /review/task/:id)
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Loader2,
  CheckCircle, AlertCircle, FileText, Image, Music, Video,
  PlayCircle, Eye, RefreshCw, Layers, ArrowRight,
} from 'lucide-react';
import { batchService, FileAllocationDto } from '../../services/batchService';

// ─── Sample files for quick demo ─────────────────────────────────────────────
const SAMPLE_FILES = [
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/240px-PNG_transparency_demonstration_1.png',
    name: 'sample-image-1.png',
    type: 'IMAGE' as const,
  },
  {
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/html/img/table-layout-ex3.png',
    name: 'sample-image-2.png',
    type: 'IMAGE' as const,
  },
  {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    name: 'sample-video.mp4',
    type: 'VIDEO' as const,
  },
];

type FileType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'TEXT' | 'PDF' | 'CSV';

interface DemoFile {
  id: string;
  url: string;
  name: string;
  type: FileType;
}

interface CreatedTask {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: string;
  assignedTo?: string;
}

type Step = 1 | 2 | 3 | 4;

const FILE_ICONS: Record<FileType, React.ReactNode> = {
  IMAGE: <Image size={16} className="text-purple-500" />,
  AUDIO: <Music size={16} className="text-green-500" />,
  VIDEO: <Video size={16} className="text-blue-500" />,
  TEXT:  <FileText size={16} className="text-gray-500" />,
  PDF:   <FileText size={16} className="text-red-500" />,
  CSV:   <FileText size={16} className="text-emerald-500" />,
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const steps = [
    { n: 1, label: 'Configure Batch' },
    { n: 2, label: 'Create & Assign' },
    { n: 3, label: 'Annotate Tasks' },
    { n: 4, label: 'Review & Approve' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
              current > s.n
                ? 'bg-green-500 border-green-500 text-white'
                : current === s.n
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {current > s.n ? <CheckCircle size={16} /> : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
              current === s.n ? 'text-blue-700' : current > s.n ? 'text-green-600' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 ${current > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const DemoWorkflow: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: batch config
  const [batchName, setBatchName] = useState(
    `Demo Batch – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  );
  const [files, setFiles] = useState<DemoFile[]>(
    SAMPLE_FILES.map((f, i) => ({ id: String(i + 1), ...f }))
  );

  // Step 2: results
  const [batchId, setBatchId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CreatedTask[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);

  // ── File management ────────────────────────────────────────────────────────
  const addFile = () =>
    setFiles((prev) => [
      ...prev,
      { id: Date.now().toString(), url: '', name: '', type: 'IMAGE' },
    ]);

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateFile = (id: string, field: keyof DemoFile, value: string) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  const loadSamples = () =>
    setFiles(SAMPLE_FILES.map((f, i) => ({ id: String(i + 1), ...f })));

  // ── Step 1 → 2: Create batch + allocate files + auto-assign ───────────────
  const handleCreate = useCallback(async () => {
    if (!projectId) { setError('No project ID in URL.'); return; }
    const validFiles = files.filter((f) => f.url.trim() && f.name.trim());
    if (validFiles.length === 0) { setError('Add at least one file with URL and name.'); return; }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create batch
      const batch = await batchService.createBatch({
        projectId,
        name: batchName.trim() || `Demo Batch ${Date.now()}`,
        description: 'Created via Demo Workflow',
        priority: 3,
      });
      setBatchId(batch.id);

      // 2. Allocate files → creates one task per file
      const allocationDto: FileAllocationDto[] = validFiles.map((f, i) => ({
        externalId: `demo-${Date.now()}-${i}`,
        fileUrl: f.url.trim(),
        fileType: f.type,
        fileName: f.name.trim() || `file-${i + 1}`,
        fileSize: 0,
        metadata: { demo: true },
      }));

      const createdTasks = await batchService.allocateFiles(batch.id, {
        files: allocationDto,
        autoAssign: false,
        taskType: 'ANNOTATION',
        priority: 3,
      });

      const taskList: CreatedTask[] = (createdTasks || []).map((t: any) => ({
        id: t.id,
        fileUrl: t.fileUrl || t.file_url || '',
        fileName: t.fileName || t.file_name || '',
        fileType: t.fileType || t.file_type || '',
        status: t.status || 'QUEUED',
        assignedTo: t.assignedTo || t.assigned_to,
      }));
      setTasks(taskList);

      // 3. Auto-assign to project annotators
      try {
        const assignResult = await batchService.autoAssignTasks(batch.id, 'AUTO_ROUND_ROBIN');
        setAssignedCount(assignResult?.assignedCount || 0);
        setSuccessMsg(
          `Batch created with ${taskList.length} task${taskList.length !== 1 ? 's' : ''}.` +
          (assignResult?.assignedCount
            ? ` ${assignResult.assignedCount} task${assignResult.assignedCount !== 1 ? 's' : ''} auto-assigned.`
            : ' No annotators found in project — use manual assignment below.')
        );
      } catch {
        // auto-assign may fail if no project team; that's OK
        setSuccessMsg(
          `Batch created with ${taskList.length} task${taskList.length !== 1 ? 's' : ''}. ` +
          'Auto-assignment skipped (add team members to the project first). ' +
          'Use "Assign to Me" below for a quick demo.'
        );
      }

      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create batch.');
    } finally {
      setLoading(false);
    }
  }, [projectId, batchName, files]);

  // ── Manual "assign to me" ──────────────────────────────────────────────────
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const handleManualAssign = async (taskId: string) => {
    if (!assignUserId.trim()) { alert('Enter a user ID to assign.'); return; }
    setAssigning(taskId);
    try {
      await batchService.assignTask(taskId, assignUserId.trim(), 'annotation');
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: 'ASSIGNED', assignedTo: assignUserId.trim() } : t)
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssigning(null);
    }
  };

  // ── Re-fetch task statuses ─────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const refreshTasks = async () => {
    if (!batchId) return;
    setRefreshing(true);
    try {
      const fresh = await batchService.getBatchTasks(batchId);
      setTasks((fresh || []).map((t: any) => ({
        id: t.id,
        fileUrl: t.fileUrl || t.file_url || '',
        fileName: t.fileName || t.file_name || '',
        fileType: t.fileType || t.file_type || '',
        status: t.status || 'QUEUED',
        assignedTo: t.assignedTo || t.assigned_to,
      })));
    } catch {
      /* silent */
    } finally {
      setRefreshing(false);
    }
  };

  // ── Derived flags ──────────────────────────────────────────────────────────
  const allAnnotated = tasks.length > 0 && tasks.every((t) =>
    ['SUBMITTED', 'APPROVED', 'REVIEW', 'IN_REVIEW', 'COMPLETED'].includes(t.status?.toUpperCase())
  );
  const anyInReview = tasks.some((t) =>
    ['REVIEW', 'IN_REVIEW', 'PENDING_REVIEW'].includes(t.status?.toUpperCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(projectId ? `/ops/projects/${projectId}` : '/ops/projects')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3"
          >
            <ChevronLeft size={16} /> Back to Project
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Demo Workflow</h1>
              <p className="text-sm text-gray-500">Full annotation cycle: upload → annotate → review</p>
            </div>
          </div>
        </div>

        <StepIndicator current={step} />

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button className="text-xs text-red-600 underline mt-0.5" onClick={() => setError(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{successMsg}</p>
          </div>
        )}

        {/* ══ STEP 1: Configure batch ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Configure Batch</h2>

            {/* Batch name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Batch Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter batch name..."
              />
            </div>

            {/* Files */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Media Files <span className="text-gray-400 font-normal">(one task per file)</span>
                </label>
                <button
                  onClick={loadSamples}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Load sample files
                </button>
              </div>

              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex gap-2 items-center">
                    <div className="w-24 flex-shrink-0">
                      <select
                        value={f.type}
                        onChange={(e) => updateFile(f.id, 'type', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                        <option value="TEXT">Text</option>
                        <option value="PDF">PDF</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="File URL (https://...)"
                      value={f.url}
                      onChange={(e) => updateFile(f.id, 'url', e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="File name"
                      value={f.name}
                      onChange={(e) => updateFile(f.id, 'name', e.target.value)}
                    />
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addFile}
                className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={15} /> Add file
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={loading || !batchName.trim() || files.filter((f) => f.url.trim()).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={18} /> Creating...</>
                ) : (
                  <>Create Batch &amp; Assign <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Tasks created & assignment ══════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Batch Created — {tasks.length} Task{tasks.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={refreshTasks}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Manual assignment */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                Manual Assignment <span className="font-normal text-blue-600">(use for demo)</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-blue-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Annotator User ID"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                />
                <button
                  onClick={() => tasks.forEach((t) => handleManualAssign(t.id))}
                  disabled={!assignUserId.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                >
                  Assign All
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-1.5">
                Or use individual "Assign" buttons below per task.
              </p>
            </div>

            {/* Task list */}
            <div className="space-y-2 mb-6">
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {FILE_ICONS[task.fileType as FileType] || <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.fileName || `Task ${i + 1}`}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{task.id}</p>
                  </div>
                  <StatusBadge status={task.status} />
                  {task.assignedTo ? (
                    <span className="text-xs text-green-700 bg-green-100 rounded px-2 py-0.5 whitespace-nowrap">
                      Assigned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleManualAssign(task.id)}
                      disabled={assigning === task.id || !assignUserId.trim()}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                    >
                      {assigning === task.id ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                    </button>
                  )}
                  <Link
                    to={`/annotate/task/${task.id}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    <PlayCircle size={12} /> Annotate
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep(1); setBatchId(null); setTasks([]); setError(null); setSuccessMsg(null); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
              >
                <ChevronLeft size={16} /> Start over
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm text-sm"
              >
                Track Annotation Progress <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Annotator tracks / opens tasks ══════════════════════════ */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Annotate Tasks</h2>
              <button
                onClick={refreshTasks}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Status
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Click <strong>Annotate</strong> to open each task in the annotation screen. Once all tasks are
              submitted, proceed to the review step.
            </p>

            <div className="space-y-2 mb-6">
              {tasks.map((task, i) => {
                const done = ['SUBMITTED', 'APPROVED', 'REVIEW', 'IN_REVIEW', 'COMPLETED'].includes(
                  task.status?.toUpperCase()
                );
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      done ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.fileName || `Task ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{task.id}</p>
                    </div>
                    <StatusBadge status={task.status} />
                    <Link
                      to={`/annotate/task/${task.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                        done
                          ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <PlayCircle size={12} /> {done ? 'View' : 'Annotate'}
                    </Link>
                  </div>
                );
              })}
            </div>

            {allAnnotated && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                <p className="text-sm font-semibold text-green-800">
                  All tasks submitted! Proceed to the review step.
                </p>
              </div>
            )}

            {anyInReview && !allAnnotated && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-800">
                  Some tasks are pending review. You can proceed to review even if not all annotations are complete.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-sm text-sm"
              >
                Proceed to Review <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Review tasks ═════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Review Tasks</h2>
              <button
                onClick={refreshTasks}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Status
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Open each submitted task in the review screen to compare annotations and make a decision.
            </p>

            <div className="space-y-2 mb-6">
              {tasks.map((task, i) => {
                const reviewed = ['APPROVED', 'REJECTED', 'COMPLETED'].includes(task.status?.toUpperCase());
                const canReview = ['SUBMITTED', 'REVIEW', 'IN_REVIEW', 'PENDING_REVIEW'].includes(
                  task.status?.toUpperCase()
                );
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      reviewed ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      reviewed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {reviewed ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.fileName || `Task ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{task.id}</p>
                    </div>
                    <StatusBadge status={task.status} />
                    <Link
                      to={`/review/task/${task.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                        reviewed
                          ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          : canReview
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                      }`}
                    >
                      <Eye size={12} /> {reviewed ? 'View' : canReview ? 'Review' : 'Not ready'}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Completion summary */}
            {tasks.every((t) => ['APPROVED', 'REJECTED', 'COMPLETED'].includes(t.status?.toUpperCase())) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4 text-center">
                <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
                <h3 className="text-base font-bold text-green-900 mb-1">Demo Cycle Complete!</h3>
                <p className="text-sm text-green-700">
                  All tasks have been annotated and reviewed. Full workflow demonstrated.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <div className="flex gap-3">
                <Link
                  to={batchId ? `/ops/batches/${batchId}` : '/ops/batches'}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  View Batch Details <ArrowRight size={15} />
                </Link>
                <button
                  onClick={() => {
                    setStep(1);
                    setBatchId(null);
                    setTasks([]);
                    setAssignedCount(0);
                    setError(null);
                    setSuccessMsg(null);
                    setBatchName(
                      `Demo Batch – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  New Demo Run
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Helper info box */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">Demo Tips</p>
          <ul className="text-xs text-amber-700 space-y-0.5 list-disc pl-4">
            <li>Annotation and review pages open in a new tab — return here to track progress.</li>
            <li>If auto-assign finds no annotators, add team members to the project first, or use manual assignment.</li>
            <li>The workflow engine automatically moves a task to review after annotation is submitted.</li>
            <li>Use "Refresh Status" to see updated task statuses.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SUBMITTED: 'bg-purple-100 text-purple-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  PENDING_REVIEW: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
    STATUS_COLORS[status?.toUpperCase()] || 'bg-gray-100 text-gray-500'
  }`}>
    {status || 'QUEUED'}
  </span>
);

export default DemoWorkflow;
