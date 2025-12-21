/**
 * Vercel Serverless Function for robots.txt
 * 
 * This function handles requests to /robots.txt by serving the robots.txt content directly.
 * It bypasses any SPA routing issues and ensures robots.txt is always accessible.
 */

export default function handler(req, res) {
  // Set proper headers for robots.txt
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  // robots.txt content
  const robotsTxt = `# CaseWhr.com - 全球專業接案平台
# Robots.txt for casewhr.com

User-agent: *
Allow: /

# 允許所有搜索引擎訪問
Allow: /projects
Allow: /talents
Allow: /pricing
Allow: /about
Allow: /blog

# 禁止訪問管理後台
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/

# 禁止訪問私密頁面
Disallow: /settings/
Disallow: /profile/edit

# Sitemap location
Sitemap: https://casewhr.com/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`;

  // Return robots.txt content
  res.status(200).send(robotsTxt);
}
