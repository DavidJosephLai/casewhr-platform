/**
 * Whitepaper Download API Routes
 * 白皮書下載 API 路由
 */

import * as kv from './kv_store.tsx';

export function registerWhitepaperRoutes(app: any) {
  
  // Log whitepaper download
  app.post("/make-server-215f78a5/whitepaper-download", async (c: any) => {
    try {
      const body = await c.req.json();
      const { name, email, company, language, downloaded_at } = body;

      // Generate unique ID for download record
      const downloadId = `whitepaper_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store download record
      await kv.set(downloadId, {
        id: downloadId,
        name,
        email,
        company,
        language,
        downloaded_at,
        user_agent: c.req.header('user-agent') || 'Unknown',
      });

      console.log(`📄 [WHITEPAPER] Download logged: ${email} (${language})`);

      return c.json({ success: true, download_id: downloadId });
    } catch (error) {
      console.error('Error logging whitepaper download:', error);
      return c.json({ error: 'Failed to log download' }, 500);
    }
  });

  // Get whitepaper download stats (admin only)
  app.get("/make-server-215f78a5/admin/whitepaper-stats", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      // Get all download records
      const downloads = await kv.getByPrefix('whitepaper_download_') || [];

      // Calculate stats
      const totalDownloads = downloads.length;
      const uniqueEmails = new Set(downloads.map((d: any) => d.email)).size;
      
      const languageBreakdown = downloads.reduce((acc: any, d: any) => {
        acc[d.language] = (acc[d.language] || 0) + 1;
        return acc;
      }, {});

      const recentDownloads = downloads
        .sort((a: any, b: any) => 
          new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime()
        )
        .slice(0, 10);

      return c.json({
        stats: {
          total_downloads: totalDownloads,
          unique_users: uniqueEmails,
          language_breakdown: languageBreakdown,
        },
        recent_downloads: recentDownloads,
      });
    } catch (error) {
      console.error('Error fetching whitepaper stats:', error);
      return c.json({ error: 'Failed to fetch stats' }, 500);
    }
  });

  console.log('✅ [WHITEPAPER] Whitepaper routes registered');
}
