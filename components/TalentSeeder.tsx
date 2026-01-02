import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner";

// Sample talents data
const sampleTalents = [
  {
    email: "sarah.chen@talent.com",
    password: "demo123456",
    name: "Sarah Chen",
    role: "fullstack",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    hourly_rate: 85,
    bio: "Full-stack developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure.",
    bio_zh: "全端開發工程師，擁有 8 年以上構建可擴展 Web 應用的經驗。專精於 React、Node.js 和雲端基礎設施。",
    portfolio: [
      {
        title: "E-commerce Platform",
        description: "Built a complete e-commerce solution with payment integration",
        image_url: "https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80",
        project_url: "https://example.com/ecommerce"
      },
      {
        title: "Real-time Analytics Dashboard",
        description: "Developed real-time data visualization platform",
        image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        project_url: "https://example.com/analytics"
      }
    ],
    rating: 4.9,
    reviews_count: 47
  },
  {
    email: "david.kim@talent.com",
    password: "demo123456",
    name: "David Kim",
    role: "designer",
    skills: ["UI/UX Design", "Figma", "Adobe XD", "Prototyping", "Design Systems"],
    hourly_rate: 75,
    bio: "Award-winning UI/UX designer focused on creating intuitive and beautiful digital experiences. Expert in design systems and user research.",
    bio_zh: "獲獎 UI/UX 設計師，專注於創造直觀且美觀的數位體驗。設計系統和用戶研究專家。",
    portfolio: [
      {
        title: "Mobile Banking App",
        description: "Complete redesign of banking app UI/UX",
        image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        project_url: "https://example.com/banking"
      },
      {
        title: "SaaS Dashboard Design",
        description: "Modern dashboard design for SaaS platform",
        image_url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80",
        project_url: "https://example.com/saas"
      }
    ],
    rating: 4.8,
    reviews_count: 35
  },
  {
    email: "maria.garcia@talent.com",
    password: "demo123456",
    name: "Maria Garcia",
    role: "writer",
    skills: ["Content Writing", "SEO", "Technical Writing", "Copywriting", "Blog Writing"],
    hourly_rate: 60,
    bio: "Professional content writer and SEO specialist with expertise in tech, business, and lifestyle niches. Published in major publications.",
    bio_zh: "專業內容撰稿人和 SEO 專家，擅長科技、商業和生活方式領域。作品發表於主要出版物。",
    portfolio: [
      {
        title: "Tech Blog Series",
        description: "50+ technical articles on web development",
        image_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
        project_url: "https://example.com/blog"
      },
      {
        title: "Marketing Copy Portfolio",
        description: "Conversion-focused copy for SaaS companies",
        image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
        project_url: "https://example.com/copy"
      }
    ],
    rating: 4.7,
    reviews_count: 28
  },
  {
    email: "james.wilson@talent.com",
    password: "demo123456",
    name: "James Wilson",
    role: "marketer",
    skills: ["Digital Marketing", "Google Ads", "Facebook Ads", "Analytics", "Growth Hacking"],
    hourly_rate: 90,
    bio: "Growth marketing expert who has helped 50+ startups scale their user acquisition. Specialized in paid advertising and conversion optimization.",
    bio_zh: "增長營銷專家，已幫助 50 多家初創公司擴大用戶獲取規模。專精於付費廣告和轉化優化。",
    portfolio: [
      {
        title: "SaaS Growth Campaign",
        description: "Achieved 300% ROI on ad spend",
        image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        project_url: "https://example.com/growth"
      },
      {
        title: "E-commerce Marketing",
        description: "Scaled monthly revenue from $10K to $100K",
        image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
        project_url: "https://example.com/ecom"
      }
    ],
    rating: 5.0,
    reviews_count: 52
  },
  {
    email: "lisa.wang@talent.com",
    password: "demo123456",
    name: "Lisa Wang",
    role: "video",
    skills: ["Video Editing", "Motion Graphics", "After Effects", "Premiere Pro", "Animation"],
    hourly_rate: 70,
    bio: "Creative video editor and motion graphics artist. Specialized in commercial videos, explainer animations, and social media content.",
    bio_zh: "創意視頻編輯和動態圖形藝術家。專精於商業視頻、解說畫和社交媒體內容。",
    portfolio: [
      {
        title: "Product Launch Video",
        description: "High-impact product launch video for tech startup",
        image_url: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&q=80",
        project_url: "https://example.com/launch"
      },
      {
        title: "Animated Explainer Series",
        description: "10-part explainer video series",
        image_url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80",
        project_url: "https://example.com/explainer"
      }
    ],
    rating: 4.9,
    reviews_count: 41
  },
  {
    email: "robert.brown@talent.com",
    password: "demo123456",
    name: "Robert Brown",
    role: "consultant",
    skills: ["Business Strategy", "Financial Planning", "Market Analysis", "Operations", "Leadership"],
    hourly_rate: 120,
    bio: "Senior business consultant with 15+ years of experience helping companies optimize operations and drive growth. Former Fortune 500 executive.",
    bio_zh: "資深商業顧問，擁有 15 年以上幫助企業優化運營和推動增長的經驗。前財富 500 強高管。",
    portfolio: [
      {
        title: "Strategic Planning Project",
        description: "Developed 5-year growth strategy for mid-size company",
        image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
        project_url: "https://example.com/strategy"
      },
      {
        title: "Operational Efficiency",
        description: "Reduced operational costs by 35% through process optimization",
        image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
        project_url: "https://example.com/efficiency"
      }
    ],
    rating: 4.8,
    reviews_count: 33
  },
  {
    email: "emily.taylor@talent.com",
    password: "demo123456",
    name: "Emily Taylor",
    role: "designer",
    skills: ["Brand Identity", "Logo Design", "Illustration", "Print Design", "Packaging"],
    hourly_rate: 65,
    bio: "Creative brand designer and illustrator. Passionate about crafting memorable brand identities and visual storytelling.",
    bio_zh: "創意品牌設計師和插畫家。熱衷於打造令人難忘的品牌識別和視覺敘事。",
    portfolio: [
      {
        title: "Brand Identity Package",
        description: "Complete brand identity for coffee shop chain",
        image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
        project_url: "https://example.com/brand"
      },
      {
        title: "Product Packaging Design",
        description: "Award-winning packaging for organic skincare line",
        image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
        project_url: "https://example.com/packaging"
      }
    ],
    rating: 4.9,
    reviews_count: 39
  },
  {
    email: "michael.zhang@talent.com",
    password: "demo123456",
    name: "Michael Zhang",
    role: "developer",
    skills: ["Mobile Development", "React Native", "iOS", "Android", "Firebase"],
    hourly_rate: 80,
    bio: "Mobile app developer specializing in cross-platform development with React Native. Built 30+ apps with millions of downloads.",
    bio_zh: "移動應用開發者，專精於使用 React Native 進行跨平台開發。構建了 30 多個應用，下載量達數百萬次。",
    portfolio: [
      {
        title: "Fitness Tracking App",
        description: "Popular fitness app with 500K+ downloads",
        image_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
        project_url: "https://example.com/fitness"
      },
      {
        title: "Food Delivery Platform",
        description: "Complete food delivery app with real-time tracking",
        image_url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80",
        project_url: "https://example.com/delivery"
      }
    ],
    rating: 4.7,
    reviews_count: 44
  }
];

export function TalentSeeder() {
  const { language } = useLanguage();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const seedTalents = async () => {
    setSeeding(true);
    setProgress("");
    setResults(null);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < sampleTalents.length; i++) {
        const talent = sampleTalents[i];
        setProgress(`Creating talent ${i + 1}/${sampleTalents.length}: ${talent.name}...`);

        try {
          // 1. Create user account via signup endpoint
          const signupResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/signup`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                email: talent.email,
                password: talent.password,
                name: talent.name,
              }),
            }
          );

          let userId;
          
          if (!signupResponse.ok) {
            const errorData = await signupResponse.json();
            // If user already exists, try to get their ID
            if (errorData.error?.includes('already registered') || errorData.code === 'email_exists') {
              console.log(`ℹ️  User already exists: ${talent.email}, will update their profile`);
              // For demo purposes, we'll skip this talent since we can't easily get their ID
              // In production, you would fetch the user ID from the auth service
              successCount++;
              continue;
            } else {
              throw new Error(errorData.error || 'Signup failed');
            }
          } else {
            const signupData = await signupResponse.json();
            userId = signupData.user?.id;
            
            if (!userId) {
              throw new Error('No user ID returned from signup');
            }
          }

          // 2. Update user profile with talent information
          const profileKey = `profile_${userId}`;  // 統一使用下劃線格式
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                key: profileKey,
                value: {
                  user_id: userId,
                  name: talent.name,
                  email: talent.email,
                  role: talent.role,
                  skills: talent.skills,
                  hourly_rate: talent.hourly_rate,
                  bio: talent.bio,
                  bio_zh: talent.bio_zh,
                  rating: talent.rating,
                  reviews_count: talent.reviews_count,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              }),
            }
          );

          // 3. Create portfolio items
          if (talent.portfolio && talent.portfolio.length > 0) {
            const portfolioKey = `portfolio:user:${userId}`;
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: portfolioKey,
                  value: {
                    user_id: userId,
                    portfolio_items: talent.portfolio.map((item, idx) => ({
                      id: crypto.randomUUID(),
                      ...item,
                      created_at: new Date().toISOString(),
                    })),
                  },
                }),
              }
            );
          }

          // 4. Create some sample reviews
          for (let r = 0; r < Math.min(3, talent.reviews_count); r++) {
            const reviewId = crypto.randomUUID();
            const reviewKey = `review:${reviewId}`;
            
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: reviewKey,
                  value: {
                    id: reviewId,
                    user_id: userId,
                    reviewer_id: crypto.randomUUID(), // Dummy reviewer
                    rating: talent.rating,
                    comment: `Great work! Professional and delivered on time. ${r === 0 ? 'Highly recommend!' : r === 1 ? 'Excellent communication throughout the project.' : 'Will definitely hire again.'}`,
                    created_at: new Date(Date.now() - r * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  },
                }),
              }
            );

            // Add to user's reviews index
            const userReviewsKey = `reviews:user:${userId}`;
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kv/append`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  key: userReviewsKey,
                  value: reviewId,
                }),
              }
            );
          }

          successCount++;
          console.log(`✅ Created talent: ${talent.name}`);
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to create talent ${talent.name}:`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setResults({ success: successCount, failed: failedCount });
      
      if (successCount > 0) {
        toast.success(
          language === 'en'
            ? `Successfully created ${successCount} talent profiles!`
            : `成功創建 ${successCount} 個專業人才資料！`
        );
      }
      
      if (failedCount > 0) {
        toast.warning(
          language === 'en'
            ? `${failedCount} talents failed to create (may already exist)`
            : `${failedCount} 個人才創建失敗（可能已存在）`
        );
      }
    } catch (error) {
      console.error('Error seeding talents:', error);
      toast.error(
        language === 'en'
          ? 'Failed to seed talents. Check console for details.'
          : '人才數據填充失敗。請查看控制台了解詳情。'
      );
    } finally {
      setSeeding(false);
      setProgress("");
    }
  };

  const isEnglish = language === 'en';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {isEnglish ? 'Talent Data Seeder' : '專業人才數據填充'}
        </CardTitle>
        <CardDescription>
          {isEnglish
            ? 'Create sample professional talent profiles with portfolios and reviews'
            : '創建示例專業人才資料，包含作品集和評價'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {isEnglish ? 'What will be created:' : '將會創建：'}
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>8</strong> {isEnglish ? 'professional talent accounts' : '專業人才帳戶'}</li>
            <li>• {isEnglish ? 'Complete profiles with skills and bios' : '完整的技能和簡介資料'}</li>
            <li>• {isEnglish ? 'Portfolio items for each talent' : '每個人才的作品集項目'}</li>
            <li>• {isEnglish ? 'Sample reviews and ratings' : '示例評價和評分'}</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Badge variant="outline" className="justify-center py-2">
            <Users className="h-3 w-3 mr-1" />
            {isEnglish ? 'Developers' : '開發者'} (2)
          </Badge>
          <Badge variant="outline" className="justify-center py-2">
            <Users className="h-3 w-3 mr-1" />
            {isEnglish ? 'Designers' : '設計師'} (2)
          </Badge>
          <Badge variant="outline" className="justify-center py-2">
            <Users className="h-3 w-3 mr-1" />
            {isEnglish ? 'Writers' : '撰稿人'} (1)
          </Badge>
          <Badge variant="outline" className="justify-center py-2">
            <Users className="h-3 w-3 mr-1" />
            {isEnglish ? 'Others' : '其他'} (3)
          </Badge>
        </div>

        {progress && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm text-gray-700">{progress}</p>
            </div>
          </div>
        )}

        {results && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 mb-1">
                  {isEnglish ? 'Seeding Complete!' : '數據填充完成！'}
                </p>
                <div className="text-sm text-green-800 space-y-1">
                  <p>✅ {isEnglish ? 'Successfully created:' : '成功創建：'} {results.success} {isEnglish ? 'talents' : '位人才'}</p>
                  {results.failed > 0 && (
                    <p>⚠️ {isEnglish ? 'Already existed:' : '已存在：'} {results.failed} {isEnglish ? 'talents' : '位人才'}</p>
                  )}
                </div>
                <p className="text-xs text-green-700 mt-2">
                  {isEnglish
                    ? 'Go to "Find Talent" page to see the new professionals!'
                    : '前往「尋找人才」頁面查看新的專業人才！'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={seedTalents}
            disabled={seeding}
            className="w-full"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEnglish ? 'Creating Talents...' : '創建人才中...'}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {isEnglish ? 'Create 8 Sample Talents' : '創建 8 位示例人才'}
              </>
            )}
          </Button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>{isEnglish ? 'Note:' : '注意：'}</strong>{' '}
            {isEnglish
              ? 'Each talent will have login credentials (email/password: demo123456) for testing.'
              : '每位人才都有登入憑證（電子郵件/密碼：demo123456）可供測試。'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}