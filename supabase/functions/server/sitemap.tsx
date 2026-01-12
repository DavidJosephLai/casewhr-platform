/**
 * 🗺️ 動態 Sitemap 生成器
 * 自動從數據庫查詢所有公開內容並生成 sitemap.xml
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const sitemapRouter = new Hono();

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    hreflang: string;
    href: string;
  }[];
}

/**
 * 生成 XML URL 條目
 */
function generateURLEntry(url: SitemapURL): string {
  let xml = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n`;
  
  if (url.lastmod) {
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
  }
  
  if (url.changefreq) {
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
  }
  
  if (url.priority !== undefined) {
    xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
  }
  
  // 多語言支持
  if (url.alternates && url.alternates.length > 0) {
    for (const alt of url.alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
    }
  }
  
  xml += `  </url>\n`;
  return xml;
}

/**
 * XML 特殊字符轉義
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成多語言 URL
 */
function generateMultilingualURLs(baseUrl: string, path: string): {
  loc: string;
  alternates: { hreflang: string; href: string }[];
} {
  const languages = ['en', 'zh-TW', 'zh-CN'];
  const defaultLang = 'zh-TW';
  
  const loc = path === '' ? baseUrl : `${baseUrl}${path}`;
  
  const alternates = [
    ...languages.map(lang => ({
      hreflang: lang,
      href: `${loc}?lang=${lang}`,
    })),
    {
      hreflang: 'x-default',
      href: loc,
    },
  ];
  
  return { loc, alternates };
}

/**
 * 獲取所有公開案件
 */
async function getPublicProjects(): Promise<SitemapURL[]> {
  try {
    const projects = await kv.getByPrefix('project_');
    const urls: SitemapURL[] = [];
    
    for (const project of projects) {
      if (project && typeof project === 'object' && 'id' in project) {
        const projectData = project as any;
        
        // 只包含公開的案件
        if (projectData.status === 'open' || projectData.status === 'active') {
          const { loc, alternates } = generateMultilingualURLs(
            'https://casewhr.com',
            `/?project=${projectData.id}`
          );
          
          urls.push({
            loc,
            lastmod: projectData.updated_at || projectData.created_at || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.8,
            alternates,
          });
        }
      }
    }
    
    console.log(`📦 找到 ${urls.length} 個公開案件`);
    return urls;
  } catch (error) {
    console.error('❌ 獲取案件失敗:', error);
    return [];
  }
}

/**
 * 獲取所有公開用戶資料
 */
async function getPublicProfiles(): Promise<SitemapURL[]> {
  try {
    const profiles = await kv.getByPrefix('profile_');
    const urls: SitemapURL[] = [];
    
    for (const profile of profiles) {
      if (profile && typeof profile === 'object' && 'id' in profile) {
        const profileData = profile as any;
        
        // 只包含公開的用戶資料
        if (profileData.is_public || profileData.visibility === 'public') {
          const { loc, alternates } = generateMultilingualURLs(
            'https://casewhr.com',
            `/?profile=${profileData.id}`
          );
          
          urls.push({
            loc,
            lastmod: profileData.updated_at || new Date().toISOString().split('T')[0],
            changefreq: 'monthly',
            priority: 0.6,
            alternates,
          });
        }
      }
    }
    
    console.log(`👤 找到 ${urls.length} 個公開用戶資料`);
    return urls;
  } catch (error) {
    console.error('❌ 獲取用戶資料失敗:', error);
    return [];
  }
}

/**
 * 獲取所有服務分類
 */
function getServiceCategories(): SitemapURL[] {
  const categories = [
    'web-development',
    'mobile-development',
    'design',
    'marketing',
    'writing',
    'data-science',
    'video-animation',
    'music-audio',
    'programming',
    'business',
  ];
  
  const urls: SitemapURL[] = categories.map(category => {
    const { loc, alternates } = generateMultilingualURLs(
      'https://casewhr.com',
      `/?category=${category}`
    );
    
    return {
      loc,
      changefreq: 'weekly',
      priority: 0.7,
      alternates,
    };
  });
  
  console.log(`🏷️ 找到 ${urls.length} 個服務分類`);
  return urls;
}

/**
 * 獲取靜態頁面
 */
function getStaticPages(): SitemapURL[] {
  const baseUrl = 'https://casewhr.com';
  const pages = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: '/pricing', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/api-documentation', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/privacy-policy', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/cookies-policy', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/terms-of-service', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/disclaimer', priority: 0.4, changefreq: 'yearly' as const },
  ];
  
  const urls: SitemapURL[] = pages.map(page => {
    const { loc, alternates } = generateMultilingualURLs(baseUrl, page.path);
    
    return {
      loc,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
      alternates,
    };
  });
  
  console.log(`📄 找到 ${urls.length} 個靜態頁面`);
  return urls;
}

/**
 * 生成完整的 sitemap.xml
 */
sitemapRouter.get('/generate', async (c) => {
  try {
    console.log('🗺️ 開始生成動態 sitemap...');
    
    // 收集所有 URL
    const [staticPages, projects, profiles, categories] = await Promise.all([
      Promise.resolve(getStaticPages()),
      getPublicProjects(),
      getPublicProfiles(),
      Promise.resolve(getServiceCategories()),
    ]);
    
    const allUrls = [...staticPages, ...projects, ...profiles, ...categories];
    
    console.log(`✅ 總共找到 ${allUrls.length} 個 URL`);
    
    // 生成 XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    
    for (const url of allUrls) {
      xml += generateURLEntry(url);
    }
    
    xml += '</urlset>';
    
    // 返回 XML（帶正確的 Content-Type）
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 緩存 1 小時
      },
    });
  } catch (error) {
    console.error('❌ 生成 sitemap 失敗:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * 獲取 sitemap 統計信息
 */
sitemapRouter.get('/stats', async (c) => {
  try {
    const [staticPages, projects, profiles, categories] = await Promise.all([
      Promise.resolve(getStaticPages()),
      getPublicProjects(),
      getPublicProfiles(),
      Promise.resolve(getServiceCategories()),
    ]);
    
    return c.json({
      success: true,
      stats: {
        total: staticPages.length + projects.length + profiles.length + categories.length,
        staticPages: staticPages.length,
        projects: projects.length,
        profiles: profiles.length,
        categories: categories.length,
      },
      lastGenerated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 獲取統計信息失敗:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export { sitemapRouter };
