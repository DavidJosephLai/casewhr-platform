// Cloudflare Pages Function - Sitemap.xml
// 此文件會自動處理 /sitemap.xml 請求

export async function onRequest() {
  try {
    // 從 Supabase 後端 API 獲取 sitemap.xml
    const response = await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/sitemap.xml'
    );
    
    const xml = await response.text();
    
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // 錯誤回退
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Failed to load sitemap</error>', {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}