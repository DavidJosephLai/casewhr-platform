import { CheckCircle, Loader2, AlertCircle, DollarSign, Rocket } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function QuickPaymentTest() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [testData, setTestData] = useState({
    projectId: "",
    escrowAmount: 50000,
  });

  const t = {
    title: {
      zh: "🚀 快速撥款測試",
      en: "🚀 Quick Payment Test"
    },
    subtitle: {
      zh: "快速完成撥款流程測試",
      en: "Quickly test the payment release flow"
    },
    step1: {
      zh: "步驟 1：輸入項目 ID",
      en: "Step 1: Enter Project ID"
    },
    step2: {
      zh: "步驟 2：提交交付物",
      en: "Step 2: Submit Deliverables"
    },
    step3: {
      zh: "步驟 3：批准交付物",
      en: "Step 3: Approve Deliverables"
    },
    step4: {
      zh: "步驟 4：釋放付款",
      en: "Step 4: Release Payment"
    },
    projectId: {
      zh: "項目 ID",
      en: "Project ID"
    },
    amount: {
      zh: "托管金額",
      en: "Escrow Amount"
    },
    submitDeliverable: {
      zh: "提交交付物",
      en: "Submit Deliverable"
    },
    approveDeliverable: {
      zh: "批准交付物",
      en: "Approve Deliverable"
    },
    releasePayment: {
      zh: "釋放付款",
      en: "Release Payment"
    },
    success: {
      zh: "✅ 成功！",
      en: "✅ Success!"
    },
    warning: {
      zh: "⚠️ 請先登入",
      en: "⚠️ Please log in first"
    },
    info: {
      zh: "💡 提示",
      en: "💡 Info"
    },
    infoText: {
      zh: "此工具僅用於測試。請確保您有一個處於 in_progress 狀態的項目。",
      en: "This tool is for testing only. Make sure you have a project in in_progress status."
    },
    currentStep: {
      zh: "當前步驟",
      en: "Current Step"
    },
    reset: {
      zh: "重置",
      en: "Reset"
    }
  };

  const submitDeliverable = async () => {
    if (!accessToken || !testData.projectId) {
      toast.error(language === 'en' ? 'Please enter project ID' : '請輸入項目 ID');
      return;
    }

    setLoading(true);
    try {
      // Submit deliverable
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: testData.projectId,
            description: "Test deliverable submission for payment testing",
            files: [
              {
                file_name: "test-deliverable.pdf",
                file_path: "test/test-deliverable.pdf",
                file_type: "application/pdf",
                file_size: 1024,
              }
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deliverable');
      }

      toast.success(language === 'en' ? 'Deliverable submitted!' : '交付物已提交！');
      setStep(3);
    } catch (error: any) {
      console.error('Error submitting deliverable:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to submit deliverable' : '提交交付物失敗'));
    } finally {
      setLoading(false);
    }
  };

  const approveDeliverable = async () => {
    if (!accessToken || !testData.projectId) {
      toast.error(language === 'en' ? 'Please enter project ID' : '請輸入項目 ID');
      return;
    }

    setLoading(true);
    try {
      // Get deliverables
      const delivResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/project/${testData.projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const delivData = await delivResponse.json();

      if (!delivResponse.ok) {
        throw new Error(delivData.error || 'Failed to fetch deliverables');
      }

      if (!delivData.deliverables || delivData.deliverables.length === 0) {
        throw new Error('No deliverables found. Please submit a deliverable first.');
      }

      const deliverableId = delivData.deliverables[0].id;

      // Approve deliverable
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/deliverables/${deliverableId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action: 'approve',
            feedback: 'Test approval for payment testing',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve deliverable');
      }

      toast.success(language === 'en' ? 'Deliverable approved!' : '交付物已批准！');
      setStep(4);
    } catch (error: any) {
      console.error('Error approving deliverable:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to approve deliverable' : '批准交付物失敗'));
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async () => {
    if (!accessToken || !testData.projectId) {
      toast.error(language === 'en' ? 'Please enter project ID' : '請輸入項目 ID');
      return;
    }

    setLoading(true);
    try {
      // Release payment
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/release`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: testData.projectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release payment');
      }

      toast.success(language === 'en' 
        ? '🎉 Payment released successfully! Check the wallets.' 
        : '🎉 付款已成功釋放！請檢查錢包。');
      setStep(5);
    } catch (error: any) {
      console.error('Error releasing payment:', error);
      toast.error(error.message || (language === 'en' ? 'Failed to release payment' : '釋放付款失敗'));
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setStep(1);
    setTestData({
      projectId: "",
      escrowAmount: 50000,
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>{t.warning[language]}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-5" />
          {t.title[language]}
        </CardTitle>
        <CardDescription>{t.subtitle[language]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="size-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <div className="font-semibold">{t.info[language]}</div>
              <div className="text-sm">{t.infoText[language]}</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current Step */}
        <div className="flex items-center justify-between">
          <span className="text-sm">{t.currentStep[language]}</span>
          <span className="text-sm font-semibold">
            {step} / 5
          </span>
        </div>

        <Separator />

        {/* Step 1: Enter Project ID */}
        <div className={`space-y-4 ${step !== 1 && 'opacity-50'}`}>
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <CheckCircle className="size-5 text-green-600" />
            ) : (
              <div className="size-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs">1</div>
            )}
            <h3 className="font-semibold">{t.step1[language]}</h3>
          </div>
          <div className="space-y-2 pl-7">
            <Label htmlFor="projectId">{t.projectId[language]}</Label>
            <Input
              id="projectId"
              value={testData.projectId}
              onChange={(e) => setTestData({ ...testData, projectId: e.target.value })}
              placeholder="Enter project ID"
              disabled={step > 1}
            />
          </div>
        </div>

        {/* Step 2: Submit Deliverable */}
        {step >= 2 && (
          <div className={`space-y-4 ${step !== 2 && 'opacity-50'}`}>
            <div className="flex items-center gap-2">
              {step > 2 ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <div className="size-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs">2</div>
              )}
              <h3 className="font-semibold">{t.step2[language]}</h3>
            </div>
            <div className="pl-7">
              <Button
                onClick={submitDeliverable}
                disabled={loading || step !== 2}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {language === 'en' ? 'Submitting...' : '提交中...'}
                  </>
                ) : (
                  t.submitDeliverable[language]
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Approve Deliverable */}
        {step >= 3 && (
          <div className={`space-y-4 ${step !== 3 && 'opacity-50'}`}>
            <div className="flex items-center gap-2">
              {step > 3 ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <div className="size-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs">3</div>
              )}
              <h3 className="font-semibold">{t.step3[language]}</h3>
            </div>
            <div className="pl-7">
              <Button
                onClick={approveDeliverable}
                disabled={loading || step !== 3}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {language === 'en' ? 'Approving...' : '批准中...'}
                  </>
                ) : (
                  t.approveDeliverable[language]
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Release Payment */}
        {step >= 4 && (
          <div className={`space-y-4 ${step !== 4 && 'opacity-50'}`}>
            <div className="flex items-center gap-2">
              {step > 4 ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <div className="size-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs">4</div>
              )}
              <h3 className="font-semibold">{t.step4[language]}</h3>
            </div>
            <div className="pl-7">
              <Button
                onClick={releasePayment}
                disabled={loading || step !== 4}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {language === 'en' ? 'Releasing...' : '釋放中...'}
                  </>
                ) : (
                  <>
                    <DollarSign className="size-4 mr-2" />
                    {t.releasePayment[language]}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {step === 5 && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="size-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t.success[language]}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!testData.projectId}
              className="flex-1"
            >
              {language === 'en' ? 'Next' : '下一步'}
            </Button>
          )}
          {step > 1 && (
            <Button
              onClick={resetTest}
              variant="outline"
              className="flex-1"
            >
              {t.reset[language]}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}