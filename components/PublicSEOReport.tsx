import React, { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  FileText, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Search,
  Award,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface SEOReport {
  id: string;
  report_id: string;
  user_id: string;
  report_type: string;
  target_url: string;
  keywords?: string[];
  analysis_result?: any;
  created_at: string;
  is_public: boolean;
}

export function PublicSEOReport() {
  const [report, setReport] = useState<SEOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 從 URL 獲取報告 ID
  const reportId = window.location.pathname.split('/seo-report/')[1];

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('Invalid report ID');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [PublicSEOReport] Fetching report:', reportId);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/public/seo-report/${reportId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch report');
        }

        const data = await response.json();
        console.log('✅ [PublicSEOReport] Report loaded:', data);
        setReport(data);
      } catch (err: any) {
        console.error('❌ [PublicSEOReport] Error:', err);
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">Loading SEO Report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Report Not Found</CardTitle>
                <CardDescription className="text-red-600">
                  {error || 'The requested SEO report could not be found or is not publicly available.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = report.analysis_result || {};
  const reportType = report.report_type || 'unknown';

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-gray-900">SEO Analysis Report</h1>
          <Badge variant="outline" className="text-sm">
            {new Date(report.created_at).toLocaleDateString()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <ExternalLink className="h-5 w-5" />
          <a 
            href={report.target_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {report.target_url}
          </a>
        </div>
      </div>

      {/* Report Type Badge */}
      <div className="mb-8">
        <Badge className="text-lg px-4 py-2">
          {reportType === 'keyword_research' && '🔑 Keyword Research'}
          {reportType === 'competitor_analysis' && '🎯 Competitor Analysis'}
          {reportType === 'content_optimization' && '✍️ Content Optimization'}
          {reportType === 'technical_seo' && '⚙️ Technical SEO'}
          {!['keyword_research', 'competitor_analysis', 'content_optimization', 'technical_seo'].includes(reportType) && '📊 SEO Analysis'}
        </Badge>
      </div>

      {/* Keywords */}
      {report.keywords && report.keywords.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Target Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SEO Score */}
        {analysis.seo_score !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {analysis.seo_score}/100
              </div>
              <p className="text-gray-600">
                {analysis.seo_score >= 80 && 'Excellent! Your SEO is in great shape.'}
                {analysis.seo_score >= 60 && analysis.seo_score < 80 && 'Good, but there\'s room for improvement.'}
                {analysis.seo_score < 60 && 'Needs attention. Follow the recommendations below.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Traffic Potential */}
        {analysis.traffic_potential !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Traffic Potential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{analysis.traffic_potential}%
              </div>
              <p className="text-gray-600">
                Estimated traffic increase after optimization
              </p>
            </CardContent>
          </Card>
        )}

        {/* Keyword Difficulty */}
        {analysis.keyword_difficulty !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Keyword Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {analysis.keyword_difficulty}/100
              </div>
              <p className="text-gray-600">
                {analysis.keyword_difficulty < 30 && 'Easy - Good opportunity!'}
                {analysis.keyword_difficulty >= 30 && analysis.keyword_difficulty < 70 && 'Medium - Achievable with effort'}
                {analysis.keyword_difficulty >= 70 && 'Hard - Requires strong authority'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search Volume */}
        {analysis.search_volume !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Search Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analysis.search_volume.toLocaleString()}
              </div>
              <p className="text-gray-600">
                Monthly searches
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Follow these suggestions to improve your SEO performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Full Analysis */}
      {analysis.full_analysis && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">
                {analysis.full_analysis}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want Your Own SEO Analysis?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get detailed SEO insights for your website with our AI-powered analysis tools.
              Improve your rankings and drive more organic traffic.
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = '/?view=pricing'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Powered By */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Powered by CaseWHR AI SEO Tools</p>
      </div>
    </div>
  );
}