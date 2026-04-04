import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Upload, CheckCircle, XCircle, FileArchive, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function FileUploadManager() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{
    trial: File | null;
    standard: File | null;
    enterprise: File | null;
  }>({
    trial: null,
    standard: null,
    enterprise: null
  });
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (type: 'trial' | 'standard' | 'enterprise', file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a .zip file');
      return;
    }
    setFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`Selected: ${file.name}`);
  };

  const uploadFile = async (type: 'trial' | 'standard' | 'enterprise', file: File) => {
    const fileNameMap = {
      trial: 'PerfectComm_Trial.zip',
      standard: 'PerfectComm_Standard.zip',
      enterprise: 'PerfectComm_Enterprise.zip'
    };

    const targetFileName = fileNameMap[type];

    try {
      // Import Supabase info
      const { projectId } = await import('../../utils/supabase/info.tsx');

      // Convert file to base64 for transmission
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/upload-installer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: targetFileName,
            fileData: fileData.split(',')[1], // Remove data:application/zip;base64, prefix
            contentType: 'application/zip'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return {
        success: true,
        type,
        fileName: targetFileName,
        size: file.size
      };
    } catch (error: any) {
      console.error(`Upload error for ${type}:`, error);
      return {
        success: false,
        type,
        fileName: targetFileName,
        error: error.message
      };
    }
  };

  const handleUploadAll = async () => {
    const filesToUpload = Object.entries(files).filter(([_, file]) => file !== null);

    if (filesToUpload.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    const results = [];

    for (const [type, file] of filesToUpload) {
      toast.info(`Uploading ${type} edition...`);
      const result = await uploadFile(type as 'trial' | 'standard' | 'enterprise', file!);
      results.push(result);

      if (result.success) {
        toast.success(`✅ ${type} edition uploaded successfully`);
      } else {
        toast.error(`❌ ${type} edition upload failed: ${result.error}`);
      }
    }

    setUploadResults(results);
    setUploading(false);

    // Refresh file list
    await loadExistingFiles();
  };

  const loadExistingFiles = async () => {
    setLoading(true);
    try {
      const { projectId } = await import('../../utils/supabase/info.tsx');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/list-installers`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setExistingFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load existing files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-6 h-6 text-blue-600" />
            📦 Wismachion Software Upload Manager
          </CardTitle>
          <CardDescription>
            Upload PerfectComm .zip files for trial, standard, and enterprise editions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Prepare your .zip files for each edition</li>
              <li>Select files below (must be .zip format)</li>
              <li>Click "Upload All Selected Files"</li>
              <li>Files will be stored in Supabase Storage bucket: <code className="bg-blue-100 px-1 rounded">make-215f78a5-perfectcomm-downloads</code></li>
            </ol>
          </div>

          {/* File Upload Forms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trial Edition */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-700">🆓 Trial Edition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="trial-file">Select .zip file</Label>
                  <Input
                    id="trial-file"
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect('trial', file);
                    }}
                    className="cursor-pointer"
                  />
                  {files.trial && (
                    <div className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {files.trial.name} ({formatFileSize(files.trial.size)})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Standard Edition */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">💼 Standard Edition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="standard-file">Select .zip file</Label>
                  <Input
                    id="standard-file"
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect('standard', file);
                    }}
                    className="cursor-pointer"
                  />
                  {files.standard && (
                    <div className="text-sm text-blue-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {files.standard.name} ({formatFileSize(files.standard.size)})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Edition */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">🏢 Enterprise Edition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="enterprise-file">Select .zip file</Label>
                  <Input
                    id="enterprise-file"
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect('enterprise', file);
                    }}
                    className="cursor-pointer"
                  />
                  {files.enterprise && (
                    <div className="text-sm text-purple-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {files.enterprise.name} ({formatFileSize(files.enterprise.size)})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleUploadAll}
              disabled={uploading || Object.values(files).every(f => f === null)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload All Selected Files
                </>
              )}
            </Button>
          </div>

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Upload Results</h3>
              <div className="space-y-2">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium capitalize">{result.type} Edition</span>
                    </div>
                    <div className="text-sm">
                      {result.success ? (
                        <span>{result.fileName} ({formatFileSize(result.size)})</span>
                      ) : (
                        <span>Error: {result.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Files */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">📁 Existing Files in Storage</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadExistingFiles}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            {existingFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {existingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-mono">{file}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {loading ? 'Loading...' : 'No files found. Upload some files to get started.'}
              </p>
            )}
          </div>

          {/* File Naming Reference */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">📌 File Naming Reference</h3>
            <div className="space-y-1 text-sm text-yellow-800">
              <p>• Trial Edition → <code className="bg-yellow-100 px-2 py-1 rounded">PerfectComm_Trial.zip</code></p>
              <p>• Standard Edition → <code className="bg-yellow-100 px-2 py-1 rounded">PerfectComm_Standard.zip</code></p>
              <p>• Enterprise Edition → <code className="bg-yellow-100 px-2 py-1 rounded">PerfectComm_Enterprise.zip</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FileUploadManager;
