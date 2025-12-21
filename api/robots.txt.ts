export const config = {
  runtime: 'edge',
};

export default function handler() {
  const robotsTxt = `# Case Where 接得準 - Robots.txt
# 更新日期: 2024-12-21

# 允許所有搜索引擎爬取
User-agent: *
Allow: /

# 允許重要頁面
Allow: /pricing
Allow: /about
Allow: /terms-of-service
Allow: /privacy-policy

# 禁止爬取私密頁面
Disallow: /dashboard
Disallow: /admin
Disallow: /api/

# 禁止爬取測試頁面
Disallow: /test
Disallow: /*test*.html
Disallow: /brevo-test
Disallow: /email-test
Disallow: /env-check

# Sitemap 位置
Sitemap: https://casewhr.com/sitemap.xml

# 爬蟲速率限制（每次請求間隔 1 秒）
Crawl-delay: 1

# Google 機器人特定規則
User-agent: Googlebot
Allow: /
Disallow: /dashboard
Disallow: /admin

# Bing 機器人特定規則
User-agent: Bingbot
Allow: /
Disallow: /dashboard
Disallow: /admin

# 社交媒體機器人
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
