import { Loader2, Search, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ProjectStatusCheckerProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function ProjectStatusChecker({ language = 'en' }: ProjectStatusCheckerProps) {
  const { accessToken } = useAuth();
  const [projectIdInput, setProjectIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  const checkProject = async () => {
    if (!projectIdInput.trim()) {
      toast.error(language === 'en' ? 'Please enter a project ID' : '請輸入項目 ID');
      return;
    }

    setLoading(true);
    try {
      // Fetch project
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Project not found');
      }

      const data = await response.json();
      
      // Fetch deliverables
      const deliverablesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      let deliverables = [];
      if (deliverablesResponse.ok) {
        const deliverablesData = await deliverablesResponse.json();
        deliverables = deliverablesData.deliverables || [];
      }

      // Fetch escrow
      const escrowResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/project/${projectIdInput}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      let escrow = null;
      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
        escrow = escrowData.escrow;
      }

      setProjectData({
        project: data.project,
        deliverables,
        escrow,
      });

      console.log('📊 Project Status Check:', {
        project: data.project,
        deliverables,
        escrow,
      });

    } catch (error: any) {
      console.error('Error checking project:', error);
      toast.error(`Error: ${error.message}`);
      setProjectData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      'open': { color: 'bg-green-100 text-green-800', icon: '📢', label: 'Open' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: '🔨', label: 'In Progress' },
      'pending_review': { color: 'bg-yellow-100 text-yellow-800', icon: '👀', label: 'Pending Review' },
      'pending_payment': { color: 'bg-orange-100 text-orange-800', icon: '💰', label: 'Pending Payment' },
      'completed': { color: 'bg-gray-100 text-gray-800', icon: '✅', label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' },
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓', label: status };
  };

  const shouldShowPaymentButton = () => {
    if (!projectData) return false;
    return projectData.project.status === 'pending_payment' && projectData.escrow?.status === 'locked';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-purple-900 mb-2">
            🔎 Project Status Checker
          </h3>
          <p className="text-sm text-purple-700">
            Check why "Release Payment" button is not showing
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectIdCheck">Project ID</Label>
          <div className="flex gap-2">
            <Input
              id="projectIdCheck"
              value={projectIdInput}
              onChange={(e) => setProjectIdInput(e.target.value)}
              placeholder="Enter project ID..."
            />
            <Button onClick={checkProject} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {projectData && (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            <div className={`p-4 rounded-lg border-2 ${
              shouldShowPaymentButton()
                ? 'bg-green-50 border-green-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-start gap-3">
                {shouldShowPaymentButton() ? (
                  <CheckCircle2 className="size-6 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="size-6 text-yellow-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold mb-1">
                    {shouldShowPaymentButton()
                      ? '✅ "Release Payment" Button SHOULD Show!'
                      : '⚠️ "Release Payment" Button Will NOT Show'
                    }
                  </h4>
                  <p className="text-sm">
                    {shouldShowPaymentButton()
                      ? 'All conditions are met. The button should be visible in ProjectList.'
                      : 'Some conditions are not met. See details below.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="p-4 bg-white border border-purple-200 rounded-lg">
              <h4 className="font-medium mb-3">Project Details:</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Title:</span>
                  <span className="text-sm font-medium">{projectData.project.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusInfo(projectData.project.status).color}>
                    {getStatusInfo(projectData.project.status).icon} {getStatusInfo(projectData.project.status).label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(projectData.project.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            <div className="p-4 bg-white border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-3">Deliverables ({projectData.deliverables.length}):</h4>
              {projectData.deliverables.length > 0 ? (
                <div className="space-y-2">
                  {projectData.deliverables.map((d: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{d.description || 'No description'}</span>
                      <Badge variant="outline" className={
                        d.status === 'approved' ? 'bg-green-50 text-green-700' :
                        d.status === 'revision_requested' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }>
                        {d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No deliverables submitted</p>
              )}
            </div>

            {/* Escrow */}
            {projectData.escrow ? (
              <div className="p-4 bg-white border border-green-200 rounded-lg">
                <h4 className="font-medium mb-3">Escrow Details:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-bold text-green-600">
                      NT$ {projectData.escrow.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={
                      projectData.escrow.status === 'locked' ? 'bg-orange-100 text-orange-800' :
                      projectData.escrow.status === 'released' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {projectData.escrow.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <h4 className="font-bold text-red-900 mb-2">❌ No Escrow Found!</h4>
                <p className="text-sm text-red-800">
                  This project doesn't have an escrow. You need to accept a proposal first.
                </p>
              </div>
            )}

            {/* Conditions Check */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-3">Conditions for "Release Payment" Button:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {projectData.project.status === 'pending_payment' ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Project status is "pending_payment" 
                    <span className="text-gray-500"> (current: {projectData.project.status})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {projectData.escrow ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                  <span className="text-sm">Escrow exists</span>
                </div>
                <div className="flex items-center gap-2">
                  {projectData.escrow?.status === 'locked' ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Escrow status is "locked" 
                    {projectData.escrow && (
                      <span className="text-gray-500"> (current: {projectData.escrow.status})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Solution */}
            {!shouldShowPaymentButton() && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <h4 className="font-bold text-yellow-900 mb-2">💡 What to do:</h4>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {projectData.project.status !== 'pending_payment' && (
                    <li>
                      <strong>Approve the deliverable</strong> to change status to "pending_payment"
                    </li>
                  )}
                  {!projectData.escrow && (
                    <li>
                      <strong>Accept a proposal</strong> to create an escrow
                    </li>
                  )}
                  {projectData.escrow && projectData.escrow.status !== 'locked' && (
                    <li>
                      Escrow status is "{projectData.escrow.status}" - it should be "locked"
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}