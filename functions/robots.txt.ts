// Cloudflare Pages Function - Robots.txt
// 此文件會自動處理 /robots.txt 請求

export async function onRequest() {
  try {
    // 從 Supabase 後端 API 獲取 robots.txt
    const response = await fetch(
      'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/robots.txt'
    );
    
    const text = await response.text();
    
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // 錯誤回退
    return new Response('Error loading robots.txt', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}