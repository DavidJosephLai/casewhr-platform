import { Loader2, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PaymentDiagnosticsProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function PaymentDiagnostics({ language = 'en' }: PaymentDiagnosticsProps) {
  const { accessToken } = useAuth();
  const [projectIdInput, setProjectIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!projectIdInput.trim()) {
      toast.error(language === 'en' ? 'Please enter a project ID' : '請輸入項目 ID');
      return;
    }

    setLoading(true);
    const results: any = {
      projectId: projectIdInput,
      checks: [],
      project: null,
      escrow: null,
      deliverables: null,
      canRelease: false,
      issues: [],
    };

    try {
      // Check 1: Get project
      console.log('🔍 Checking project:', projectIdInput);
      const projectResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        results.project = projectData.project;
        results.checks.push({
          name: 'Project exists',
          status: 'success',
          data: `Status: ${projectData.project.status}`,
        });
        console.log('✅ Project found:', projectData.project);
      } else {
        results.checks.push({
          name: 'Project exists',
          status: 'error',
          data: `HTTP ${projectResponse.status}`,
        });
        results.issues.push('Project not found');
      }

      // Check 2: Get escrow
      console.log('🔍 Checking escrow...');
      const escrowResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/project/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
        results.escrow = escrowData.escrow;
        
        if (escrowData.escrow) {
          results.checks.push({
            name: 'Escrow exists',
            status: 'success',
            data: `Amount: ${escrowData.escrow.amount}, Status: ${escrowData.escrow.status}`,
          });
          console.log('✅ Escrow found:', escrowData.escrow);
        } else {
          results.checks.push({
            name: 'Escrow exists',
            status: 'warning',
            data: 'No escrow found for this project',
          });
          results.issues.push('❌ ISSUE: No escrow record! This is why the button doesn\'t show.');
          console.log('⚠️ No escrow found');
        }
      } else {
        results.checks.push({
          name: 'Escrow exists',
          status: 'error',
          data: `HTTP ${escrowResponse.status}`,
        });
      }

      // Check 3: Get deliverables
      console.log('🔍 Checking deliverables...');
      const deliverablesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (deliverablesResponse.ok) {
        const deliverablesData = await deliverablesResponse.json();
        results.deliverables = deliverablesData.deliverables;
        const approvedCount = deliverablesData.deliverables?.filter((d: any) => d.status === 'approved').length || 0;
        results.checks.push({
          name: 'Deliverables',
          status: 'success',
          data: `Total: ${deliverablesData.deliverables?.length || 0}, Approved: ${approvedCount}`,
        });
        console.log('✅ Deliverables:', deliverablesData.deliverables);
      } else {
        results.checks.push({
          name: 'Deliverables',
          status: 'warning',
          data: 'No deliverables found',
        });
      }

      // Check 4: Determine if payment can be released
      if (results.project && results.escrow) {
        const projectIsPendingPayment = results.project.status === 'pending_payment';
        const escrowIsLocked = results.escrow.status === 'locked';
        
        results.canRelease = projectIsPendingPayment && escrowIsLocked;
        
        if (!projectIsPendingPayment) {
          results.issues.push(`Project status is "${results.project.status}" (needs to be "pending_payment")`);
        }
        
        if (!escrowIsLocked) {
          results.issues.push(`Escrow status is "${results.escrow.status}" (needs to be "locked")`);
        }
      } else if (!results.escrow) {
        results.issues.push('⚠️ NO ESCROW FOUND - The PaymentRelease component returns null when there is no escrow!');
        results.issues.push('💡 Solution: You need to create an escrow by accepting a proposal first.');
      }

      setDiagnostics(results);

    } catch (error: any) {
      console.error('Diagnostics error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-orange-900 mb-2">
            🔍 Payment Release Diagnostics
          </h3>
          <p className="text-sm text-orange-700">
            Check why the "Confirm & Release Payment" button is not showing
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">Project ID</Label>
          <div className="flex gap-2">
            <Input
              id="projectId"
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
              placeholder="Enter project ID to check..."
            />
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {diagnostics && (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            <div className={`p-4 rounded-lg border-2 ${
              diagnostics.canRelease 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-3">
                {diagnostics.canRelease ? (
                  <CheckCircle2 className="size-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="size-6 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold mb-1">
                    {diagnostics.canRelease 
                      ? '✅ Payment Release Button SHOULD Show!' 
                      : '❌ Payment Release Button Will NOT Show'}
                  </h4>
                  {diagnostics.canRelease ? (
                    <p className="text-sm">
                      All conditions are met. The button should be visible in the PaymentRelease component.
                    </p>
                  ) : (
                    <p className="text-sm">
                      Some conditions are not met. See issues below.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
              <h4 className="font-medium">Diagnostic Checks:</h4>
              {diagnostics.checks.map((check: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    check.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : check.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {check.status === 'success' ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="size-4 text-yellow-600" />
                    ) : (
                      <XCircle className="size-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{check.name}</span>
                  </div>
                  <p className="text-xs mt-1 ml-6">{check.data}</p>
                </div>
              ))}
            </div>

            {/* Issues */}
            {diagnostics.issues.length > 0 && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <h4 className="font-bold text-red-900 mb-2">⚠️ Issues Found:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {diagnostics.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-red-800">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Project Details */}
            {diagnostics.project && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">Project Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Title:</strong> {diagnostics.project.title}</p>
                  <p><strong>Status:</strong> <Badge>{diagnostics.project.status}</Badge></p>
                  <p><strong>Assigned Freelancer:</strong> {diagnostics.project.assigned_freelancer_id || 'None'}</p>
                </div>
              </div>
            )}

            {/* Escrow Details */}
            {diagnostics.escrow ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium mb-2">Escrow Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Amount:</strong> NT$ {diagnostics.escrow.amount?.toLocaleString()}</p>
                  <p><strong>Status:</strong> <Badge>{diagnostics.escrow.status}</Badge></p>
                  <p><strong>Client ID:</strong> {diagnostics.escrow.client_id}</p>
                  <p><strong>Freelancer ID:</strong> {diagnostics.escrow.freelancer_id}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <h4 className="font-bold text-red-900 mb-2">❌ No Escrow Found!</h4>
                <p className="text-sm text-red-800 mb-3">
                  This is the main reason why the "Confirm & Release Payment" button is not showing. 
                  The PaymentRelease component checks for escrow and returns null if it doesn't exist.
                </p>
                <p className="text-sm text-red-800">
                  <strong>Solution:</strong> Accept a proposal to create an escrow. When you accept a proposal, 
                  the system automatically creates an escrow record and locks the funds.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}