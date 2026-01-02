// Cloudflare Workers 配置 - Case Where 接得準
// 用於處理 SEO 文件的代理

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 處理 robots.txt
    if (pathname === '/robots.txt') {
      const robotsUrl = 'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/robots.txt';
      const response = await fetch(robotsUrl);
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 處理 sitemap.xml
    if (pathname === '/sitemap.xml') {
      const sitemapUrl = 'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/sitemap.xml';
      const response = await fetch(sitemapUrl);
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 其他請求返回 null，讓 Cloudflare Pages 處理
    return env.ASSETS.fetch(request);
  },
};