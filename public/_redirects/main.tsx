# Netlify Redirects File - Case Where 接得準
# 此文件用於 Netlify 部署的重定向規則

# SEO 文件重定向到 Supabase API
/robots.txt https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/robots.txt 200
/sitemap.xml https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/sitemap.xml 200

# Google Search Console 驗證文件
/google9Ehf9UQIP35HCGnahNU8JKWqxoGAv17ge72yB4t8yWA.html /google9Ehf9UQIP35HCGnahNU8JKWqxoGAv17ge72yB4t8yWA.html 200

# SPA 路由 - 必須放在最後
/* /index.html 200