import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../lib/LanguageContext';

// 示例人才数据 - 每个类别都有对应的专业人才
const sampleTalents = [
  // 開發與IT - Development & IT
  {
    email: 'john.dev@example.com',
    full_name: 'John Chen',
    job_title: 'Full Stack Developer',
    bio: 'Experienced full-stack developer specializing in React, Node.js, and cloud architecture. 8+ years of experience building scalable web applications.',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Development'],
    company: 'Tech Solutions Inc.',
    website: 'https://johnchen.dev',
    account_type: ['freelancer']
  },
  {
    email: 'sarah.backend@example.com',
    full_name: 'Sarah Wang',
    job_title: 'Backend Developer',
    bio: 'Backend specialist with expertise in microservices architecture and API development. Passionate about clean code and system design.',
    skills: ['Python', 'Django', 'Docker', 'Kubernetes', 'MongoDB', 'Development'],
    company: 'Cloud Systems',
    account_type: ['freelancer']
  },
  {
    email: 'mike.mobile@example.com',
    full_name: 'Mike Liu',
    job_title: 'Mobile Developer',
    bio: 'iOS and Android developer with 6 years of experience. Specialized in React Native and Flutter for cross-platform development.',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Development', 'Mobile'],
    account_type: ['freelancer']
  },

  // 設計與創意 - Design & Creative
  {
    email: 'emily.design@example.com',
    full_name: 'Emily Zhang',
    job_title: 'UI/UX Designer',
    bio: 'Creative UI/UX designer focused on user-centered design. Expert in Figma, Adobe XD, and prototyping tools.',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'Design', 'UX Research'],
    company: 'Design Studio',
    website: 'https://emilyzhang.design',
    account_type: ['freelancer']
  },
  {
    email: 'david.graphic@example.com',
    full_name: 'David Lin',
    job_title: 'Graphic Designer',
    bio: 'Versatile graphic designer specializing in branding, illustration, and visual identity. 10+ years of creative experience.',
    skills: ['Illustrator', 'Photoshop', 'InDesign', 'Branding', 'Design', 'Visual Identity'],
    account_type: ['freelancer']
  },

  // 內容與寫作 - Content & Writing
  {
    email: 'lisa.writer@example.com',
    full_name: 'Lisa Chen',
    job_title: 'Content Writer',
    bio: 'Professional content writer specializing in tech, business, and lifestyle topics. SEO-optimized writing with engaging storytelling.',
    skills: ['Content Writing', 'SEO', 'Copywriting', 'Blogging', 'Writing', 'Content Strategy'],
    account_type: ['freelancer']
  },
  {
    email: 'james.copy@example.com',
    full_name: 'James Wu',
    job_title: 'Copywriter',
    bio: 'Creative copywriter with expertise in advertising, marketing campaigns, and brand messaging. Award-winning creative.',
    skills: ['Copywriting', 'Advertising', 'Brand Messaging', 'Writing', 'Marketing Copy'],
    account_type: ['freelancer']
  },

  // 營銷與銷售 - Marketing & Sales
  {
    email: 'anna.marketing@example.com',
    full_name: 'Anna Lee',
    job_title: 'Digital Marketing Specialist',
    bio: 'Data-driven digital marketer with expertise in SEO, SEM, and social media marketing. Proven track record of ROI growth.',
    skills: ['Digital Marketing', 'SEO', 'SEM', 'Google Ads', 'Marketing', 'Analytics'],
    company: 'Marketing Pro',
    account_type: ['freelancer']
  },
  {
    email: 'robert.sales@example.com',
    full_name: 'Robert Huang',
    job_title: 'Sales Consultant',
    bio: 'B2B sales expert with 12 years of experience. Specialized in SaaS sales and strategic account management.',
    skills: ['B2B Sales', 'Account Management', 'Sales Strategy', 'CRM', 'Marketing', 'Sales'],
    account_type: ['freelancer']
  },

  // 視頻與動畫 - Video & Animation
  {
    email: 'tom.video@example.com',
    full_name: 'Tom Chang',
    job_title: 'Video Editor',
    bio: 'Professional video editor specializing in commercial, corporate, and social media content. Expert in Adobe Premiere and After Effects.',
    skills: ['Video Editing', 'Premiere Pro', 'After Effects', 'Color Grading', 'Video', 'Motion Graphics'],
    account_type: ['freelancer']
  },
  {
    email: 'jenny.animator@example.com',
    full_name: 'Jenny Yu',
    job_title: '3D Animator',
    bio: '3D animator and motion designer with expertise in character animation and visual effects. Cinema 4D and Blender specialist.',
    skills: ['3D Animation', 'Cinema 4D', 'Blender', 'Motion Design', 'Video', 'Animation'],
    account_type: ['freelancer']
  },

  // 商業諮詢 - Business Consulting
  {
    email: 'peter.consultant@example.com',
    full_name: 'Peter Tsai',
    job_title: 'Business Consultant',
    bio: 'Strategic business consultant helping companies optimize operations and drive growth. MBA with 15 years of consulting experience.',
    skills: ['Business Strategy', 'Operations', 'Consulting', 'Process Improvement', 'Business', 'Strategic Planning'],
    company: 'Consulting Group',
    account_type: ['freelancer']
  },

  // 數據與分析 - Data & Analytics
  {
    email: 'alex.data@example.com',
    full_name: 'Alex Chen',
    job_title: 'Data Analyst',
    bio: 'Data analyst specializing in business intelligence and data visualization. Expert in SQL, Python, and Tableau.',
    skills: ['Data Analysis', 'SQL', 'Python', 'Tableau', 'Data', 'Business Intelligence'],
    account_type: ['freelancer']
  },
  {
    email: 'sophia.scientist@example.com',
    full_name: 'Sophia Lin',
    job_title: 'Data Scientist',
    bio: 'Data scientist with expertise in machine learning and predictive analytics. PhD in Statistics with industry experience.',
    skills: ['Machine Learning', 'Python', 'R', 'TensorFlow', 'Data Science', 'Data', 'Analytics'],
    account_type: ['freelancer']
  },

  // 客戶支持 - Customer Support
  {
    email: 'kevin.support@example.com',
    full_name: 'Kevin Wang',
    job_title: 'Customer Success Manager',
    bio: 'Customer success professional dedicated to ensuring client satisfaction and retention. Expert in SaaS support and onboarding.',
    skills: ['Customer Support', 'Client Relations', 'Support', 'CRM', 'Customer Success'],
    account_type: ['freelancer']
  },

  // 財務與會計 - Finance & Accounting
  {
    email: 'michelle.finance@example.com',
    full_name: 'Michelle Kuo',
    job_title: 'Financial Analyst',
    bio: 'CPA-certified financial analyst specializing in financial planning, analysis, and reporting. 10+ years in corporate finance.',
    skills: ['Financial Analysis', 'Accounting', 'Excel', 'Finance', 'Financial Planning', 'FP&A'],
    company: 'Finance Corp',
    account_type: ['freelancer']
  },
  {
    email: 'daniel.accounting@example.com',
    full_name: 'Daniel Ho',
    job_title: 'Accountant',
    bio: 'Experienced accountant handling bookkeeping, tax preparation, and financial statements. QuickBooks and Xero certified.',
    skills: ['Accounting', 'Bookkeeping', 'Tax Preparation', 'QuickBooks', 'Finance', 'Financial Reporting'],
    account_type: ['freelancer']
  },

  // 法律服務 - Legal Services
  {
    email: 'linda.legal@example.com',
    full_name: 'Linda Chang',
    job_title: 'Legal Consultant',
    bio: 'Corporate lawyer specializing in contract law, intellectual property, and business compliance. 12 years of legal practice.',
    skills: ['Contract Law', 'Legal Consulting', 'Compliance', 'Legal', 'Intellectual Property'],
    company: 'Law Associates',
    account_type: ['freelancer']
  },

  // 人力資源 - Human Resources
  {
    email: 'rachel.hr@example.com',
    full_name: 'Rachel Liao',
    job_title: 'HR Consultant',
    bio: 'Human resources professional specializing in talent acquisition, employee relations, and organizational development.',
    skills: ['HR Management', 'Recruitment', 'Employee Relations', 'Human Resources', 'Talent Acquisition'],
    account_type: ['freelancer']
  },

  // 工程與建築 - Engineering & Architecture
  {
    email: 'victor.engineer@example.com',
    full_name: 'Victor Chen',
    job_title: 'Civil Engineer',
    bio: 'Licensed civil engineer with expertise in structural design and project management. 15 years of engineering experience.',
    skills: ['Civil Engineering', 'Structural Design', 'AutoCAD', 'Engineering', 'Project Management'],
    company: 'Engineering Solutions',
    account_type: ['freelancer']
  },
  {
    email: 'olivia.architect@example.com',
    full_name: 'Olivia Tang',
    job_title: 'Architect',
    bio: 'Award-winning architect specializing in sustainable design and residential projects. Registered architect with international experience.',
    skills: ['Architecture', 'AutoCAD', 'Revit', '3D Modeling', 'Engineering', 'Sustainable Design'],
    account_type: ['freelancer']
  }
];

export function SeedTalentData() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const seedData = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let successCount = 0;
      let skipCount = 0;
      
      // Create profiles for each sample talent
      for (const talent of sampleTalents) {
        try {
          // Create user via signup endpoint
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/signup`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: talent.email,
                password: 'Demo123456!', // Default password for demo
                name: talent.full_name,
                account_type: talent.account_type,
                // Additional profile fields
                job_title: talent.job_title,
                bio: talent.bio,
                skills: talent.skills,
                company: talent.company,
                website: talent.website,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Created profile for ${talent.full_name}`);
            successCount++;
          } else if (response.status === 409) {
            // User already exists - that's ok for demo data
            const data = await response.json();
            if (data.profile_updated) {
              console.log(`✅ Updated existing profile for ${talent.full_name}`);
              successCount++;
            } else {
              console.log(`ℹ️  Profile already exists for ${talent.email}`);
              skipCount++;
            }
          } else {
            // Handle other errors
            try {
              const data = await response.json();
              console.warn(`⚠️  Failed to create profile for ${talent.email}:`, data.error || 'Unknown error');
            } catch {
              console.warn(`⚠️  Failed to create profile for ${talent.email}: HTTP ${response.status}`);
            }
          }
        } catch (err) {
          console.warn(`❌ Failed to create talent ${talent.full_name}:`, err);
        }
      }

      console.log(`✅ Seed complete: ${successCount} created, ${skipCount} skipped`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-start gap-4">
        <Database className="h-8 w-8 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="mb-2">
            {language === 'en' ? 'Seed Sample Talent Data' : '建立示例人才資料'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'en' 
              ? `Click the button below to create ${sampleTalents.length} sample freelancer profiles across all 12 professional categories. This will help demonstrate the category filtering feature.`
              : `點擊下方按鈕建立 ${sampleTalents.length} 個示例自由工作者檔案，涵蓋所有 12 個專業類別。這將有助於展示類別篩選功能。`
            }
          </p>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                {language === 'en' 
                  ? 'Sample data created successfully! Refresh the page to see the talents.'
                  : '示例資料建立成功！重新整理頁面以查看人才。'
                }
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <Button
            onClick={seedData}
            disabled={loading || success}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'en' ? 'Creating Profiles...' : '建立檔案中...'}
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {language === 'en' ? 'Data Seeded' : '資料已建立'}
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {language === 'en' ? 'Create Sample Talents' : '建立示例人才'}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 mt-2">
            {language === 'en'
              ? 'Note: This will create sample profiles. You can delete them later from the admin panel.'
              : '注意：這將建立示例檔案。您可以稍後從管理員面板中刪除它們。'
            }
          </p>
        </div>
      </div>
    </Card>
  );
}