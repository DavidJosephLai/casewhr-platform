/**
 * Vercel Serverless Function for sitemap.xml
 * 
 * This function generates a dynamic sitemap.xml for casewhr.com
 * It includes all main pages and ensures proper SEO indexing.
 */

export default function handler(req, res) {
  // Set proper headers for XML sitemap
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  // Get current date in ISO format
  const today = new Date().toISOString().split('T')[0];
  
  // Sitemap XML content
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Homepage -->
  <url>
    <loc>https://casewhr.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Main Pages -->
  <url>
    <loc>https://casewhr.com/projects</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/talents</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Auth Pages -->
  <url>
    <loc>https://casewhr.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/signup</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Help & Support -->
  <url>
    <loc>https://casewhr.com/help</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Legal Pages -->
  <url>
    <loc>https://casewhr.com/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://casewhr.com/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
</urlset>`;

  // Return sitemap XML
  res.status(200).send(sitemapXml);
}
