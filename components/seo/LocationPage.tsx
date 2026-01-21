/**
 * 地區頁面模板 - SEO 優化
 * 用於生成各地區的服務頁面
 * 
 * URL 格式: /locations/{country}/{city}
 * 例如: /locations/taiwan/taipei
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  MapPin, 
  Users, 
  Briefcase, 
  TrendingUp,
  Star,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

interface LocationPageProps {
  country: string;
  city: string;
}

interface LocationData {
  name: string;
  country: string;
  description: string;
  keywords: string[];
  stats: {
    totalFreelancers: number;
    totalProjects: number;
    avgProjectValue: number;
    topCategories: string[];
  };
  popularServices: Array<{
    name: string;
    count: number;
    avgPrice: number;
  }>;
  topFreelancers: Array<{
    name: string;
    rating: number;
    completedProjects: number;
    skills: string[];
  }>;
  benefits: string[];
}

export function LocationPage({ country, city }: LocationPageProps) {
  const { language } = useLanguage();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocationData();
  }, [country, city]);

  useEffect(() => {
    if (location) {
      injectSchemaData();
    }
  }, [location]);

  const loadLocationData = async () => {
    // TODO: 從後端 API 獲取地區數據
    const mockData: LocationData = {
      name: formatCityName(city),
      country: formatCountryName(country),
      description: `在${formatCityName(city)}尋找專業的自由工作者和接案機會。CaseWHR 平台連結${formatCityName(city)}地區的企業與人才。`,
      keywords: [
        `${formatCityName(city)}自由工作者`,
        `${formatCityName(city)}接案`,
        `${formatCityName(city)}外包`,
        '遠端工作',
        '專案外包'
      ],
      stats: {
        totalFreelancers: 245,
        totalProjects: 1089,
        avgProjectValue: 25000,
        topCategories: ['網站開發', '移動應用', '設計', '行銷']
      },
      popularServices: [
        { name: '網站開發', count: 156, avgPrice: 30000 },
        { name: 'UI/UX 設計', count: 98, avgPrice: 20000 },
        { name: '行銷策劃', count: 87, avgPrice: 15000 }
      ],
      topFreelancers: [
        {
          name: '張小明',
          rating: 4.9,
          completedProjects: 45,
          skills: ['React', 'Node.js', 'TypeScript']
        }
      ],
      benefits: [
        '豐富的本地人才資源',
        '熟悉當地市場需求',
        '便於面對面溝通',
        '符合當地法規要求'
      ]
    };

    setLocation(mockData);
    setLoading(false);
  };

  const formatCityName = (name: string) => {
    const cityNames: Record<string, string> = {
      'taipei': '台北',
      'taichung': '台中',
      'kaohsiung': '高雄',
      'tainan': '台南'
    };
    return cityNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  const formatCountryName = (name: string) => {
    const countryNames: Record<string, string> = {
      'taiwan': '台灣',
      'hongkong': '香港',
      'singapore': '新加坡'
    };
    return countryNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  const injectSchemaData = () => {
    if (!location) return;

    // LocalBusiness Schema
    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `CaseWHR ${location.name}`,
      description: location.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: location.name,
        addressCountry: location.country
      },
      url: `https://casewhr.com/locations/${country}/${city}`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        reviewCount: location.stats.totalProjects
      }
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
          name: '地區',
          item: 'https://casewhr.com/locations'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: location.country,
          item: `https://casewhr.com/locations/${country}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: location.name,
          item: `https://casewhr.com/locations/${country}/${city}`
        }
      ]
    };

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

    insertSchema('schema-local-business', localBusinessSchema);
    insertSchema('schema-breadcrumb', breadcrumbSchema);

    // Update meta tags
    document.title = `${location.name}自由工作者與接案平台 | CaseWHR`;
    
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

    setMeta('description', location.description);
    setMeta('keywords', location.keywords.join(', '));
    setMeta('og:title', `${location.name}自由工作者與接案平台 | CaseWHR`, true);
    setMeta('og:description', location.description, true);
  };

  if (loading || !location) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">首頁</a>
          <span className="mx-2">/</span>
          <a href="/locations" className="hover:text-blue-600">地區</a>
          <span className="mx-2">/</span>
          <a href={`/locations/${country}`} className="hover:text-blue-600">
            {location.country}
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{location.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {location.name}自由工作者平台
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {location.description}
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {location.stats.totalFreelancers}+
            </div>
            <div className="text-gray-600">專業人才</div>
          </Card>

          <Card className="p-6 text-center">
            <Briefcase className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {location.stats.totalProjects}+
            </div>
            <div className="text-gray-600">完成專案</div>
          </Card>

          <Card className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              NT${(location.stats.avgProjectValue / 1000).toFixed(0)}K
            </div>
            <div className="text-gray-600">平均專案金額</div>
          </Card>

          <Card className="p-6 text-center">
            <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              4.8
            </div>
            <div className="text-gray-600">平均評分</div>
          </Card>
        </div>

        {/* Popular Services */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">熱門服務類別</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {location.popularServices.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.count} 個專案</p>
                  </div>
                  <Badge variant="outline">{index + 1}</Badge>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">
                    平均 NT${service.avgPrice.toLocaleString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">為什麼選擇{location.name}？</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {location.benefits.map((benefit, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-800">{benefit}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Top Categories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">熱門類別</h2>
          <div className="flex flex-wrap gap-3">
            {location.stats.topCategories.map((category, index) => (
              <Badge key={index} variant="secondary" className="text-base py-2 px-4">
                {category}
              </Badge>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              開始在{location.name}尋找專業人才
            </h2>
            <p className="text-xl mb-6 text-blue-100">
              立即發布您的專案，與{location.stats.totalFreelancers}+位專業人才連結
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/?view=post-project'}
              >
                發布專案
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = '/talents'}
              >
                瀏覽人才
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default LocationPage;
