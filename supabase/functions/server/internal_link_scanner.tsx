/**
 * 🔗 內部連結掃描服務
 * 自動掃描網站並提取所有內部連結
 */

import * as kv from "./kv_store.tsx";

interface InternalLink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'navigation' | 'contextual' | 'footer' | 'sidebar';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'broken' | 'redirect';
  clicks?: number;
  lastChecked: string;
  statusCode?: number;
}

interface ScanProgress {
  status: 'scanning' | 'completed' | 'error';
  pagesScanned: number;
  linksFound: number;
  currentPage?: string;
  error?: string;
}

/**
 * 掃描網站並提取所有內部連結
 */
export async function scanWebsite(baseUrl: string): Promise<{
  links: InternalLink[];
  progress: ScanProgress;
}> {
  console.log(`🔍 [LINK SCANNER] Starting scan for ${baseUrl}`);
  
  const links: InternalLink[] = [];
  const visitedUrls = new Set<string>();
  const urlsToVisit: string[] = [baseUrl];
  
  const progress: ScanProgress = {
    status: 'scanning',
    pagesScanned: 0,
    linksFound: 0,
  };
  
  // 限制掃描深度和數量，避免無限循環
  const MAX_PAGES = 50;
  const MAX_DEPTH = 3;
  
  try {
    while (urlsToVisit.length > 0 && visitedUrls.size < MAX_PAGES) {
      const currentUrl = urlsToVisit.shift()!;
      
      if (visitedUrls.has(currentUrl)) continue;
      visitedUrls.add(currentUrl);
      
      progress.currentPage = currentUrl;
      progress.pagesScanned = visitedUrls.size;
      
      console.log(`📄 [LINK SCANNER] Scanning page ${progress.pagesScanned}/${MAX_PAGES}: ${currentUrl}`);
      
      try {
        // 獲取頁面內容
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'CaseWHR-Link-Scanner/1.0',
          },
        });
        
        if (!response.ok) {
          console.log(`⚠️ [LINK SCANNER] Failed to fetch ${currentUrl}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        
        // 提取所有連結
        const foundLinks = extractLinksFromHTML(html, currentUrl, baseUrl);
        
        // 添加到結果
        links.push(...foundLinks);
        progress.linksFound = links.length;
        
        // 將新發現的內部連結加入待訪問列表
        for (const link of foundLinks) {
          const fullUrl = normalizeUrl(link.targetUrl, baseUrl);
          if (
            fullUrl.startsWith(baseUrl) &&
            !visitedUrls.has(fullUrl) &&
            !urlsToVisit.includes(fullUrl)
          ) {
            urlsToVisit.push(fullUrl);
          }
        }
        
      } catch (error) {
        console.error(`❌ [LINK SCANNER] Error scanning ${currentUrl}:`, error);
      }
    }
    
    progress.status = 'completed';
    console.log(`✅ [LINK SCANNER] Scan completed: ${progress.pagesScanned} pages, ${progress.linksFound} links`);
    
    // 儲存到資料庫
    await saveLinksToDatabase(links);
    
    return { links, progress };
    
  } catch (error: any) {
    console.error('❌ [LINK SCANNER] Scan failed:', error);
    progress.status = 'error';
    progress.error = error.message;
    return { links, progress };
  }
}

/**
 * 從 HTML 中提取連結
 */
function extractLinksFromHTML(html: string, sourceUrl: string, baseUrl: string): InternalLink[] {
  const links: InternalLink[] = [];
  
  // 使用正則表達式提取 <a> 標籤
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const anchorText = match[2]
      .replace(/<[^>]*>/g, '') // 移除 HTML 標籤
      .trim()
      .substring(0, 200); // 限制長度
    
    // 跳過空連結、錨點連結和 JavaScript 連結
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      continue;
    }
    
    // 標準化 URL
    const targetUrl = normalizeUrl(href, baseUrl);
    
    // 只保留內部連結
    if (!targetUrl.startsWith(baseUrl)) {
      continue;
    }
    
    // 判斷連結類型
    const linkType = determineLinkType(html, match.index);
    
    // 判斷優先級
    const priority = determinePriority(sourceUrl, targetUrl, anchorText);
    
    links.push({
      id: generateLinkId(sourceUrl, targetUrl),
      sourceUrl: cleanUrl(sourceUrl, baseUrl),
      targetUrl: cleanUrl(targetUrl, baseUrl),
      anchorText: anchorText || '(無文字)',
      linkType,
      priority,
      status: 'active',
      lastChecked: new Date().toISOString(),
    });
  }
  
  return links;
}

/**
 * 標準化 URL
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    // 如果是相對路徑，轉換為絕對路徑
    if (url.startsWith('/')) {
      return baseUrl + url;
    }
    
    // 如果已經是完整 URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 相對路徑（如 ../page 或 page）
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * 清理 URL（移除 baseUrl 前綴，只保留路徑）
 */
function cleanUrl(url: string, baseUrl: string): string {
  if (url.startsWith(baseUrl)) {
    return url.substring(baseUrl.length) || '/';
  }
  return url;
}

/**
 * 判斷連結類型
 */
function determineLinkType(html: string, linkPosition: number): InternalLink['linkType'] {
  // 簡化版：檢查連結周圍的 HTML 結構
  const context = html.substring(Math.max(0, linkPosition - 200), linkPosition + 200).toLowerCase();
  
  if (context.includes('<nav') || context.includes('class="nav')) {
    return 'navigation';
  }
  
  if (context.includes('<footer') || context.includes('class="footer')) {
    return 'footer';
  }
  
  if (context.includes('<aside') || context.includes('sidebar')) {
    return 'sidebar';
  }
  
  return 'contextual';
}

/**
 * 判斷連結優先級
 */
function determinePriority(sourceUrl: string, targetUrl: string, anchorText: string): InternalLink['priority'] {
  // 首頁連結優先級高
  if (targetUrl === '/' || sourceUrl === '/') {
    return 'high';
  }
  
  // 包含關鍵字的連結優先級高
  const keywords = ['projects', 'talents', 'pricing', 'contact'];
  const targetPath = targetUrl.toLowerCase();
  
  if (keywords.some(kw => targetPath.includes(kw))) {
    return 'high';
  }
  
  // 部落格和功能頁面中等優先級
  if (targetPath.includes('blog') || targetPath.includes('features')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * 生成連結 ID
 */
function generateLinkId(sourceUrl: string, targetUrl: string): string {
  const str = `${sourceUrl}→${targetUrl}`;
  // 簡單的哈希函數
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `link_${Math.abs(hash).toString(36)}`;
}

/**
 * 檢查連結狀態
 */
export async function checkLinkStatus(url: string, baseUrl: string): Promise<{
  status: 'active' | 'broken' | 'redirect';
  statusCode: number;
}> {
  try {
    const fullUrl = normalizeUrl(url, baseUrl);
    const response = await fetch(fullUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'CaseWHR-Link-Checker/1.0',
      },
    });
    
    const statusCode = response.status;
    
    if (statusCode >= 200 && statusCode < 300) {
      return { status: 'active', statusCode };
    } else if (statusCode >= 300 && statusCode < 400) {
      return { status: 'redirect', statusCode };
    } else {
      return { status: 'broken', statusCode };
    }
  } catch (error) {
    console.error(`Failed to check link ${url}:`, error);
    return { status: 'broken', statusCode: 0 };
  }
}

/**
 * 批量檢查連結狀態
 */
export async function checkAllLinks(baseUrl: string): Promise<InternalLink[]> {
  console.log('🔍 [LINK CHECKER] Checking all links...');
  
  const linksData = await kv.get('seo:internal_links');
  if (!linksData || !Array.isArray(linksData)) {
    console.log('⚠️ [LINK CHECKER] No links found in database');
    return [];
  }
  
  const links: InternalLink[] = linksData;
  const updatedLinks: InternalLink[] = [];
  
  for (const link of links) {
    const { status, statusCode } = await checkLinkStatus(link.targetUrl, baseUrl);
    
    updatedLinks.push({
      ...link,
      status,
      statusCode,
      lastChecked: new Date().toISOString(),
    });
  }
  
  await kv.set('seo:internal_links', updatedLinks);
  console.log(`✅ [LINK CHECKER] Checked ${updatedLinks.length} links`);
  
  return updatedLinks;
}

/**
 * 儲存連結到資料庫
 */
async function saveLinksToDatabase(links: InternalLink[]): Promise<void> {
  try {
    await kv.set('seo:internal_links', links);
    await kv.set('seo:internal_links_updated_at', new Date().toISOString());
    console.log(`✅ [LINK SCANNER] Saved ${links.length} links to database`);
  } catch (error) {
    console.error('❌ [LINK SCANNER] Failed to save links:', error);
  }
}

/**
 * 獲取儲存的連結
 */
export async function getSavedLinks(): Promise<InternalLink[]> {
  const links = await kv.get('seo:internal_links');
  return Array.isArray(links) ? links : [];
}

/**
 * 生成連結機會建議
 */
export async function generateLinkOpportunities(): Promise<any[]> {
  const links = await getSavedLinks();
  
  // 簡化版：基於現有連結生成建議
  const opportunities = [
    {
      id: 'opp_1',
      sourcePage: '/blog',
      targetPage: '/projects',
      suggestedAnchor: '瀏覽接案專案',
      relevanceScore: 92,
      reason: '部落格文章可以引導讀者到專案列表',
    },
    {
      id: 'opp_2',
      sourcePage: '/pricing',
      targetPage: '/talents',
      suggestedAnchor: '尋找專業人才',
      relevanceScore: 88,
      reason: '定價頁面應該連結到人才市場',
    },
  ];
  
  return opportunities;
}

/**
 * 分析單個頁面
 */
export async function analyzePage(url: string, baseUrl: string): Promise<{
  url: string;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  linkDepth: number;
  pageAuthority: number;
}> {
  console.log(`📊 [PAGE ANALYZER] Analyzing page: ${url}`);
  
  try {
    const fullUrl = normalizeUrl(url, baseUrl);
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 提取所有連結
    const allLinks = extractLinksFromHTML(html, fullUrl, baseUrl);
    const externalLinks = countExternalLinks(html, baseUrl);
    
    // 檢查損壞的連結
    let brokenCount = 0;
    for (const link of allLinks.slice(0, 10)) { // 只檢查前 10 個
      const { status } = await checkLinkStatus(link.targetUrl, baseUrl);
      if (status === 'broken') brokenCount++;
    }
    
    return {
      url: cleanUrl(fullUrl, baseUrl),
      internalLinks: allLinks.length,
      externalLinks,
      brokenLinks: brokenCount,
      linkDepth: calculateLinkDepth(url),
      pageAuthority: calculatePageAuthority(allLinks.length, externalLinks),
    };
  } catch (error) {
    console.error(`❌ [PAGE ANALYZER] Failed to analyze ${url}:`, error);
    throw error;
  }
}

/**
 * 計算外部連結數量
 */
function countExternalLinks(html: string, baseUrl: string): number {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/gi;
  let count = 0;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http') && !href.startsWith(baseUrl)) {
      count++;
    }
  }
  
  return count;
}

/**
 * 計算連結深度
 */
function calculateLinkDepth(url: string): number {
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  return path.split('/').filter(p => p.length > 0).length;
}

/**
 * 計算頁面權重
 */
function calculatePageAuthority(internalLinks: number, externalLinks: number): number {
  // 簡化的計算方式
  const score = Math.min(100, (internalLinks * 2) + (externalLinks * 0.5));
  return Math.round(score);
}
