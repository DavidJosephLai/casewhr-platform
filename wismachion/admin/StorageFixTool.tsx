import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, FileCheck, Wrench } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';

export function StorageFixTool() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [fixResult, setFixResult] = useState<any>(null);

  const listFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/storage/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('📋 [Storage] Files:', data);

      if (data.success) {
        setFiles(data.files || []);
        toast.success(`Found ${data.files?.length || 0} file(s)`);
      } else {
        toast.error(data.error || 'Failed to list files');
      }
    } catch (error) {
      console.error('❌ [Storage] Error:', error);
      toast.error('Failed to list files');
    } finally {
      setLoading(false);
    }
  };

  const autoFix = async () => {
    setLoading(true);
    setFixResult(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/storage/auto-fix`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('🔧 [Storage] Auto-fix result:', data);

      if (data.success) {
        setFixResult(data);
        toast.success(data.message || 'Auto-fix completed');
        
        // Refresh file list
        await listFiles();
      } else {
        toast.error(data.error || 'Auto-fix failed');
      }
    } catch (error) {
      console.error('❌ [Storage] Error:', error);
      toast.error('Auto-fix failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            Storage File Manager
          </CardTitle>
          <CardDescription>
            Fix filename typos in Supabase Storage
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Purpose:</strong> This tool automatically fixes common filename typos in the PerfectComm downloads bucket.
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Finds files with typos like "PrefectComm_Tril.zip"</li>
                <li>Renames them to correct names like "PerfectComm_Trial.zip"</li>
                <li>Safe operation - creates new file before deleting old one</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={listFiles}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  List Files
                </>
              )}
            </Button>

            <Button
              onClick={autoFix}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Auto-Fix Filenames
                </>
              )}
            </Button>
          </div>

          {/* Fix Result */}
          {fixResult && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Auto-Fix Result:</strong>
                <div className="mt-2 space-y-2">
                  <p>{fixResult.message}</p>
                  {fixResult.corrections && fixResult.corrections.length > 0 && (
                    <div className="bg-white rounded p-3 text-sm">
                      <strong>Corrections Made:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {fixResult.corrections.map((correction: any, index: number) => (
                          <li key={index}>
                            {correction.success ? '✅' : '❌'} {correction.oldName} → {correction.newName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fixResult.corrections && fixResult.corrections.length === 0 && (
                    <p className="text-sm">No typos found - all filenames are correct!</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Files */}
          {files.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Current Files in Storage:</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-white rounded p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-semibold text-sm">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {file.lastModified && (
                            <> • Modified: {new Date(file.lastModified).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                      {file.name.includes('Prefect') || file.name.includes('Tril') ? (
                        <span className="text-red-600 text-xs font-semibold bg-red-100 px-2 py-1 rounded">
                          TYPO
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded">
                          OK
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Filenames Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">✅ Correct Filenames:</h4>
            <div className="space-y-1 text-sm text-blue-800 font-mono">
              <p>• PerfectComm_Trial.zip</p>
              <p>• PerfectComm_Standard.zip</p>
              <p>• PerfectComm_Enterprise.zip</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
