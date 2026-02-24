import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import Papa from 'papaparse';
import { batchService, FileAllocationDto } from '../../services/batchService';
import { projectService } from '../../services/projectService';
import { userService, ProjectTeamMember } from '../../services/userService';
import { Project } from '../../types';
import { QuickUserCreate } from '../../components/common/QuickUserCreate';

interface CSVRow {
  file_name: string;
  file_type: string;
  file_url: string;
  external_id?: string;
}

interface ParsedFile extends FileAllocationDto {
  status: 'pending' | 'valid' | 'error';
  errorMessage?: string;
}

export const BatchUpload = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  const [projectId, setProjectId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [autoAssign, setAutoAssign] = useState(true);
  const [assignmentMethod, setAssignmentMethod] = useState<'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED'>('AUTO_ROUND_ROBIN');
  
  // Upload mode: 'upload' (manual files) or 'scan' (directory scan for demo)
  const [uploadMode, setUploadMode] = useState<'upload' | 'scan'>('scan');
  
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'uploading' | 'success' | 'error'>('select');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load team members when project is selected
  useEffect(() => {
    if (projectId) {
      loadTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [projectId]);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      // Fetch all projects (user can see all statuses, not just active)
      const response = await projectService.fetchProjects({ limit: 1000 });
      setProjects(response.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      setErrorMessage('Failed to load projects: ' + error.message);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!projectId) return;
    
    setTeamLoading(true);
    try {
      const members = await userService.getProjectTeam(projectId);
      setTeamMembers(members);
    } catch (error: any) {
      console.error('Failed to load team members:', error);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please upload a CSV file');
      return;
    }

    setCSVFile(file);
    parseCSV(file);
  };

  const handleBrowseFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: ParsedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Copy file to public/uploads directory for demo
      const copiedUrl = await copyFileToUploads(file);
      
      // Detect file type from extension
      const fileType = detectFileType(file.name);
      
      newFiles.push({
        externalId: `file_${parsedFiles.length + i + 1}`,
        fileUrl: copiedUrl,
        fileType,
        fileName: file.name,
        fileSize: file.size,
        status: 'valid',
      });
    }

    setParsedFiles([...parsedFiles, ...newFiles]);
    setUploadStep('preview');
  };

  const copyFileToUploads = async (file: File): Promise<string> => {
    try {
      // For demo: save to public/uploads and return the API URL
      // In production, this would be a proper upload endpoint
      
      // Create FormData to simulate file copy
      const formData = new FormData();
      formData.append('file', file);
      
      // For demo, we'll use the file name and construct the URL
      // The file should be manually placed in public/uploads or use a file input workaround
      const backendUrl = `${import.meta.env.VITE_PROJECT_MANAGEMENT_URL}/media/${file.name}`;
      
      // Store file in browser's temporary storage (for demo simulation)
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          // For demo, construct the URL that backend will serve
          resolve(backendUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error copying file:', error);
      return `${import.meta.env.VITE_PROJECT_MANAGEMENT_URL}/media/${file.name}`;
    }
  };

  const detectFileType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'jpg': 'IMAGE',
      'jpeg': 'IMAGE',
      'png': 'IMAGE',
      'gif': 'IMAGE',
      'webp': 'IMAGE',
      'mp4': 'VIDEO',
      'webm': 'VIDEO',
      'avi': 'VIDEO',
      'mp3': 'AUDIO',
      'wav': 'AUDIO',
      'txt': 'TEXT',
      'csv': 'CSV',
      'pdf': 'PDF',
      'json': 'JSON',
    };
    return typeMap[ext || ''] || 'TEXT';
  };

  const parseCSV = (file: File) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const files: ParsedFile[] = results.data.map((row, index) => {
          // Validate row
          const errors: string[] = [];
          
          if (!row.file_name) errors.push('Missing file_name');
          if (!row.file_type) errors.push('Missing file_type');
          if (!row.file_url) errors.push('Missing file_url');

          const validFileTypes = ['IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'CSV', 'PDF', 'JSON'];
          if (row.file_type && !validFileTypes.includes(row.file_type.toUpperCase())) {
            errors.push(`Invalid file_type: ${row.file_type}`);
          }

          return {
            externalId: row.external_id || `file_${index + 1}`,
            fileUrl: row.file_url,
            fileType: row.file_type?.toUpperCase() || 'TEXT',
            fileName: row.file_name,
            fileSize: 0, // Unknown from CSV
            status: errors.length === 0 ? 'valid' : 'error',
            errorMessage: errors.length > 0 ? errors.join(', ') : undefined,
          };
        });

        setParsedFiles(files);
        setUploadStep('preview');
      },
      error: (error) => {
        setErrorMessage(`Failed to parse CSV: ${error.message}`);
        setUploadStep('error');
      },
    });
  };

  const handleManualAdd = () => {
    const newFile: ParsedFile = {
      externalId: `file_${parsedFiles.length + 1}`,
      fileUrl: '',
      fileType: 'IMAGE',
      fileName: '',
      fileSize: 0,
      status: 'pending',
    };
    setParsedFiles([...parsedFiles, newFile]);
    setUploadStep('preview');
  };

  const updateFile = (index: number, field: keyof FileAllocationDto, value: any) => {
    const updated = [...parsedFiles];
    updated[index] = { ...updated[index], [field]: value, status: 'pending' };
    setParsedFiles(updated);
  };

  const removeFile = (index: number) => {
    setParsedFiles(parsedFiles.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!projectId) {
      setErrorMessage('Please select a project');
      return false;
    }
    if (!batchName.trim()) {
      setErrorMessage('Please enter a batch name');
      return false;
    }
    if (parsedFiles.length === 0) {
      setErrorMessage('Please add at least one file');
      return false;
    }
    
    const validFiles = parsedFiles.filter(f => f.status !== 'error');
    if (validFiles.length === 0) {
      setErrorMessage('All files have errors. Please fix them before uploading.');
      return false;
    }

    if (autoAssign && teamMembers.length === 0) {
      setErrorMessage('No team members assigned to this project. Disable auto-assign or assign team members first.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploadStep('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Step 1: Create batch (20% progress)
      setUploadProgress(20);
      const batch = await batchService.createBatch({
        projectId,
        name: batchName,
        description: batchDescription,
        priority,
      });

      setCreatedBatchId(batch.id);

      // Step 2: Allocate files (80% progress)
      setUploadProgress(50);
      const validFiles = parsedFiles.filter(f => f.status !== 'error');
      
      await batchService.allocateFiles(batch.id, {
        files: validFiles.map(f => ({
          externalId: f.externalId,
          fileUrl: f.fileUrl,
          fileType: f.fileType,
          fileName: f.fileName,
          fileSize: f.fileSize,
        })),
        autoAssign,
        assignmentMethod,
        taskType: 'ANNOTATION',
        priority,
      });

      setUploadProgress(100);
      setUploadStep('success');

      // Navigate to batch details after 2 seconds
      setTimeout(() => {
        navigate(`/ops/batches/${batch.id}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'Failed to create batch');
      setUploadStep('error');
    }
  };

  /**
   * TACTICAL DEMO MODE: Scan directory and create tasks
   */
  const handleScanDirectory = async () => {
    if (!projectId) {
      setErrorMessage('Please select a project first');
      return;
    }
    if (!batchName.trim()) {
      setErrorMessage('Please enter a batch name');
      return;
    }

    if (autoAssign && teamMembers.length === 0) {
      setErrorMessage('No team members assigned. Disable auto-assign or assign team members first.');
      return;
    }

    setUploadStep('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Step 1: Create batch
      setUploadProgress(20);
      const batch = await batchService.createBatch({
        projectId,
        name: batchName,
        description: batchDescription,
        priority,
      });

      setCreatedBatchId(batch.id);

      // Step 2: Scan directory and create tasks
      setUploadProgress(40);
      const scanResult = await batchService.scanDirectory(batch.id, {
        autoAssign,
        assignmentMethod,
        taskType: 'ANNOTATION',
      });

      setUploadProgress(100);

      if (scanResult.errors.length > 0) {
        console.warn('Some files had errors:', scanResult.errors);
      }

      setUploadStep('success');

      // Navigate to batch details after 2 seconds
      setTimeout(() => {
        navigate(`/ops/batches/${batch.id}`);
      }, 2000);

    } catch (error: any) {
      console.error('Directory scan failed:', error);
      setErrorMessage(error.message || 'Failed to scan directory');
      setUploadStep('error');
    }
  }

  const handleReset = () => {
    setUploadStep('select');
    setParsedFiles([]);
    setCSVFile(null);
    setBatchName('');
    setBatchDescription('');
    setErrorMessage('');
    setCreatedBatchId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload Batch</h1>
        <p className="mt-2 text-gray-600">
          Upload files to create annotation tasks for your project
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${uploadStep === 'select' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              uploadStep !== 'select' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              {uploadStep !== 'select' ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 font-medium">Select Files</span>
          </div>
          
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all" 
              style={{ width: uploadStep === 'select' ? '0%' : '50%' }}
            />
          </div>

          <div className={`flex items-center ${uploadStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['uploading', 'success', 'error'].includes(uploadStep) ? 'bg-green-500 text-white' : 
              uploadStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {['uploading', 'success', 'error'].includes(uploadStep) ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Configure & Preview</span>
          </div>

          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all" 
              style={{ width: ['uploading', 'success', 'error'].includes(uploadStep) ? '50%' : '0%' }}
            />
          </div>

          <div className={`flex items-center ${['uploading', 'success', 'error'].includes(uploadStep) ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              uploadStep === 'success' ? 'bg-green-500 text-white' : 
              uploadStep === 'error' ? 'bg-red-500 text-white' :
              uploadStep === 'uploading' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {uploadStep === 'success' ? <CheckCircle className="w-5 h-5" /> : 
               uploadStep === 'error' ? <AlertCircle className="w-5 h-5" /> :
               uploadStep === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : '3'}
            </div>
            <span className="ml-2 font-medium">Upload</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Step 1: File Selection */}
      {uploadStep === 'select' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Select Files to Upload</h2>
          
          {/* Mode Toggle */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-blue-900">Upload Mode:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUploadMode('scan')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadMode === 'scan'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  📁 Scan Directory (DEMO)
                </button>
                <button
                  onClick={() => setUploadMode('upload')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  ⬆️ Upload Files
                </button>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              {uploadMode === 'scan' 
                ? '📋 Directory Scan: Place files in public/uploads/{projectId}/{batchName}/ and click scan to auto-create tasks'
                : '📤 Upload Files: Select files from your computer or provide a CSV with file references'}
            </p>
          </div>
          
          {/* DEMO MODE: Directory Scan */}
          {uploadMode === 'scan' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-green-300 rounded-lg p-8 bg-green-50">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-bold text-green-800 mb-2">Directory Scan Mode (DEMO)</h3>
                  <p className="text-gray-700 mb-4">
                    This mode automatically scans a local directory and creates tasks for all files found.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold text-gray-800 mb-2">📝 Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      <li>Select a project below</li>
                      <li>Enter a batch name (e.g., "batch_001")</li>
                      <li>Place your files in: <code className="bg-gray-100 px-2 py-1 rounded">public/uploads/{'{'} projectId{'}'}/{'{'} batchName{'}'}/</code></li>
                      <li>Click "Continue to Configuration" below</li>
                      <li>Click "Scan Directory & Create Tasks"</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                    <strong>Note:</strong> Files must be in: <code className="bg-white px-2 py-1 rounded">welo-platform-ui/public/uploads/{'{'} projectId{'}'}/{'{'} batchName{'}'}/</code>
                  </div>
                </div>
              </div>

              {/* Quick Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g., batch_001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Files should be in: public/uploads/{projectId || '{projectId}'}/{batchName || '{batchName}'}/
                  </p>
                </div>
              </div>

              {/* Auto-Assignment Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">Auto-assign tasks</label>
                  <p className="text-sm text-gray-600">Automatically assign tasks to annotators</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoAssign && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Method
                  </label>
                  <select
                    value={assignmentMethod}
                    onChange={(e) => setAssignmentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AUTO_ROUND_ROBIN">Round Robin (Even Distribution)</option>
                    <option value="AUTO_WORKLOAD_BASED">Workload Based (Assign to least busy)</option>
                    <option value="AUTO_SKILL_BASED">Skill Based (Match skills)</option>
                  </select>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setUploadStep('preview')}
                  disabled={!projectId || !batchName.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Continue to Configuration →
                </button>
              </div>
            </div>
          )}
          
          {/* UPLOAD MODE: Manual Files */}
          {uploadMode === 'upload' && (
            <div className="space-y-4">
              {/* CSV Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-4">
                CSV should contain columns: file_name, file_type, file_url, external_id (optional)
              </p>
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
                  Choose CSV File
                </span>
              </label>
              {csvFile && (
                <p className="mt-4 text-sm text-gray-600">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>

            {/* Or Manual Entry */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Browse Local Files */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Browse Local Files</h3>
              <p className="text-gray-600 mb-4">
                Select files from your computer (for demo purposes)
              </p>
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleBrowseFiles}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.txt,.csv,.json"
                />
                <span className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-block">
                  Choose Files
                </span>
              </label>
            </div>

            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              onClick={handleManualAdd}
              className="w-full py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">Add Files Manually</span>
            </button>

            {/* Sample CSV Format */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Sample CSV Format:</h4>
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`file_name,file_type,file_url,external_id
sample_image1.jpg,IMAGE,http://localhost:3004/api/v1/media/sample_image1.jpg,img_001
sample_image2.jpg,IMAGE,http://localhost:3004/api/v1/media/sample_image2.jpg,img_002
sample_text1.txt,TEXT,http://localhost:3004/api/v1/media/sample_text1.txt,txt_001`}
              </pre>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Supported file types:</strong> IMAGE, VIDEO, AUDIO, TEXT, CSV, PDF, JSON
              </p>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Quick Test:</strong> Download and use{' '}
                <a 
                  href="/uploads/demo-batch.csv" 
                  download 
                  className="underline hover:text-blue-800"
                >
                  demo-batch.csv
                </a>
                {' '}with pre-configured sample files
              </p>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Step 2: Configure & Preview */}
      {uploadStep === 'preview' && (
        <div className="space-y-6">
          {/* Batch Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Batch Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={projectsLoading}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Batch 001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Auto-Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoAssign}
                      onChange={(e) => setAutoAssign(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto-assign tasks</span>
                  </label>
                  
                  {autoAssign && (
                    <select
                      value={assignmentMethod}
                      onChange={(e) => setAssignmentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AUTO_ROUND_ROBIN">Round Robin</option>
                      <option value="AUTO_WORKLOAD_BASED">Workload Based</option>
                      <option value="AUTO_SKILL_BASED">Skill Based</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                rows={3}
                placeholder="Add any notes about this batch..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Files Preview */}
          {uploadMode === 'upload' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Files Preview ({parsedFiles.length} files)
                </h2>
                <button
                  onClick={handleManualAdd}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  + Add File
                </button>
              </div>

              {parsedFiles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No files added yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      file.status === 'error' ? 'bg-red-50 border-red-300' :
                      file.status === 'valid' ? 'bg-green-50 border-green-300' :
                      'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={file.fileName}
                          onChange={(e) => updateFile(index, 'fileName', e.target.value)}
                          placeholder="File name"
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <select
                          value={file.fileType}
                          onChange={(e) => updateFile(index, 'fileType', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="IMAGE">IMAGE</option>
                          <option value="VIDEO">VIDEO</option>
                          <option value="AUDIO">AUDIO</option>
                          <option value="TEXT">TEXT</option>
                          <option value="CSV">CSV</option>
                          <option value="PDF">PDF</option>
                          <option value="JSON">JSON</option>
                        </select>
                        <input
                          type="text"
                          value={file.fileUrl}
                          onChange={(e) => updateFile(index, 'fileUrl', e.target.value)}
                          placeholder="File URL"
                          className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                    {file.errorMessage && (
                      <p className="mt-2 text-xs text-red-600">{file.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Directory Scan Mode: Confirmation */}
          {uploadMode === 'scan' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold">Directory Scan Confirmation</h2>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">📁 Ready to scan:</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">Directory path:</span>
                    <code className="bg-white px-3 py-1 rounded border border-green-300">
                      public/uploads/{projectId}/{batchName}/
                    </code>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">Auto-assign:</span>
                    <span className={autoAssign ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {autoAssign ? `✅ Yes (${assignmentMethod})` : '❌ No (Manual assignment)'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>💡 What happens next:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Backend will scan the directory for all files</li>
                  <li>Tasks will be auto-created for each file found</li>
                  <li>File URLs will point to: <code>http://localhost:3004/api/v1/media/...</code></li>
                  {autoAssign && <li>Tasks will be automatically assigned to team members</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Project Team Members */}
          {projectId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold">Project Team</h3>
                </div>
                {teamLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              
              {teamMembers.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                  <p className="text-gray-600 mb-2">No team members assigned to this project</p>
                  <p className="text-sm text-gray-500">
                    Please assign annotators or reviewers to the project before uploading batches with auto-assignment.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''} available for task assignment:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {member.user?.name ? member.user.name.charAt(0).toUpperCase() : (member.user?.email ? member.user.email.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user?.name || member.user?.email || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.role} • Quota: {member.quota || 'Unlimited'}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-xs text-green-600 font-medium">
                            {member.completedTasks}/{member.assignedTasks}
                          </p>
                          <p className="text-xs text-gray-400">tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick User Creation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-2">Need to add users?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quickly create annotators or reviewers if they don't exist yet.
            </p>
            <QuickUserCreate
              inline={true}
              onUserCreated={(userId, email) => {
                console.log('User created:', userId, email);
                // Reload team members after user creation
                if (projectId) {
                  loadTeamMembers();
                }
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            
            {uploadMode === 'upload' ? (
              <button
                onClick={handleSubmit}
                disabled={parsedFiles.length === 0 || !projectId || !batchName.trim() || (autoAssign && teamMembers.length === 0)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={parsedFiles.length === 0 ? 'Add files first' : !projectId ? 'Select a project' : !batchName.trim() ? 'Enter batch name' : (autoAssign && teamMembers.length === 0) ? 'Assign team members or disable auto-assign' : 'Create batch'}
              >
                ⬆️ Create Batch & Upload Files
              </button>
            ) : (
              <button
                onClick={handleScanDirectory}
                disabled={!projectId || !batchName.trim() || (autoAssign && teamMembers.length === 0)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!projectId ? 'Select a project' : !batchName.trim() ? 'Enter batch name' : (autoAssign && teamMembers.length === 0) ? 'Assign team members or disable auto-assign' : 'Scan directory and create tasks'}
              >
                📁 Scan Directory & Create Tasks
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Uploading */}
      {uploadStep === 'uploading' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Creating Batch...</h2>
          <p className="text-gray-600 mb-6">
            Please wait while we create tasks and assign them to annotators
          </p>
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {uploadStep === 'success' && (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Batch Created Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            {parsedFiles.filter(f => f.status !== 'error').length} tasks created and assigned
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/ops/batches/${createdBatchId}`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Batch Details
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Upload Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
