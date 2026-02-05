import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { batchService, FileAllocationDto } from '../../services/batchService';
import { projectService } from '../../services/projectService';
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
  
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'uploading' | 'success' | 'error'>('select');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await projectService.fetchProjects({ status: 'ACTIVE' });
      setProjects(response.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      setErrorMessage('Failed to load projects: ' + error.message);
    } finally {
      setProjectsLoading(false);
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

            <button
              onClick={handleManualAdd}
              className="w-full py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <span className="font-medium">Add Files Manually</span>
            </button>
          </div>

          {/* Sample CSV Format */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Sample CSV Format:</h4>
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`file_name,file_type,file_url,external_id
cat1.jpg,IMAGE,http://localhost:5173/uploads/cat1.jpg,img_001
dog1.jpg,IMAGE,http://localhost:5173/uploads/dog1.jpg,img_002
data.csv,CSV,http://localhost:5173/uploads/data.csv,csv_001`}
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              <strong>Supported file types:</strong> IMAGE, VIDEO, AUDIO, TEXT, CSV, PDF, JSON
            </p>
          </div>
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
                      {project.name}
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
            <button
              onClick={handleSubmit}
              disabled={parsedFiles.length === 0 || !projectId || !batchName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Batch & Upload Files
            </button>
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
