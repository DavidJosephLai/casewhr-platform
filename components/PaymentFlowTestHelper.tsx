import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PaymentFlowTestHelperProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function PaymentFlowTestHelper({ language = 'en' }: PaymentFlowTestHelperProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const translations = {
    en: {
      title: '🧪 Payment Flow Test Helper',
      description: 'Test the complete payment and escrow flow',
      step1: 'Step 1: Create Test Project',
      step2: 'Step 2: Accept Proposal & Create Escrow',
      step3: 'Step 3: Submit Deliverable',
      step4: 'Step 4: Approve Deliverable',
      step5: 'Step 5: Release Payment',
      quickTest: '🚀 Run Complete Test Flow',
      running: 'Running test...',
      success: 'Success!',
      error: 'Error',
      results: 'Test Results',
    },
    zh: {
      title: '🧪 支付流程測試工具',
      description: '測試完整的支付和托管流程',
      step1: '步驟 1：創建測試項目',
      step2: '步驟 2：接受提案並創建托管',
      step3: '步驟 3：提交交付物',
      step4: '步驟 4：批准交付物',
      step5: '步驟 5：釋放款項',
      quickTest: '🚀 執行完整測試流程',
      running: '測試運行中...',
      success: '成功！',
      error: '錯誤',
      results: '測試結果',
    },
    'zh-TW': {
      title: '🧪 支付流程測試工具',
      description: '測試完整的支付和托管流程',
      step1: '步驟 1：創建測試項目',
      step2: '步驟 2：接受提案並創建托管',
      step3: '步驟 3：提交交付物',
      step4: '步驟 4：批准交付物',
      step5: '步驟 5：釋放款項',
      quickTest: '🚀 執行完整測試流程',
      running: '測試運行中...',
      success: '成功！',
      error: '錯誤',
      results: '測試結果',
    },
    'zh-CN': {
      title: '🧪 支付流程测试工具',
      description: '测试完整的支付和托管流程',
      step1: '步骤 1：创建测试项目',
      step2: '步骤 2：接受提案并创建托管',
      step3: '步骤 3：提交交付物',
      step4: '步骤 4：批准交付物',
      step5: '步骤 5：释放款项',
      quickTest: '🚀 执行完整测试流程',
      running: '测试运行中...',
      success: '成功！',
      error: '错误',
      results: '测试结果',
    },
  };

  const t = translations[language];

  const runCompleteTest = async () => {
    setLoading(true);
    const results: any = {
      steps: [],
      projectId: null,
      proposalId: null,
      deliverableId: null,
      escrowId: null,
    };

    try {
      // Step 1: Create wallet and deposit
      console.log('Step 1: Creating wallet and depositing funds...');
      const depositResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/wallet/deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ amount: 50000 }),
        }
      );

      if (!depositResponse.ok) {
        throw new Error('Failed to deposit funds');
      }

      const depositData = await depositResponse.json();
      results.steps.push({ step: 1, name: 'Deposit funds', status: 'success', data: depositData });
      console.log('✅ Deposit successful:', depositData);

      // Step 2: Create test project
      console.log('Step 2: Creating test project...');
      const projectResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: 'Test Project for Payment Flow',
            description: 'This is a test project to verify the payment flow',
            budget_min: 10000,
            budget_max: 20000,
            required_skills: ['Testing'],
            category: 'Web Development',
          }),
        }
      );

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const projectData = await projectResponse.json();
      results.projectId = projectData.project.id;
      results.steps.push({ step: 2, name: 'Create project', status: 'success', data: projectData });
      console.log('✅ Project created:', projectData);

      // Step 3: Create proposal (需要另一個用戶，或者直接模擬)
      console.log('Step 3: Creating proposal...');
      const proposalResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: results.projectId,
            cover_letter: 'Test proposal for payment flow',
            proposed_budget: 15000,
            delivery_time: '2 weeks',
            milestones: ['Complete work', 'Test and deliver'],
          }),
        }
      );

      if (!proposalResponse.ok) {
        throw new Error('Failed to create proposal');
      }

      const proposalData = await proposalResponse.json();
      results.proposalId = proposalData.proposal.id;
      results.steps.push({ step: 3, name: 'Create proposal', status: 'success', data: proposalData });
      console.log('✅ Proposal created:', proposalData);

      // Step 4: Accept proposal and create escrow
      console.log('Step 4: Accepting proposal and creating escrow...');
      const acceptResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/proposals/${results.proposalId}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!acceptResponse.ok) {
        const errorText = await acceptResponse.text();
        throw new Error(`Failed to accept proposal: ${errorText}`);
      }

      const acceptData = await acceptResponse.json();
      results.escrowId = acceptData.escrow?.id;
      results.steps.push({ step: 4, name: 'Accept proposal', status: 'success', data: acceptData });
      console.log('✅ Proposal accepted and escrow created:', acceptData);

      // Step 5: Submit deliverable
      console.log('Step 5: Submitting deliverable...');
      const deliverableResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: results.projectId,
            description: 'Test deliverable - work completed',
            files: [],
          }),
        }
      );

      if (!deliverableResponse.ok) {
        throw new Error('Failed to submit deliverable');
      }

      const deliverableData = await deliverableResponse.json();
      results.deliverableId = deliverableData.deliverable.id;
      results.steps.push({ step: 5, name: 'Submit deliverable', status: 'success', data: deliverableData });
      console.log('✅ Deliverable submitted:', deliverableData);

      // Step 6: Approve deliverable
      console.log('Step 6: Approving deliverable...');
      const approveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/${results.deliverableId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action: 'approve',
            feedback: 'Great work!',
          }),
        }
      );

      if (!approveResponse.ok) {
        throw new Error('Failed to approve deliverable');
      }

      const approveData = await approveResponse.json();
      results.steps.push({ step: 6, name: 'Approve deliverable', status: 'success', data: approveData });
      console.log('✅ Deliverable approved, project status:', approveData.project?.status);

      // Now the project should be in 'pending_payment' status
      setTestResults(results);
      toast.success(language === 'en' 
        ? '✅ Test completed! Project is now in PENDING_PAYMENT status. You can now release payment!' 
        : '✅ 測試完成！項目現在處於「待撥款」狀態。您現在可以撥款了！');

    } catch (error: any) {
      console.error('Test failed:', error);
      results.steps.push({ step: 'error', name: 'Test failed', status: 'error', error: error.message });
      setTestResults(results);
      toast.error(`${t.error}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-purple-900 mb-2">{t.title}</h3>
          <p className="text-sm text-purple-700">{t.description}</p>
        </div>

        <Button
          onClick={runCompleteTest}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 mr-2 animate-spin" />
              {t.running}
            </>
          ) : (
            t.quickTest
          )}
        </Button>

        {testResults && (
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-purple-900">{t.results}</h4>
            <div className="space-y-2">
              {testResults.steps.map((step: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    step.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {step.status === 'success' ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : (
                      <XCircle className="size-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {step.step}. {step.name}
                    </span>
                  </div>
                  {step.error && (
                    <p className="text-xs text-red-600 mt-1">{step.error}</p>
                  )}
                </div>
              ))}
            </div>

            {testResults.projectId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-2">
                      {language === 'en' ? '✅ Project Ready!' : '✅ 項目準備就緒！'}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'Go to Dashboard → My Projects to see the project in "Pending Payment" status.'
                        : '前往 Dashboard → 我的項目 查看處於「待撥款」狀態的項目。'}
                    </p>
                    <p className="mt-2 font-mono text-xs bg-white px-2 py-1 rounded">
                      Project ID: {testResults.projectId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}