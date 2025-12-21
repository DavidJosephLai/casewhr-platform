import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保 dist 目录存在
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 复制 robots.txt
const robotsSrc = join(__dirname, 'public', 'robots.txt');
const robotsDest = join(__dirname, 'dist', 'robots.txt');

if (existsSync(robotsSrc)) {
  copyFileSync(robotsSrc, robotsDest);
  console.log('✅ robots.txt 已复制到 dist/');
} else {
  console.warn('⚠️  public/robots.txt 不存在');
}

// 复制 sitemap.xml（如果存在）
const sitemapSrc = join(__dirname, 'public', 'sitemap.xml');
const sitemapDest = join(__dirname, 'dist', 'sitemap.xml');

if (existsSync(sitemapSrc)) {
  copyFileSync(sitemapSrc, sitemapDest);
  console.log('✅ sitemap.xml 已复制到 dist/');
}

console.log('✅ Public 文件复制完成！');
