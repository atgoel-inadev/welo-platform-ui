import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Loader2, Rocket, Save, Play, Info } from 'lucide-react';
import { Plugin, PluginCreateDto, PluginResult, pluginService } from '../../services/pluginService';
import { Button } from '../common';

const STARTER_SCRIPT = `/**
 * Plugin validator
 * @param {object} question  - { id, text, type }
 * @param {object} answer    - { value: any }
 * @param {object} context   - { taskId, projectId }
 * @returns {{ result: 'PASS'|'WARN'|'FAIL', message?: string }}
 */
function validate(question, answer, context) {
  if (answer.value === null || answer.value === undefined || answer.value === '') {
    return { result: 'FAIL', message: 'Answer cannot be empty.' };
  }
  return { result: 'PASS' };
}`;

interface TestResult {
  result: PluginResult;
  message?: string;
  executionTimeMs: number;
  requestSent?: object;
  rawResponse?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (plugin: Plugin) => void;
  onDeployed: (plugin: Plugin) => void;
  projectId: string;
  existing?: Plugin | null;
  questions: Array<{ id: string; question: string }>;
}

type Tab = 'setup' | 'logic' | 'test';

export const PluginEditorModal = ({ isOpen, onClose, onSaved, onDeployed, projectId, existing, questions }: Props) => {
  const [tab, setTab] = useState<Tab>('setup');
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [canDeploy, setCanDeploy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Track the saved plugin reference (updated after save so test works immediately)
  const [savedPlugin, setSavedPlugin] = useState<Plugin | null>(existing ?? null);
  const currentPlugin = savedPlugin ?? existing ?? null;
  const isEdit = !!currentPlugin;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'API' | 'SCRIPT'>('API');
  const [trigger] = useState<'ON_BLUR'>('ON_BLUR');
  const [onFailBehavior, setOnFailBehavior] = useState<string>('ADVISORY');
  const [bindAll, setBindAll] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // API config
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH'>('POST');
  const [apiHeaders, setApiHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [apiPayload, setApiPayload] = useState('{\n  "question": "{{question.text}}",\n  "answer": "{{answer.value}}"\n}');
  const [resultPath, setResultPath] = useState('result');
  const [messagePath, setMessagePath] = useState('message');
  const [timeout, setTimeout2] = useState(5000);
  const [retries, setRetries] = useState(0);

  // Script config
  const [scriptCode, setScriptCode] = useState(STARTER_SCRIPT);

  // Test inputs
  const [testQuestionId, setTestQuestionId] = useState('');
  const [testAnswer, setTestAnswer] = useState('');

  // ── Reset all form state when modal opens or existing plugin changes ──
  useEffect(() => {
    if (!isOpen) return;
    const p = existing;
    setTab('setup');
    setError(null);
    setSuccessMsg(null);
    setTestResult(null);
    setCanDeploy(false);
    setSavedPlugin(existing ?? null);
    setSaving(false);
    setDeploying(false);
    setTesting(false);

    setName(p?.name ?? '');
    setDescription(p?.description ?? '');
    setType(p?.type ?? 'API');
    setOnFailBehavior(p?.onFailBehavior ?? 'ADVISORY');
    setBindAll((p?.questionBindings ?? []).length === 0);
    setSelectedQuestions(p?.questionBindings ?? []);

    setApiUrl(p?.apiConfig?.url ?? '');
    setApiMethod(p?.apiConfig?.method ?? 'POST');
    setApiHeaders(
      Object.entries(p?.apiConfig?.headers ?? {}).map(([key, value]) => ({ key, value })),
    );
    setApiPayload(p?.apiConfig?.payload ?? '{\n  "question": "{{question.text}}",\n  "answer": "{{answer.value}}"\n}');
    setResultPath(p?.apiConfig?.responseMapping?.resultPath ?? 'result');
    setMessagePath(p?.apiConfig?.responseMapping?.messagePath ?? 'message');
    setTimeout2(p?.apiConfig?.timeout ?? 5000);
    setRetries(p?.apiConfig?.retries ?? 0);

    setScriptCode(p?.scriptCode ?? STARTER_SCRIPT);

    setTestQuestionId(questions[0]?.id ?? '');
    setTestAnswer('');
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const buildDto = (): PluginCreateDto => ({
    name,
    description: description || undefined,
    type,
    trigger,
    onFailBehavior: onFailBehavior as any,
    questionBindings: bindAll ? [] : selectedQuestions,
    ...(type === 'API'
      ? {
          apiConfig: {
            url: apiUrl,
            method: apiMethod,
            headers: Object.fromEntries(apiHeaders.filter((h) => h.key).map((h) => [h.key, h.value])),
            payload: apiPayload || undefined,
            responseMapping: { resultPath, messagePath: messagePath || undefined },
            timeout,
            retries,
          },
        }
      : { scriptCode }),
  });

  /** Save draft and return the saved plugin (or null on error). Does NOT close modal. */
  const handleSaveDraft = async (): Promise<Plugin | null> => {
    setSaving(true);
    setError(null);
    try {
      const dto = buildDto();
      const plugin = isEdit
        ? await pluginService.updatePlugin(projectId, currentPlugin!.id, dto)
        : await pluginService.createPlugin(projectId, dto);
      setSavedPlugin(plugin);
      onSaved(plugin);
      setSuccessMsg('Plugin saved');
      window.setTimeout(() => setSuccessMsg(null), 3000);
      return plugin;
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      return null;
    } finally {
      setSaving(false);
    }
  };

  /** Save & stay – used by footer Save button */
  const handleSaveAndStay = async () => {
    await handleSaveDraft();
  };

  const handleDeploy = async () => {
    setError(null);
    // Auto-save before deploy
    let p = currentPlugin;
    if (!p) {
      p = await handleSaveDraft();
      if (!p) return;
    } else {
      // save latest changes first
      p = await handleSaveDraft();
      if (!p) return;
    }
    setDeploying(true);
    try {
      const deployed = await pluginService.deployPlugin(projectId, p.id);
      setSavedPlugin(deployed);
      onDeployed(deployed);
      setSuccessMsg('Plugin deployed successfully!');
      window.setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setTesting(true);
    setTestResult(null);

    const selectedQ = questions.find((q) => q.id === testQuestionId) ?? questions[0];
    const dto = buildDto();
    try {
      // Inline test — sends the plugin config directly, nothing is saved
      const result = await pluginService.testPluginInline({
        projectId,
        questionId: selectedQ?.id ?? 'q-test',
        questionText: selectedQ?.question ?? 'Test Question',
        questionType: 'TEXT',
        answerValue: testAnswer,
        plugin: {
          type: dto.type,
          onFailBehavior: dto.onFailBehavior,
          apiConfig: dto.apiConfig,
          scriptCode: dto.scriptCode,
        },
      });
      setTestResult(result as TestResult);
      if (result.result === 'PASS' || result.result === 'WARN') {
        setCanDeploy(true);
      }
    } catch (err: any) {
      setTestResult({ result: 'ERROR', message: err.message, executionTimeMs: 0 });
    } finally {
      setTesting(false);
    }
  };

  const addHeader = () => setApiHeaders([...apiHeaders, { key: '', value: '' }]);
  const removeHeader = (i: number) => setApiHeaders(apiHeaders.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setApiHeaders(apiHeaders.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)));

  const resultColors: Record<string, string> = {
    PASS: 'text-green-600 bg-green-50 border-green-200',
    WARN: 'text-amber-600 bg-amber-50 border-amber-200',
    FAIL: 'text-red-600 bg-red-50 border-red-200',
    ERROR: 'text-red-700 bg-red-50 border-red-300',
    TIMEOUT: 'text-gray-600 bg-gray-50 border-gray-300',
  };

  const ResultIcon = ({ r }: { r: PluginResult }) =>
    r === 'PASS' ? <CheckCircle size={16} /> :
    r === 'WARN' ? <AlertTriangle size={16} /> :
    <XCircle size={16} />;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  const varChips = [
    '{{question.text}}', '{{question.id}}', '{{answer.value}}',
    '{{context.taskId}}', '{{context.projectId}}',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-8 pb-20">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEdit ? `Edit Plugin: ${currentPlugin!.name}` : 'Create New Plugin'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure validation logic that fires when annotators leave a question field.
                {currentPlugin && (
                  <span className="ml-2 text-xs text-gray-400">
                    v{currentPlugin.version ?? 1} · {currentPlugin.isDraft ? 'draft' : 'deployed'}
                  </span>
                )}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={22} />
            </button>
          </div>

          {/* Inline notifications */}
          {error && (
            <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <XCircle size={16} className="flex-shrink-0" />
              {error}
              <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}
          {successMsg && (
            <div className="mx-6 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b px-6">
            <button className={tabClass('setup')} onClick={() => setTab('setup')}>1. Basic Setup</button>
            <button className={tabClass('logic')} onClick={() => setTab('logic')}>2. Logic</button>
            <button className={tabClass('test')} onClick={() => setTab('test')}>3. Test & Deploy</button>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-5 min-h-[400px]">

            {/* ── Tab 1: Basic Setup ── */}
            {tab === 'setup' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plugin Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Sentiment Validator"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="What does this plugin validate?"
                    />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plugin Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['API', 'SCRIPT'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${type === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="font-semibold text-sm text-gray-900">
                          {t === 'API' ? '🌐 API Call' : '🔧 JavaScript Script'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t === 'API'
                            ? 'Call an external HTTP endpoint with the answer value'
                            : 'Write custom validation logic in sandboxed JS'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fail behavior */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">On Fail Behavior</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ['HARD_BLOCK', 'Hard Block', 'Clears the answer and forces re-entry. Annotator cannot proceed.'],
                      ['SOFT_WARN', 'Soft Override', 'Shows warning with required override reason before submitting.'],
                      ['ADVISORY', 'Advisory', 'Informational only — annotator can submit regardless.'],
                    ] as const).map(([val, label, desc]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOnFailBehavior(val)}
                        className={`p-3 border-2 rounded-xl text-left transition-colors ${onFailBehavior === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="font-semibold text-xs text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500 mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question binding */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Binding</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bindAll}
                      onChange={(e) => setBindAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    Apply to all questions
                  </label>
                  {!bindAll && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                      {questions.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3">No annotation questions configured for this project.</p>
                      ) : (
                        questions.map((q) => (
                          <label key={q.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(q.id)}
                              onChange={(e) =>
                                setSelectedQuestions(
                                  e.target.checked
                                    ? [...selectedQuestions, q.id]
                                    : selectedQuestions.filter((id) => id !== q.id),
                                )
                              }
                              className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="truncate">{q.question}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  {!bindAll && selectedQuestions.length === 0 && questions.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">Select at least one question, or check "Apply to all" above.</p>
                  )}
                  {!bindAll && selectedQuestions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{selectedQuestions.length} of {questions.length} question(s) selected</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab 2: Logic ── */}
            {tab === 'logic' && (
              <div className="space-y-4">
                {/* Variable chip toolbar */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Insert variable:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {varChips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          if (type === 'API') setApiUrl(apiUrl + chip);
                          else setScriptCode(scriptCode + '\n// ' + chip);
                        }}
                        className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                    <span className="text-xs text-gray-400 self-center ml-1">
                      Use <span className="font-mono">{'{{secrets.NAME}}'}</span> for encrypted secrets
                    </span>
                  </div>
                </div>

                {type === 'API' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
                        <select
                          value={apiMethod}
                          onChange={(e) => setApiMethod(e.target.value as any)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {['GET', 'POST', 'PUT', 'PATCH'].map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
                        <input
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder="https://api.example.com/validate"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Headers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Headers</label>
                        <button onClick={addHeader} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                          <Plus size={12} /> Add Header
                        </button>
                      </div>
                      <div className="space-y-2">
                        {apiHeaders.map((h, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={h.key}
                              onChange={(e) => updateHeader(i, 'key', e.target.value)}
                              placeholder="Header-Name"
                              className="w-1/3 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <input
                              value={h.value}
                              onChange={(e) => updateHeader(i, 'value', e.target.value)}
                              placeholder="Value or {{secrets.KEY}}"
                              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button onClick={() => removeHeader(i)} className="text-gray-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payload */}
                    {apiMethod !== 'GET' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Request Payload (JSON template)</label>
                        <textarea
                          value={apiPayload}
                          onChange={(e) => setApiPayload(e.target.value)}
                          rows={5}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder='{"question": "{{question.text}}", "answer": "{{answer.value}}"}'
                        />
                      </div>
                    )}

                    {/* Response mapping */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Result field path * <span className="text-gray-400 font-normal">(dot-notation)</span>
                        </label>
                        <input
                          value={resultPath}
                          onChange={(e) => setResultPath(e.target.value)}
                          placeholder="data.verdict"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Path to PASS / WARN / FAIL in the response JSON</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Message field path <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          value={messagePath}
                          onChange={(e) => setMessagePath(e.target.value)}
                          placeholder="data.message"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Timeout + Retries */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Timeout: {timeout}ms
                        </label>
                        <input
                          type="range"
                          min="1000"
                          max="15000"
                          step="500"
                          value={timeout}
                          onChange={(e) => setTimeout2(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>1s</span><span>15s</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Retries</label>
                        <select
                          value={retries}
                          onChange={(e) => setRetries(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Script editor */
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      JavaScript (must export a <code className="bg-gray-100 px-1 rounded">validate(question, answer, context)</code> function)
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <Editor
                        height="320px"
                        language="javascript"
                        value={scriptCode}
                        onChange={(v) => setScriptCode(v ?? '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                        }}
                        theme="light"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Runs in a sandboxed Node.js VM with 3s timeout. Available globals: Math, JSON, Date, String, Number, Array, Object, RegExp. No network access.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 3: Test & Deploy ── */}
            {tab === 'test' && (
              <div className="space-y-5">
                {/* Info panel */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>How testing works:</strong> Your plugin is executed server-side with the mock input below — nothing is saved until you click Save.
                    {type === 'SCRIPT'
                      ? ' Scripts run in a sandboxed VM with a 3-second timeout.'
                      : ' API plugins make a real HTTP call to the configured endpoint.'}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Mock Input</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                      <select
                        value={testQuestionId}
                        onChange={(e) => setTestQuestionId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {questions.length === 0 && <option value="">No questions configured</option>}
                        {questions.map((q) => (
                          <option key={q.id} value={q.id}>{q.question}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Answer Value</label>
                      <input
                        value={testAnswer}
                        onChange={(e) => setTestAnswer(e.target.value)}
                        placeholder="Enter a test answer..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleTest}
                  variant="primary"
                  disabled={testing || !name.trim()}
                  icon={testing ? undefined : Play}
                >
                  {testing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Running Test...
                    </span>
                  ) : 'Run Test'}
                </Button>

                {testResult && (
                  <div className={`border rounded-xl p-4 ${resultColors[testResult.result] ?? 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <ResultIcon r={testResult.result} />
                      {testResult.result}
                      <span className="text-xs font-normal ml-auto">{testResult.executionTimeMs}ms</span>
                    </div>
                    {testResult.message && (
                      <p className="text-sm">{testResult.message}</p>
                    )}
                  </div>
                )}

                {/* Deploy */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Deploy Plugin</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {canDeploy
                          ? 'At least one successful test run — ready to deploy.'
                          : 'Run a test that returns PASS or WARN to unlock deployment.'}
                      </p>
                    </div>
                    <Button
                      onClick={handleDeploy}
                      variant="primary"
                      disabled={!canDeploy || deploying}
                      icon={Rocket}
                    >
                      {deploying ? 'Deploying...' : `Deploy v${((currentPlugin?.version ?? 0) + 1)}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-xl">
            <div className="flex items-center gap-2">
              {tab !== 'setup' && (
                <button
                  onClick={() => setTab(tab === 'logic' ? 'setup' : 'logic')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="ghost">Cancel</Button>
              {tab !== 'test' && (
                <Button
                  onClick={() => setTab(tab === 'setup' ? 'logic' : 'test')}
                  variant="secondary"
                  icon={ChevronRight}
                >
                  Next
                </Button>
              )}
              <Button onClick={handleSaveAndStay} variant="primary" disabled={saving} icon={Save}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save as Draft'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
