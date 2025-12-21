export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const robotsTxt = `User-agent: *
Allow: /

Allow: /projects
Allow: /experts
Allow: /pricing
Allow: /about
Allow: /blog

Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/

Disallow: /settings/
Disallow: /profile/edit

Sitemap: https://casewhr.com/sitemap.xml

Crawl-delay: 1
`;

  res.status(200).send(robotsTxt);
}
