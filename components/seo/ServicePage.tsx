/**
 * 服務頁面模板 - SEO 優化
 * 用於生成各類服務的動態頁面
 * 
 * URL 格式: /services/{service-category}/{service-name}
 * 例如: /services/web-development/react-development
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Code, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star,
  Briefcase
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface ServicePageProps {
  category: string;
  serviceName: string;
}

interface ServiceData {
  title: string;
  description: string;
  keywords: string[];
  pricing: {
    min: number;
    max: number;
    currency: string;
  };
  duration: string;
  skills: string[];
  benefits: string[];
  process: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  relatedServices: string[];
  avgRating: number;
  totalProjects: number;
}

export function ServicePage({ category, serviceName }: ServicePageProps) {
  const { language } = useLanguage();
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, [category, serviceName]);

  useEffect(() => {
    if (service) {
      injectSchemaData();
    }
  }, [service]);

  const loadServiceData = async () => {
    // TODO: 從後端 API 獲取服務數據
    // 這裡先使用靜態數據作為示例
    const mockData: ServiceData = {
      title: formatServiceName(serviceName),
      description: `專業的${formatServiceName(serviceName)}服務，由經驗豐富的自由工作者提供。`,
      keywords: [serviceName, category, '自由工作者', '外包', '接案'],
      pricing: {
        min: 5000,
        max: 50000,
        currency: 'TWD'
      },
      duration: '1-4 週',
      skills: ['React', 'TypeScript', 'Node.js'],
      benefits: [
        '專業團隊執行',
        '準時交付',
        '品質保證',
        '售後支援'
      ],
      process: [
        '需求分析與評估',
        '提案與報價',
        '合約簽訂',
        '專案執行',
        '驗收與交付'
      ],
      faq: [
        {
          question: `${formatServiceName(serviceName)}的費用如何計算？`,
          answer: '費用根據專案規模、複雜度和工期而定，一般從 NT$5,000 起。'
        },
        {
          question: '需要多長時間完成？',
          answer: '一般專案需要 1-4 週，具體取決於需求的複雜程度。'
        }
      ],
      relatedServices: [],
      avgRating: 4.8,
      totalProjects: 156
    };

    setService(mockData);
    setLoading(false);
  };

  const formatServiceName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const injectSchemaData = () => {
    if (!service) return;

    // Service Schema
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.description,
      provider: {
        '@type': 'Organization',
        name: 'CaseWHR',
        url: 'https://casewhr.com'
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: service.pricing.currency,
        lowPrice: service.pricing.min,
        highPrice: service.pricing.max
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: service.avgRating,
        reviewCount: service.totalProjects
      }
    };

    // FAQ Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: service.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首頁',
          item: 'https://casewhr.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: '服務',
          item: 'https://casewhr.com/services'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: formatServiceName(category),
          item: `https://casewhr.com/services/${category}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: service.title,
          item: `https://casewhr.com/services/${category}/${serviceName}`
        }
      ]
    };

    // 插入 Schema
    const insertSchema = (id: string, schema: object) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    insertSchema('schema-service', serviceSchema);
    insertSchema('schema-faq', faqSchema);
    insertSchema('schema-breadcrumb', breadcrumbSchema);

    // Update meta tags
    document.title = `${service.title} | CaseWHR 專業接案平台`;
    
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}=\"${name}\"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    setMeta('description', service.description);
    setMeta('keywords', service.keywords.join(', '));
    setMeta('og:title', `${service.title} | CaseWHR`, true);
    setMeta('og:description', service.description, true);
  };

  if (loading || !service) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">首頁</a>
          <span className="mx-2">/</span>
          <a href="/services" className="hover:text-blue-600">服務</a>
          <span className="mx-2">/</span>
          <a href={`/services/${category}`} className="hover:text-blue-600">
            {formatServiceName(category)}
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{service.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {service.title}
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            {service.description}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-semibold">{service.avgRating}</span>
              <span className="text-gray-600">({service.totalProjects} 個專案)</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold">
                NT${service.pricing.min.toLocaleString()} - NT${service.pricing.max.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>{service.duration}</span>
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2">
            {service.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Benefits */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                服務優勢
              </h2>
              <ul className="space-y-3">
                {service.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Process */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                服務流程
              </h2>
              <ol className="space-y-4">
                {service.process.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <span className="text-gray-800">{step}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            {/* FAQ */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">常見問題</h2>
              <div className="space-y-6">
                {service.faq.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-700">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <h3 className="text-xl font-bold mb-3">
                立即發布專案
              </h3>
              <p className="mb-4 text-blue-100">
                找到最適合的專業人才，開始您的專案
              </p>
              <Button 
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/?view=post-project'}
              >
                免費發布專案
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            {/* Skills Required */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                所需技能
              </h3>
              <div className="flex flex-wrap gap-2">
                {service.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Find Freelancers */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                瀏覽專業人才
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                查看提供此服務的自由工作者
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/talents'}
              >
                查看人才
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicePage;
