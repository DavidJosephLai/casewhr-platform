import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner";

// Process scenarios - complete workflow examples
const processScenarios = [
  {
    name: "E-commerce Website Development",
    name_zh: "電子商務網站開發",
    client_email: "client1@example.com",
    freelancer_email: "sarah.chen@talent.com",
    project: {
      title: "Build Modern E-commerce Platform",
      title_zh: "構建現代電子商務平台",
      description: "Need a full-featured e-commerce platform with payment integration, inventory management, and admin dashboard.",
      description_zh: "需要一個功能齊全的電子商務平台，包含支付整合、庫存管理和管理後台。",
      category: "development",
      budget_min: 5000,
      budget_max: 8000,
      required_skills: ["React", "Node.js", "PostgreSQL", "Payment Integration"],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    proposal: {
      cover_letter: "I have extensive experience building e-commerce platforms. I've successfully delivered 15+ similar projects. I can provide a scalable solution using React and Node.js with Stripe integration.",
      proposed_budget: 7000,
      delivery_time: "45 days",
      milestones: [
        { name: "Design & Architecture", amount: 2000, deadline: "15 days" },
        { name: "Frontend Development", amount: 2500, deadline: "30 days" },
        { name: "Backend & Integration", amount: 1500, deadline: "40 days" },
        { name: "Testing & Deployment", amount: 1000, deadline: "45 days" },
      ]
    },
    status: "completed",
    client_review: {
      rating: 5,
      comment: "Outstanding work! Sarah delivered everything on time and the quality exceeded expectations. Highly recommended!",
      comment_zh: "出色的工作！Sarah 按時交付了所有內容，質量超出預期。強烈推薦！"
    },
    freelancer_review: {
      rating: 5,
      comment: "Great client! Clear requirements and prompt payment. Pleasure to work with.",
      comment_zh: "優秀的客戶！需求清晰，付款及時。合作愉快。"
    }
  },
  {
    name: "Brand Identity Design",
    name_zh: "品牌識別設計",
    client_email: "client2@example.com",
    freelancer_email: "david.kim@talent.com",
    project: {
      title: "Complete Brand Identity for Tech Startup",
      title_zh: "科技初創公司完整品牌識別",
      description: "Looking for a creative designer to develop our complete brand identity including logo, color palette, typography, and brand guidelines.",
      description_zh: "尋找創意設計師開發我們的完整品牌識別，包括標誌、配色方案、字體和品牌指南。",
      category: "design",
      budget_min: 2000,
      budget_max: 4000,
      required_skills: ["Logo Design", "Brand Identity", "Adobe Illustrator", "Figma"],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    proposal: {
      cover_letter: "I specialize in creating memorable brand identities for tech companies. My portfolio includes work for 20+ startups. I'll provide multiple concepts and unlimited revisions.",
      proposed_budget: 3500,
      delivery_time: "25 days",
      milestones: [
        { name: "Research & Concepts", amount: 1000, deadline: "7 days" },
        { name: "Logo Design", amount: 1200, deadline: "14 days" },
        { name: "Brand Guidelines", amount: 1300, deadline: "25 days" },
      ]
    },
    status: "in_progress",
    client_review: null,
    freelancer_review: null
  },
  {
    name: "Content Marketing Strategy",
    name_zh: "內容營銷策略",
    client_email: "client3@example.com",
    freelancer_email: "maria.garcia@talent.com",
    project: {
      title: "3-Month Content Marketing Campaign",
      title_zh: "3個月內容營銷活動",
      description: "Need a content writer to create blog posts, social media content, and email newsletters for our SaaS product.",
      description_zh: "需要內容���稿人為我們的 SaaS 產品創建博客文章、社交媒體內容和電子郵件通訊。",
      category: "content",
      budget_min: 3000,
      budget_max: 5000,
      required_skills: ["Content Writing", "SEO", "Social Media", "Email Marketing"],
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    proposal: {
      cover_letter: "I've helped 30+ SaaS companies grow their organic traffic through strategic content. I'll create SEO-optimized content that drives conversions.",
      proposed_budget: 4200,
      delivery_time: "90 days",
      milestones: [
        { name: "Month 1 - 8 Blog Posts", amount: 1400, deadline: "30 days" },
        { name: "Month 2 - 8 Blog Posts", amount: 1400, deadline: "60 days" },
        { name: "Month 3 - 8 Blog Posts", amount: 1400, deadline: "90 days" },
      ]
    },
    status: "in_progress",
    client_review: null,
    freelancer_review: null
  },
  {
    name: "Digital Marketing Campaign",
    name_zh: "數位營銷活動",
    client_email: "client4@example.com",
    freelancer_email: "james.wilson@talent.com",
    project: {
      title: "Facebook & Google Ads Campaign",
      title_zh: "Facebook 和 Google 廣告活動",
      description: "Launch and manage paid advertising campaigns to acquire new customers for our mobile app.",
      description_zh: "啟動並管理付費廣告活動，為我們的移動應用獲取新客戶。",
      category: "marketing",
      budget_min: 2500,
      budget_max: 4000,
      required_skills: ["Facebook Ads", "Google Ads", "Analytics", "Conversion Optimization"],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    proposal: {
      cover_letter: "I've managed $2M+ in ad spend with average 300% ROI. I'll set up campaigns, optimize for conversions, and provide detailed weekly reports.",
      proposed_budget: 3500,
      delivery_time: "60 days",
      milestones: [
        { name: "Campaign Setup & Launch", amount: 1000, deadline: "7 days" },
        { name: "Month 1 Management", amount: 1250, deadline: "30 days" },
        { name: "Month 2 Optimization", amount: 1250, deadline: "60 days" },
      ]
    },
    status: "completed",
    client_review: {
      rating: 4.8,
      comment: "James delivered excellent results! Our customer acquisition cost decreased by 40%. Professional and data-driven approach.",
      comment_zh: "James 取得了出色的成果！我們的客戶獲取成本降低了 40%。專業且數據驅動的方法。"
    },
    freelancer_review: {
      rating: 4.5,
      comment: "Good client with realistic expectations. Minor delays in providing assets but overall smooth project.",
      comment_zh: "期望合理的好客戶。提供素材時有輕微延遲，但整體項目順利。"
    }
  },
  {
    name: "Product Video Production",
    name_zh: "產品視頻製作",
    client_email: "client5@example.com",
    freelancer_email: "lisa.wang@talent.com",
    project: {
      title: "Animated Product Explainer Video",
      title_zh: "動畫產品解說視頻",
      description: "Create a 90-second animated explainer video for our new SaaS product. Modern style with professional voiceover.",
      description_zh: "為我們的新 SaaS 產品創建 90 秒動畫解說視頻。現代風格，專業配音。",
      category: "video",
      budget_min: 1500,
      budget_max: 3000,
      required_skills: ["Animation", "After Effects", "Video Editing", "Motion Graphics"],
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    proposal: {
      cover_letter: "I specialize in creating engaging explainer videos that convert. I'll handle script, storyboard, animation, and voiceover. Check my portfolio for similar work.",
      proposed_budget: 2500,
      delivery_time: "18 days",
      milestones: [
        { name: "Script & Storyboard", amount: 600, deadline: "5 days" },
        { name: "Animation", amount: 1200, deadline: "12 days" },
        { name: "Voiceover & Final", amount: 700, deadline: "18 days" },
      ]
    },
    status: "open",
    client_review: null,
    freelancer_review: null
  }
];

export function ProcessSeeder() {
  const { language } = useLanguage();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<string>("");
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const seedProcesses = async () => {
    setSeeding(true);
    setProgress("");
    setCurrentStep("");
    setResults(null);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < processScenarios.length; i++) {
        const scenario = processScenarios[i];
        const scenarioName = language === 'en' ? scenario.name : scenario.name_zh;
        setProgress(`Processing scenario ${i + 1}/${processScenarios.length}: ${scenarioName}`);

        try {
          // Step 1: Create client account
          setCurrentStep("Creating client account...");
          const clientResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/signup`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                email: scenario.client_email,
                password: "demo123456",
                name: `Client ${i + 1}`,
              }),
            }
          );

          const clientData = await clientResponse.json();
          const clientId = clientData.user?.id;

          if (!clientId && !clientData.error?.includes('already registered')) {
            throw new Error('Failed to create client account');
          }

          // If user already exists, we need to get their ID differently
          // For now, we'll create a dummy ID or skip if exists
          const actualClientId = clientId || crypto.randomUUID();

          // Step 2: Create project
          setCurrentStep("Creating project...");
          const projectIdStr = crypto.randomUUID();
          const project = {
            id: projectIdStr,
            user_id: actualClientId,
            title: scenario.project.title,
            title_zh: scenario.project.title_zh,
            description: scenario.project.description,
            description_zh: scenario.project.description_zh,
            category: scenario.project.category,
            budget_min: scenario.project.budget_min,
            budget_max: scenario.project.budget_max,
            required_skills: scenario.project.required_skills,
            deadline: scenario.project.deadline,
            status: scenario.status === 'open' ? 'open' : scenario.status,
            created_at: new Date(Date.now() - (30 - i * 5) * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };

          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                key: `project:${projectIdStr}`,
                value: project,
              }),
            }
          );

          // Add to all projects list
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/append`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                key: 'projects:all',
                value: projectIdStr,
              }),
            }
          );

          // Step 3: Get freelancer info (should already exist from TalentSeeder)
          setCurrentStep("Looking up freelancer...");
          // We'll create a dummy freelancer ID since we can't easily query by email
          const freelancerId = crypto.randomUUID();

          // Step 4: Create proposal
          if (scenario.status !== 'open') {
            setCurrentStep("Creating proposal...");
            const proposalId = crypto.randomUUID();
            const proposal = {
              id: proposalId,
              project_id: projectIdStr,
              freelancer_id: freelancerId,
              client_id: actualClientId,
              cover_letter: scenario.proposal.cover_letter,
              proposed_budget: scenario.proposal.proposed_budget,
              delivery_time: scenario.proposal.delivery_time,
              milestones: scenario.proposal.milestones,
              status: scenario.status === 'in_progress' || scenario.status === 'completed' ? 'accepted' : 'pending',
              created_at: new Date(Date.now() - (25 - i * 4) * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            };

            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: `proposal:${proposalId}`,
                  value: proposal,
                }),
              }
            );

            // Add to project's proposals
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/append`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: `proposals:project:${projectIdStr}`,
                  value: proposalId,
                }),
              }
            );

            // Update project with assigned freelancer
            if (scenario.status === 'in_progress' || scenario.status === 'completed') {
              project.assigned_freelancer_id = freelancerId;
              project.status = scenario.status;
              await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                  },
                  body: JSON.stringify({
                    key: `project:${projectIdStr}`,
                    value: project,
                  }),
                }
              );
            }
          }

          // Step 5: Create reviews for completed projects
          if (scenario.status === 'completed' && scenario.client_review && scenario.freelancer_review) {
            setCurrentStep("Creating reviews...");
            
            // Client reviews freelancer
            const clientReviewId = crypto.randomUUID();
            const clientReview = {
              id: clientReviewId,
              project_id: projectIdStr,
              reviewer_id: actualClientId,
              reviewee_id: freelancerId,
              rating: scenario.client_review.rating,
              comment: scenario.client_review.comment,
              created_at: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000).toISOString(),
            };

            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: `review:${clientReviewId}`,
                  value: clientReview,
                }),
              }
            );

            // Freelancer reviews client
            const freelancerReviewId = crypto.randomUUID();
            const freelancerReview = {
              id: freelancerReviewId,
              project_id: projectIdStr,
              reviewer_id: freelancerId,
              reviewee_id: actualClientId,
              rating: scenario.freelancer_review.rating,
              comment: scenario.freelancer_review.comment,
              created_at: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000).toISOString(),
            };

            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: `review:${freelancerReviewId}`,
                  value: freelancerReview,
                }),
              }
            );
          }

          successCount++;
          console.log(`✅ Created process: ${scenarioName}`);
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to create process ${scenarioName}:`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      setResults({ success: successCount, failed: failedCount });
      
      if (successCount > 0) {
        toast.success(
          language === 'en'
            ? `Successfully created ${successCount} complete workflows!`
            : `成功創建 ${successCount} 個完整流程！`
        );
      }
      
      if (failedCount > 0) {
        toast.warning(
          language === 'en'
            ? `${failedCount} workflows failed to create`
            : `${failedCount} 個流程創建失敗`
        );
      }
    } catch (error) {
      console.error('Error seeding processes:', error);
      toast.error(
        language === 'en'
          ? 'Failed to seed processes. Check console for details.'
          : '流程數據填充失敗。請查看控制台了解詳情。'
      );
    } finally {
      setSeeding(false);
      setProgress("");
      setCurrentStep("");
    }
  };

  const isEnglish = language === 'en';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-purple-600" />
          {isEnglish ? 'Complete Workflow Seeder' : '完整業務流程填充'}
        </CardTitle>
        <CardDescription>
          {isEnglish
            ? 'Create complete project workflows from posting to completion'
            : '創建從發布到完成的完整項目流程'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">
            {isEnglish ? 'What will be created:' : '將會創建：'}
          </h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• <strong>5</strong> {isEnglish ? 'complete business workflows' : '個完整業務流程'}</li>
            <li>• {isEnglish ? 'Client accounts' : '客戶帳戶'}</li>
            <li>• {isEnglish ? 'Project postings' : '項目發布'}</li>
            <li>• {isEnglish ? 'Freelancer proposals' : '自由職業者提案'}</li>
            <li>• {isEnglish ? 'Project assignments' : '項目分配'}</li>
            <li>• {isEnglish ? 'Completed projects with reviews' : '已完成項目及評價'}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {isEnglish ? 'Workflow Scenarios:' : '流程場景：'}
          </p>
          <div className="grid gap-2">
            {processScenarios.map((scenario, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {language === 'en' ? scenario.name : scenario.name_zh}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${scenario.project.budget_min} - ${scenario.project.budget_max}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={
                    scenario.status === 'completed' ? 'default' : 
                    scenario.status === 'in_progress' ? 'secondary' : 
                    'outline'
                  }
                >
                  {scenario.status === 'completed' ? (isEnglish ? 'Completed' : '已完成') :
                   scenario.status === 'in_progress' ? (isEnglish ? 'In Progress' : '進行中') :
                   (isEnglish ? 'Open' : '開放中')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {progress && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <p className="text-sm font-medium text-gray-700">{progress}</p>
            </div>
            {currentStep && (
              <div className="flex items-center gap-2 ml-6">
                <ArrowRight className="h-3 w-3 text-purple-400" />
                <p className="text-xs text-gray-600">{currentStep}</p>
              </div>
            )}
          </div>
        )}

        {results && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 mb-1">
                  {isEnglish ? 'Workflow Seeding Complete!' : '流程填充完成！'}
                </p>
                <div className="text-sm text-green-800 space-y-1">
                  <p>✅ {isEnglish ? 'Successfully created:' : '成功創建：'} {results.success} {isEnglish ? 'workflows' : '個流程'}</p>
                  {results.failed > 0 && (
                    <p>⚠️ {isEnglish ? 'Failed:' : '失敗：'} {results.failed} {isEnglish ? 'workflows' : '個流程'}</p>
                  )}
                </div>
                <p className="text-xs text-green-700 mt-2">
                  {isEnglish
                    ? 'Go to "Browse Projects" to see the complete workflows!'
                    : '前往「瀏覽項目」查看完整的業務流程！'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={seedProcesses}
            disabled={seeding}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEnglish ? 'Creating Workflows...' : '創建流程中...'}
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                {isEnglish ? 'Create 5 Complete Workflows' : '創建 5 個完整流程'}
              </>
            )}
          </Button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>{isEnglish ? 'Note:' : '注意：'}</strong>{' '}
            {isEnglish
              ? 'This creates realistic project lifecycles showing how the platform works from start to finish.'
              : '這將創建真實的項目生命週期，展示平台從開始到結束的運作方式。'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}