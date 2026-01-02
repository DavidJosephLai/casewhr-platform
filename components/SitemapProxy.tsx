import { useEffect } from 'react';
import { projectId } from '../utils/supabase/info';

export function SitemapProxy() {
  useEffect(() => {
    // 重定向到 Supabase API 端點
    const sitemapUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sitemap.xml`;
    
    // 使用 fetch 獲取 sitemap 內容
    fetch(sitemapUrl)
      .then(response => response.text())
      .then(xmlContent => {
        // 創建一個新的文檔並替換當前內容
        document.open();
        document.write(xmlContent);
        document.close();
        
        // 設置正確的 content-type
        document.contentType = 'application/xml';
      })
      .catch(error => {
        console.error('Failed to fetch sitemap:', error);
        document.open();
        document.write(`<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to load sitemap</error>`);
        document.close();
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading sitemap...</p>
      </div>
    </div>
  );
}

export function RobotsProxy() {
  useEffect(() => {
    // 重定向到 Supabase API 端點
    const robotsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/robots.txt`;
    
    // 使用 fetch 獲取 robots.txt 內容
    fetch(robotsUrl)
      .then(response => response.text())
      .then(textContent => {
        // 創建一個新的文檔並替換當前內容
        document.open();
        document.write(`<pre>${textContent}</pre>`);
        document.close();
      })
      .catch(error => {
        console.error('Failed to fetch robots.txt:', error);
        document.open();
        document.write('<pre>Failed to load robots.txt</pre>');
        document.close();
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading robots.txt...</p>
      </div>
    </div>
  );
}
