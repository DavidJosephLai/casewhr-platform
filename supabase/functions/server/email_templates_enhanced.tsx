// ========== 增強版郵件模板 ==========
// 新增更豐富的郵件功能，包含更好的視覺設計、互動元素和個性化內容

// ========== 雙語郵件模板包裝函數 ==========
interface BilingualEmailContent {
  titleEn: string;
  titleZh: string;
  contentEn: string;
  contentZh: string;
  ctaTextEn?: string;
  ctaTextZh?: string;
  ctaUrl?: string;
  theme?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  logoUrl?: string; // Footer LOGO URL（所有用戶）
  headerLogoUrl?: string; // Header LOGO URL（🌟 企業版專屬）
}

export const getBilingualEmailTemplate = (content: BilingualEmailContent): string => {
  const theme = content.theme || 'default';
  const headerClass = theme === 'default' ? '' : theme;
  
  // 使用自定義 LOGO URL 或默認 URL
  const logoUrl = content.logoUrl || 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
  
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.titleZh} | ${content.titleEn}</title>
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${content.headerLogoUrl ? `
            <!-- 🌟 企業版 Header（精緻設計） -->
            <div class="enterprise-header-section">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 50px 40px 30px;">
                    <!-- 企業 LOGO 容器 -->
                    <div style="
                      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                      border-radius: 16px;
                      padding: 32px 40px;
                      margin-bottom: 24px;
                      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                      backdrop-filter: blur(10px);
                      border: 1px solid rgba(255,255,255,0.18);
                    ">
                      <img src="${content.headerLogoUrl}" 
                           alt="Company Logo" 
                           style="
                             max-width: 280px; 
                             height: auto; 
                             display: block;
                             margin: 0 auto;
                             filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
                           " />
                    </div>
                    
                    <!-- Powered by 標籤 -->
                    <div style="
                      display: inline-block;
                      background: rgba(255,255,255,0.12);
                      backdrop-filter: blur(8px);
                      border: 1px solid rgba(255,255,255,0.2);
                      border-radius: 20px;
                      padding: 8px 20px;
                      margin-top: 8px;
                    ">
                      <div style="
                        color: rgba(255,255,255,0.95);
                        font-size: 13px;
                        font-weight: 600;
                        letter-spacing: 0.3px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                      ">
                        <span style="opacity: 0.7;">Powered by</span>
                        <span style="margin: 0 6px; opacity: 0.5;">•</span>
                        <span style="color: #fff;">Case Where 接得準</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            <!-- 企業版內容 Header -->
            <div class="header ${headerClass}" style="padding-top: 36px; padding-bottom: 36px;">
              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 20px 32px;
                margin-bottom: 8px;
                border: 1px solid rgba(255,255,255,0.12);
              ">
                <h1 style="margin: 0; font-size: 32px; line-height: 1.2;">${content.titleZh}</h1>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 15px; opacity: 0.88; letter-spacing: 0.3px;">${content.titleEn}</p>
            </div>
          ` : `
            <!-- 📧 標準版 Header（精緻優化） -->
            <div class="header ${headerClass}">
              <div style="margin-bottom: 20px;">
                <!-- 品牌標題 -->
                <div style="
                  display: inline-block;
                  background: rgba(255,255,255,0.08);
                  border-radius: 12px;
                  padding: 16px 28px;
                  margin-bottom: 16px;
                  border: 1px solid rgba(255,255,255,0.12);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                ">
                  <div style="
                    font-size: 26px; 
                    font-weight: 800; 
                    text-shadow: 0 2px 8px rgba(0,0,0,0.15); 
                    letter-spacing: -0.3px;
                    margin-bottom: 6px;
                  ">
                    Case Where 接得準
                  </div>
                  <div style="
                    font-size: 13px; 
                    opacity: 0.88; 
                    font-weight: 500;
                    letter-spacing: 0.2px;
                  ">
                    連接專業服務人才的最佳平台 | Connecting Professional Talents
                  </div>
                </div>
              </div>
              
              <!-- 分隔線 -->
              <div style="
                height: 2px; 
                background: linear-gradient(90deg, 
                  rgba(255,255,255,0) 0%, 
                  rgba(255,255,255,0.3) 50%, 
                  rgba(255,255,255,0) 100%
                ); 
                margin: 28px 0;
              "></div>
              
              <!-- 郵件標題 -->
              <div style="
                background: rgba(255,255,255,0.06);
                border-radius: 12px;
                padding: 20px 32px;
                display: inline-block;
                border: 1px solid rgba(255,255,255,0.1);
              ">
                <h1 style="margin: 0; font-size: 32px; line-height: 1.2;">${content.titleZh}</h1>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 15px; opacity: 0.88; letter-spacing: 0.3px;">${content.titleEn}</p>
            </div>
          `}
          
          <!-- Main Content -->
          <div class="content">
            <!-- Chinese Content -->
            <div style="margin-bottom: 30px;">
              <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 12px;">🇹🇼 中文版</div>
              ${content.contentZh}
            </div>
            
            <div class="divider"></div>
            
            <!-- English Content -->
            <div style="margin-top: 30px;">
              <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 12px;">🇬🇧 English Version</div>
              ${content.contentEn}
            </div>
            
            <!-- CTA Button -->
            ${content.ctaUrl && content.ctaTextEn && content.ctaTextZh ? `
              <div style="text-align: center; margin-top: 48px; margin-bottom: 24px;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, ${theme === 'info' ? '#3b82f6, #2563eb' : theme === 'success' ? '#10b981, #059669' : theme === 'warning' ? '#f59e0b, #d97706' : theme === 'danger' ? '#ef4444, #dc2626' : '#667eea, #764ba2'}); padding: 18px 50px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); border: 1px solid rgba(255, 255, 255, 0.2);">
                      <a href="${content.ctaUrl}" style="color: #ffffff; text-decoration: none; font-weight: 700; font-size: 17px; display: block; font-family: Arial, sans-serif; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);">
                        ${content.ctaTextZh} | ${content.ctaTextEn}
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer with LOGO -->
          ${getBilingualFooter(logoUrl)}
        </div>
      </div>
    </body>
    </html>
  `;
};

// 雙語頁腳
export const getBilingualFooter = (logoUrl?: string): string => {
  // 預設 LOGO URL
  const defaultLogoUrl = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
  const finalLogoUrl = logoUrl || defaultLogoUrl;
  
  return `
    <div class="footer">
      <!-- 🎯 精緻 LOGO 展示區 -->
      <div style="margin-bottom: 32px;">
        <div style="
          display: inline-block;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
          border-radius: 16px;
          padding: 24px 32px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        ">
          <img src="${finalLogoUrl}" 
               alt="CaseWHR 接得準" 
               style="
                 max-width: 180px; 
                 height: auto;
                 filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
               " />
        </div>
      </div>
      
      <!-- 公司名稱 -->
      <div style="margin-bottom: 24px;">
        <div style="
          color: #e5e7eb; 
          font-size: 17px; 
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        ">
          Case Where 接得準股份有限公司
        </div>
        <div style="
          font-size: 14px; 
          color: #9ca3af;
          font-weight: 500;
          letter-spacing: 0.5px;
        ">
          Case Where Co., Ltd.
        </div>
      </div>
      
      <!-- 聯絡資訊 -->
      <div style="
        margin: 20px 0; 
        font-size: 13px;
        line-height: 1.8;
        background: rgba(55, 65, 81, 0.4);
        border-radius: 12px;
        padding: 16px 24px;
        display: inline-block;
      ">
        <div style="margin-bottom: 8px;">
          <span style="color: #d1d5db;">📍</span>
          <span style="color: #9ca3af; margin-left: 8px;">台灣台中市太平區宜欣一路115號5樓之一 | Taichung, Taiwan</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: #d1d5db;">📧</span>
          <a href="mailto:support@casewhr.com" style="color: #60a5fa; text-decoration: none; margin-left: 8px; font-weight: 500;">support@casewhr.com</a>
        </div>
        <div>
          <span style="color: #d1d5db;">🌐</span>
          <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none; margin-left: 8px; font-weight: 500;">casewhr.com</a>
        </div>
      </div>
      
      <!-- 🌟 股東招募訊息 -->
      <div style="margin: 28px auto; max-width: 500px;">
        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); border: 2px solid rgba(251, 191, 36, 0.4); border-radius: 16px; padding: 20px 28px; box-shadow: 0 6px 20px rgba(251, 191, 36, 0.12); backdrop-filter: blur(8px);">
          <!-- 標題 -->
          <div style="margin-bottom: 12px; text-align: center;">
            <span style="color: #fbbf24; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);">
              💎 股東招募中 💎
            </span>
          </div>
          
          <!-- 副標題 -->
          <div style="color: #fbbf24; font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 8px; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">
            歡迎入股 | Welcome to Invest
          </div>
          
          <!-- 說明文字 -->
          <div style="color: #d1d5db; font-size: 13px; text-align: center; line-height: 1.6; opacity: 0.95;">
            共同打造全球接案平台，開創未來商機<br/>
            Build the future together
          </div>
          
          <!-- 聯絡按鈕 -->
          <div style="text-align: center; margin-top: 16px;">
            <a href="mailto:support@casewhr.com" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #1f2937; text-decoration: none; font-weight: 700; font-size: 14px; padding: 10px 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3); letter-spacing: 0.3px;">
              📩 洽詢入股 | Contact Us
            </a>
          </div>
        </div>
      </div>
      
      <!-- 分隔線 -->
      <div style="height: 2px; background: linear-gradient(90deg, rgba(75, 85, 99, 0) 0%, rgba(75, 85, 99, 0.6) 50%, rgba(75, 85, 99, 0) 100%); margin: 28px 0;"></div>
      
      <!-- 社群媒體 -->
      <div class="social-icons" style="margin: 28px 0;">
        <div style="color: #9ca3af; font-size: 14px; font-weight: 600; margin-bottom: 16px; letter-spacing: 0.3px;">
          關注我們 | Follow Us
        </div>
        <div style="display: inline-block; background: rgba(55, 65, 81, 0.3); border-radius: 12px; padding: 12px 20px;">
          <a href="https://facebook.com/casewhere" style="color: #60a5fa; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500;">📘 Facebook</a>
          <a href="https://twitter.com/casewhere" style="color: #60a5fa; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500;">🐦 Twitter</a>
          <a href="https://linkedin.com/company/casewhere" style="color: #60a5fa; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500;">💼 LinkedIn</a>
          <a href="https://instagram.com/casewhere" style="color: #60a5fa; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500;">📷 Instagram</a>
        </div>
      </div>
      
      <!-- 分隔線 -->
      <div style="height: 2px; background: linear-gradient(90deg, rgba(75, 85, 99, 0) 0%, rgba(75, 85, 99, 0.6) 50%, rgba(75, 85, 99, 0) 100%); margin: 28px 0;"></div>
      
      <!-- 頁腳連結 -->
      <div class="footer-links" style="margin: 24px 0;">
        <div style="background: rgba(55, 65, 81, 0.25); border-radius: 12px; padding: 14px 24px; display: inline-block;">
          <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500; font-size: 13px;">訪問網站 | Visit Website</a>
          <a href="https://casewhr.com/help" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500; font-size: 13px;">幫助中心 | Help Center</a>
          <a href="https://casewhr.com/terms" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500; font-size: 13px;">服務條款 | Terms</a>
          <a href="https://casewhr.com/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500; font-size: 13px;">隱私政策 | Privacy</a>
        </div>
      </div>
      
      <!-- 分隔線 -->
      <div style="height: 1px; background: rgba(75, 85, 99, 0.4); margin: 28px auto; max-width: 400px;"></div>
      
      <!-- 版權資訊 -->
      <div style="font-size: 12px; color: #6b7280; margin: 16px 0; line-height: 1.6;">
        <div style="margin-bottom: 8px;">
          © ${new Date().getFullYear()} Case Where 接得準股份有限公司. 版權所有 | All Rights Reserved.
        </div>
      </div>
      
      <!-- 取消訂閱 -->
      <div style="font-size: 12px; color: #6b7280; margin-top: 12px;">
        不想收到這些郵件？ | Don't want these emails? 
        <a href="mailto:unsubscribe@casewhr.com" style="color: #60a5fa; text-decoration: none; font-weight: 500; margin-left: 4px;">取消訂閱 | Unsubscribe</a>
      </div>
    </div>
  `;
};

// 共用的郵件樣式 - 優化版
export const getEmailStyles = () => `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; 
    line-height: 1.8; 
    color: #1f2937; 
    background-color: #f9fafb;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .email-wrapper { 
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
    padding: 40px 20px; 
    min-height: 100vh;
  }
  .container { 
    max-width: 650px; 
    margin: 0 auto; 
    background: white; 
    border-radius: 16px; 
    overflow: hidden; 
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
  }
  .logo-section { 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); 
    padding: 40px 30px; 
    text-align: center;
    position: relative;
  }
  .logo { 
    color: white; 
    font-size: 32px; 
    font-weight: 800; 
    text-decoration: none;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    letter-spacing: -0.5px;
  }
  .logo-tagline { 
    color: rgba(255,255,255,0.95); 
    font-size: 15px; 
    margin-top: 12px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  .header { 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); 
    color: white; 
    padding: 50px 40px; 
    text-align: center;
  }
  .header.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  .header.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .header.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
  .header.info { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
  .header h1 { 
    margin: 0; 
    font-size: 32px; 
    font-weight: 800; 
    text-shadow: 0 2px 8px rgba(0,0,0,0.15);
    letter-spacing: -0.5px;
  }
  .content { 
    padding: 50px 40px; 
    background: #ffffff;
    line-height: 1.8;
  }
  .card { 
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); 
    border-radius: 12px; 
    padding: 28px; 
    margin: 28px 0; 
    border-left: 5px solid #6366f1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .card.success { border-left-color: #10b981; }
  .card.warning { border-left-color: #f59e0b; }
  .card.danger { border-left-color: #ef4444; }
  .detail-row { 
    display: flex; 
    justify-content: space-between; 
    padding: 14px 0; 
    border-bottom: 1px solid #e5e7eb;
    align-items: center;
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { 
    font-weight: 600; 
    color: #6b7280;
    font-size: 14px;
  }
  .detail-value { 
    color: #111827; 
    font-weight: 600;
    font-size: 16px;
  }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); 
    color: white !important; 
    padding: 18px 40px; 
    text-decoration: none; 
    border-radius: 12px; 
    font-weight: 700;
    font-size: 17px;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
    transition: all 0.3s ease;
    text-align: center;
    letter-spacing: 0.3px;
  }
  .button.success { 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
  }
  .button.warning { 
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
  }
  .button.danger { 
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
  }
  .stats { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 20px; 
    margin: 32px 0;
  }
  .stat-box { 
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); 
    padding: 28px 20px; 
    border-radius: 12px; 
    text-align: center; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  .stat-number { 
    font-size: 38px; 
    font-weight: 800; 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
    letter-spacing: -1px;
  }
  .stat-label { 
    font-size: 13px; 
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .progress-bar { 
    background: #e5e7eb; 
    border-radius: 12px; 
    height: 28px; 
    overflow: hidden; 
    margin: 20px 0;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
  }
  .progress-fill { 
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); 
    height: 100%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: white; 
    font-size: 13px; 
    font-weight: 700; 
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.5px;
  }
  .alert { 
    padding: 20px 24px; 
    border-radius: 12px; 
    margin: 24px 0;
    border: 1px solid;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .alert.info { 
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); 
    border-color: #3b82f6; 
    color: #1e3a8a;
  }
  .alert.success { 
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
    border-color: #10b981; 
    color: #064e3b;
  }
  .alert.warning { 
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
    border-color: #f59e0b; 
    color: #78350f;
  }
  .alert.danger { 
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
    border-color: #ef4444; 
    color: #7f1d1d;
  }
  .footer { 
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%); 
    color: #9ca3af; 
    padding: 40px 32px; 
    text-align: center;
    border-top: 3px solid #6366f1;
  }
  .footer-links { margin: 20px 0; }
  .footer-link { 
    color: #60a5fa; 
    text-decoration: none; 
    margin: 0 14px;
    font-weight: 500;
  }
  .social-icons { margin: 24px 0; }
  .social-icon { 
    display: inline-block; 
    margin: 0 10px; 
    color: #60a5fa; 
    text-decoration: none;
    font-size: 15px;
  }
  .divider { 
    height: 2px; 
    background: linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent); 
    margin: 32px 0;
    border-radius: 2px;
  }
  .highlight { 
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); 
    padding: 28px; 
    border-radius: 12px; 
    margin: 28px 0;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  .badge { 
    display: inline-block; 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
    color: white; 
    padding: 8px 16px; 
    border-radius: 24px; 
    font-size: 12px; 
    font-weight: 700; 
    margin: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
  .emoji-large { 
    font-size: 80px; 
    text-align: center; 
    margin: 24px 0;
    line-height: 1;
  }
  .text-center { text-align: center; }
  .text-muted { 
    color: #6b7280; 
    font-size: 14px;
    line-height: 1.6;
  }
  .text-small { font-size: 13px; }
  .mt-1 { margin-top: 8px; }
  .mt-2 { margin-top: 16px; }
  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  
  @media only screen and (max-width: 600px) {
    .stats { grid-template-columns: 1fr; gap: 16px; }
    .email-wrapper { padding: 20px 10px; }
    .content { padding: 32px 24px; }
    .header { padding: 40px 24px; }
    .header h1 { font-size: 26px; }
    .logo { font-size: 26px; }
    .logo-tagline { font-size: 13px; }
    .button { padding: 16px 32px; font-size: 16px; }
    .emoji-large { font-size: 64px; }
    .stat-number { font-size: 32px; }
    .card { padding: 20px; }
  }
`;

// 📧 郵件 Header（支持企業版自定義 LOGO）
export const getEmailHeader = (logoUrl?: string, headerLogoUrl?: string): string => {
  // 🌟 企業版：如果提供了 headerLogoUrl，顯示企業 LOGO
  if (headerLogoUrl) {
    return `
      <div class="enterprise-header-section">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 50px 40px 30px;">
              <!-- 企業 LOGO 容器 -->
              <div style="
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                border-radius: 16px;
                padding: 32px 40px;
                margin-bottom: 24px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.18);
              ">
                <img src="${headerLogoUrl}" 
                     alt="Company Logo" 
                     style="
                       max-width: 280px; 
                       height: auto; 
                       display: block;
                       margin: 0 auto;
                       filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
                     " />
              </div>
              
              <!-- Powered by 標籤 -->
              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.12);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 20px;
                padding: 8px 20px;
                margin-top: 8px;
              ">
                <div style="
                  color: rgba(255,255,255,0.95);
                  font-size: 13px;
                  font-weight: 600;
                  letter-spacing: 0.3px;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                ">
                  <span style="opacity: 0.7;">Powered by</span>
                  <span style="margin: 0 6px; opacity: 0.5;">•</span>
                  <span style="color: #fff;">Case Where 接得準</span>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
  
  // 📧 標準版：簡潔的文字 header（無 LOGO）
  // LOGO 會顯示在 Footer
  return ``;
};

// 📧 郵件 Footer
export const getEmailFooter = (language: 'en' | 'zh' = 'en'): string => {
  return getBilingualFooter();
};

// 🎉 歡迎郵件 - 新用戶註冊時發送
export function getWelcomeEmail(params: {
  name: string;
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, language, logoUrl, headerLogoUrl } = params;
  
  const content = language === 'en' ? {
    title: 'Welcome to Case Where! 🎉',
    greeting: `Hi ${name},`,
    welcome: 'Welcome to Case Where - your gateway to professional service talents!',
    intro: 'We\'re thrilled to have you join our community of talented professionals and clients.',
    whoWeAre: 'Who We Are',
    whoWeAreDesc: 'Case Where is Taiwan\'s leading platform connecting businesses with verified professional talent. From web development to design, marketing to consulting - we have experts ready to bring your projects to life.',
    byTheNumbers: 'Platform Highlights',
    stat1: '10,000+',
    stat1Label: 'Active Professionals',
    stat2: '50,000+',
    stat2Label: 'Projects Completed',
    stat3: '95%',
    stat3Label: 'Client Satisfaction',
    steps: 'Get Started in 3 Easy Steps:',
    step1Title: '1. Complete Your Profile ✨',
    step1Desc: 'Add your skills, experience, and portfolio to stand out. Profiles with photos get 5x more views!',
    step2Title: '2. Explore Projects 🔍',
    step2Desc: 'Browse thousands of projects across 50+ categories. Use our smart filters to find perfect matches.',
    step3Title: '3. Start Earning 💰',
    step3Desc: 'Submit proposals, win projects, and get paid securely through our platform. Average response time: 24 hours.',
    features: 'What You Can Do:',
    feature1: '📋 Browse 1,000+ new projects monthly across all industries',
    feature2: '💼 Showcase your professional skills with unlimited portfolio items',
    feature3: '💰 Secure payment system with escrow protection',
    feature4: '⭐ Build your reputation with verified client reviews',
    feature5: '🚀 Grow your freelance business with analytics and insights',
    feature6: '🎓 Access free resources and learning materials',
    feature7: '👥 Connect with a community of 10,000+ professionals',
    feature8: '🔔 Get instant notifications for matching opportunities',
    successTips: '🎯 Quick Tips for Success',
    tip1: '✅ Complete your profile within 24 hours - complete profiles get 3x more inquiries',
    tip2: '✅ Upload 3-5 portfolio items showcasing your best work',
    tip3: '✅ Set up instant notifications to be first to respond',
    tip4: '✅ Write personalized proposals that address client needs',
    cta: 'Complete Your Profile Now',
    exclusiveOffer: '🎁 Special Welcome Offer',
    offerText: 'As a new member, enjoy your first month with 0% platform fee on all earnings!',
    offerValid: 'Valid for 30 days from signup',
    help: 'Need help getting started?',
    helpLink: 'Check out our comprehensive guide',
    watchVideo: 'Watch our 3-minute tutorial video',
    team: 'Welcome aboard! We\'re excited to see you succeed.<br/>The Case Where Team'
  } : {
    title: '歡迎來到 Case Where！🎉',
    greeting: `${name}，您好！`,
    welcome: '歡迎來到 Case Where - 您的專業服務人才連接平台！',
    intro: '很高興您加入我們的專業人才和客戶社群。',
    whoWeAre: '關於我們',
    whoWeAreDesc: 'Case Where 是台灣領先的專業人才媒合平台，從網頁開發到設計、行銷到顧問服務，我們擁有專業人才為您的項目注入生命力。',
    byTheNumbers: '平台亮點',
    stat1: '10,000+',
    stat1Label: '活躍專業人才',
    stat2: '50,000+',
    stat2Label: '完成項目',
    stat3: '95%',
    stat3Label: '客戶滿意度',
    steps: '3 步快速開始：',
    step1Title: '1. 完善您的個人資料 ✨',
    step1Desc: '添加技能、經驗和作品集，讓您脫穎而出。有照片的個人資料瀏覽量高 5 倍！',
    step2Title: '2. 探索項目 🔍',
    step2Desc: '瀏覽 50+ 類別的數千個項目。使用智能篩選器找到完美匹配。',
    step3Title: '3. 開始賺錢 💰',
    step3Desc: '提交提案、贏得項目並通過平台安全收款。平均回覆時間：24 小時。',
    features: '您可做什麼：',
    feature1: '📋 每月瀏覽 1,000+ 個跨行業新項目',
    feature2: '💼 無限制作品集展示您的專業技能',
    feature3: '💰 安全的託管支付系統保障',
    feature4: '⭐ 通過驗證的客戶評價建立聲譽',
    feature5: '🚀 通過分析和洞察發展您的自由職業',
    feature6: '🎓 訪問免費資源和學習材料',
    feature7: '👥 與 10,000+ 專業人士社群連接',
    feature8: '🔔 獲得匹配機會的即時通知',
    successTips: '🎯 成功快速提示',
    tip1: '✅ 24 小時內完成資料 - 完整資料獲得 3 倍詢問量',
    tip2: '✅ 上傳 3-5 個展示最佳作品的作品集',
    tip3: '✅ 設置即時通知以首先回應',
    tip4: '✅ 撰寫針對客戶需求的個性化提案',
    cta: '立即完善個人資料',
    exclusiveOffer: '🎁 特別歡迎優惠',
    offerText: '作為新會員，首月所有收入享受 0% 平台費用！',
    offerValid: '註冊後 30 天內有效',
    help: '需要入門幫助？',
    helpLink: '查看我們的完整指南',
    watchVideo: '觀看 3 分鐘教學影片',
    team: '歡迎加入！我們期待看到您的成功。<br/>Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header success">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <div class="emoji-large">👋</div>
              <p style="font-size: 18px;"><strong>${content.greeting}</strong></p>
              <p style="font-size: 16px;">${content.welcome}</p>
              <p>${content.intro}</p>
              
              <div class="highlight">
                <h3 style="margin-top: 0;">💎 ${content.whoWeAre}</h3>
                <p>${content.whoWeAreDesc}</p>
              </div>
              
              <h3 class="text-center">${content.byTheNumbers}</h3>
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${content.stat1}</div>
                  <div class="stat-label">${content.stat1Label}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${content.stat2}</div>
                  <div class="stat-label">${content.stat2Label}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${content.stat3}</div>
                  <div class="stat-label">${content.stat3Label}</div>
                </div>
              </div>
              
              <div class="highlight">
                <h3 style="margin-top: 0;">${content.steps}</h3>
                <div style="margin: 16px 0;">
                  <strong>${content.step1Title}</strong><br/>
                  <span class="text-muted">${content.step1Desc}</span>
                </div>
                <div style="margin: 16px 0;">
                  <strong>${content.step2Title}</strong><br/>
                  <span class="text-muted">${content.step2Desc}</span>
                </div>
                <div style="margin: 16px 0;">
                  <strong>${content.step3Title}</strong><br/>
                  <span class="text-muted">${content.step3Desc}</span>
                </div>
              </div>
              
              <div class="card success">
                <h3>${content.features}</h3>
                <ul style="line-height: 2;">
                  <li>${content.feature1}</li>
                  <li>${content.feature2}</li>
                  <li>${content.feature3}</li>
                  <li>${content.feature4}</li>
                  <li>${content.feature5}</li>
                  <li>${content.feature6}</li>
                  <li>${content.feature7}</li>
                  <li>${content.feature8}</li>
                </ul>
              </div>
              
              <div class="alert info">
                <strong>${content.successTips}</strong><br/><br/>
                ${content.tip1}<br/>
                ${content.tip2}<br/>
                ${content.tip3}<br/>
                ${content.tip4}
              </div>
              
              <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e;">${content.exclusiveOffer}</h3>
                <p style="font-size: 16px; color: #78350f; margin: 0;"><strong>${content.offerText}</strong></p>
                <p style="font-size: 12px; color: #92400e; margin-top: 8px;">${content.offerValid}</p>
              </div>
              
              <div class="text-center">
                <a href="#" class="button success">${content.cta}</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center text-muted">
                ${content.help} <a href="#" style="color: #667eea;"><strong>${content.helpLink}</strong></a><br/>
                📺 <a href="#" style="color: #667eea;">${content.watchVideo}</a>
              </p>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 📊 月度報告郵件
export function getMonthlyReportEmail(params: {
  name: string;
  month: string;
  stats: {
    projectsPosted?: number;
    proposalsSubmitted?: number;
    projectsCompleted?: number;
    earningsThisMonth?: number;
    totalEarnings?: number;
    newReviews?: number;
    averageRating?: number;
  };
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, month, stats, language, logoUrl, headerLogoUrl } = params;
  
  // 計算成長率
  const earningsGrowth = stats.earningsThisMonth && stats.totalEarnings ? 
    Math.round((stats.earningsThisMonth / (stats.totalEarnings - stats.earningsThisMonth)) * 100) : 0;
  
  const content = language === 'en' ? {
    title: `Your ${month} Performance Report 📊`,
    greeting: `Hi ${name},`,
    intro: `Here's your comprehensive activity summary for ${month}. You've been making great progress!`,
    monthHighlights: 'Month Highlights',
    performanceTitle: 'Your Performance Metrics',
    projectsPosted: 'Projects Posted',
    proposalsSubmitted: 'Proposals Submitted',
    projectsCompleted: 'Projects Completed',
    earningsMonth: 'This Month',
    earningsTotal: 'Total Earnings',
    earningsGrowth: 'Growth',
    reviews: 'New Reviews',
    rating: 'Average Rating',
    achievements: '🏆 This Month\'s Achievements',
    achievement1: stats.projectsCompleted && stats.projectsCompleted >= 5 ? '✨ Super Performer - Completed 5+ projects!' : '🎯 Great Start - Keep building your portfolio',
    achievement2: stats.averageRating && stats.averageRating >= 4.5 ? '⭐ Top Rated Professional - Maintaining 4.5+ stars!' : '📈 Growing Reputation - Keep up the quality work',
    achievement3: stats.earningsThisMonth && stats.earningsThisMonth > 1000 ? '💰 High Earner - Crossed $1,000 this month!' : '💼 Building Your Business - Every project counts',
    insights: '🎯 Personalized Insights & Tips',
    insight1: stats.proposalsSubmitted && stats.proposalsSubmitted > 15 ? 
      '🔥 Outstanding Activity! You\'re submitting lots of proposals. Focus on quality over quantity to improve your win rate.' :
      stats.proposalsSubmitted && stats.proposalsSubmitted > 10 ? 
      '💪 Great job staying active! Keep submitting quality proposals to maintain momentum.' :
      '💡 Increase Your Opportunities: Try submitting 10-15 proposals per week to improve your chances of landing projects.',
    insight2: stats.averageRating && stats.averageRating >= 4.8 ?
      '🌟 Exceptional Performance! Your rating is outstanding. Clients love working with you!' :
      stats.averageRating && stats.averageRating >= 4.5 ?
      '⭐ Excellent Work! Your high rating attracts more clients. Keep delivering quality!' :
      '📈 Improve Your Rating: Focus on communication, deadlines, and quality to boost client satisfaction.',
    insight3: stats.projectsCompleted && stats.projectsCompleted >= 5 ?
      '🚀 Productivity Champion! You\'re completing projects at an impressive rate.' :
      '⏱️ Time Management Tip: Set clear milestones and communicate progress regularly.',
    competitiveAnalysis: '📈 How You Compare',
    avgProposals: 'Platform Average',
    yourProposals: 'Your Proposals',
    avgRating: 'Platform Avg Rating',
    yourRating: 'Your Rating',
    performanceBar: 'You\'re performing',
    better: stats.proposalsSubmitted && stats.proposalsSubmitted > 8 ? 'above average!' : 'well! Keep it up!',
    nextSteps: '🎯 Recommended Actions for Next Month',
    nextStep1: '✅ Update your portfolio with recent completed projects',
    nextStep2: '✅ Respond to client messages within 2 hours for better engagement',
    nextStep3: '✅ Set competitive rates based on your growing experience',
    nextStep4: '✅ Ask satisfied clients for testimonials and reviews',
    cta: 'View Detailed Analytics',
    viewProfile: 'Update My Profile',
    tip: '💡 Pro Tip: Professionals who maintain a 90%+ response rate get 3x more project invitations!',
    team: 'Keep up the excellent work! We\'re proud of your progress.<br/>The Case Where Team'
  } : {
    title: `您的 ${month} 月績效報告 📊`,
    greeting: `${name}，您好！`,
    intro: `這是您 ${month} 月的全面活動摘要。您一直在取得很好的進展！`,
    monthHighlights: '本月亮點',
    performanceTitle: '您的績效指標',
    projectsPosted: '發布的項目',
    proposalsSubmitted: '提交的提案',
    projectsCompleted: '完成的項目',
    earningsMonth: '本月收入',
    earningsTotal: '總收入',
    earningsGrowth: '成長',
    reviews: '新評價',
    rating: '平均評分',
    achievements: '🏆 本月成就',
    achievement1: stats.projectsCompleted && stats.projectsCompleted >= 5 ? '✨ 超級表現者 - 完成 5+ 個項目！' : '🎯 良好開始 - 持續建立您的作品集',
    achievement2: stats.averageRating && stats.averageRating >= 4.5 ? '⭐ 頂級專業人士 - 保持 4.5+ 星！' : '📈 增長中的聲譽 - 保持高質量工作',
    achievement3: stats.earningsThisMonth && stats.earningsThisMonth > 1000 ? '💰 高收入者 - 本月突破 $1,000！' : '💼 建立您的業務 - 每個項目都很重要',
    insights: '🎯 個性化洞察與建議',
    insight1: stats.proposalsSubmitted && stats.proposalsSubmitted > 15 ? 
      '🔥 出色的活躍度！您提交了很多提案。專注於質量而非數量以提高成功率。' :
      stats.proposalsSubmitted && stats.proposalsSubmitted > 10 ? 
      '💪 做得很好！繼續提交高質量的提案以保持勢頭。' :
      '💡 增加您的機會：嘗試每週提交 10-15 個提案以提高獲得項目的機會。',
    insight2: stats.averageRating && stats.averageRating >= 4.8 ?
      '🌟 卓越表現！您的評分非常出色。客戶喜歡與您合作！' :
      stats.averageRating && stats.averageRating >= 4.5 ?
      '⭐ 出色的工作！高評分會吸引更多客戶。繼續提供優質服務！' :
      '📈 提高您的評分：專注於溝通、截止日期和質量以提升客戶滿意度。',
    insight3: stats.projectsCompleted && stats.projectsCompleted >= 5 ?
      '🚀 生產力冠軍！您以驚人的速度完成項目。' :
      '⏱️ 時間管理提示：設定清晰的里程碑並定期溝通進度。',
    competitiveAnalysis: '📈 您的競爭力分析',
    avgProposals: '平台平均值',
    yourProposals: '您的提案數',
    avgRating: '平台平均評分',
    yourRating: '您的評分',
    performanceBar: '您的表現',
    better: stats.proposalsSubmitted && stats.proposalsSubmitted > 8 ? '高於平均！' : '很好！繼續加油！',
    nextSteps: '🎯 下月推薦行動',
    nextStep1: '✅ 用最近完成的項目更新您的作品集',
    nextStep2: '✅ 2 小時內回覆客戶訊息以提高參與度',
    nextStep3: '✅ 根據您不斷增長的經驗設定有競爭力的費率',
    nextStep4: '✅ 向滿意的客戶索取推薦和評價',
    cta: '查看詳細分析',
    viewProfile: '更新我的資料',
    tip: '💡 專業提示：保持 90%+ 回覆率的專業人士獲得 3 倍的項目邀請！',
    team: '繼續保持出色的工作！我們為您的進步感到自豪。<br/>Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header info">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <p><strong>${content.greeting}</strong></p>
              <p>${content.intro}</p>
              
              <div class="emoji-large">📊</div>
              
              <h3 class="text-center">${content.performanceTitle}</h3>
              <div class="stats">
                ${stats.projectsPosted !== undefined ? `
                  <div class="stat-box">
                    <div class="stat-number">${stats.projectsPosted}</div>
                    <div class="stat-label">${content.projectsPosted}</div>
                  </div>
                ` : ''}
                ${stats.proposalsSubmitted !== undefined ? `
                  <div class="stat-box">
                    <div class="stat-number">${stats.proposalsSubmitted}</div>
                    <div class="stat-label">${content.proposalsSubmitted}</div>
                  </div>
                ` : ''}
                ${stats.projectsCompleted !== undefined ? `
                  <div class="stat-box">
                    <div class="stat-number">${stats.projectsCompleted}</div>
                    <div class="stat-label">${content.projectsCompleted}</div>
                  </div>
                ` : ''}
              </div>
              
              ${stats.earningsThisMonth !== undefined || stats.totalEarnings !== undefined ? `
                <div class="card" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left-color: #10b981;">
                  <h3 style="margin-top: 0; color: #065f46;">💰 ${content.earningsMonth}</h3>
                  ${stats.earningsThisMonth !== undefined ? `
                    <div class="detail-row" style="border-bottom: none;">
                      <span style="font-size: 16px; color: #047857;">${content.earningsMonth}:</span>
                      <span style="color: #065f46; font-size: 28px; font-weight: 700;">$${stats.earningsThisMonth}</span>
                    </div>
                    ${earningsGrowth > 0 ? `
                      <div class="text-center mt-1">
                        <span class="badge" style="background: #10b981;">📈 ${content.earningsGrowth}: +${earningsGrowth}%</span>
                      </div>
                    ` : ''}
                  ` : ''}
                  ${stats.totalEarnings !== undefined ? `
                    <div class="text-center mt-2" style="padding-top: 12px; border-top: 1px solid #a7f3d0;">
                      <span style="color: #047857;">${content.earningsTotal}: </span>
                      <strong style="font-size: 20px; color: #065f46;">$${stats.totalEarnings}</strong>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              
              ${stats.newReviews !== undefined && stats.newReviews > 0 ? `
                <div class="card">
                  <h3 style="margin-top: 0;">⭐ ${content.reviews}</h3>
                  <div class="stats" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="stat-box">
                      <div class="stat-number" style="color: #f59e0b;">${stats.newReviews}</div>
                      <div class="stat-label">${content.reviews}</div>
                    </div>
                    ${stats.averageRating !== undefined ? `
                      <div class="stat-box">
                        <div class="stat-number" style="color: #f59e0b;">${stats.averageRating.toFixed(1)}</div>
                        <div class="stat-label">${content.rating}</div>
                        <div class="mt-1">${'⭐'.repeat(Math.round(stats.averageRating))}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              
              <div class="highlight">
                <h3 style="margin-top: 0;">${content.achievements}</h3>
                <div style="margin: 12px 0;">
                  <div style="background: white; padding: 12px; border-radius: 6px; margin: 8px 0;">
                    ${content.achievement1}
                  </div>
                  <div style="background: white; padding: 12px; border-radius: 6px; margin: 8px 0;">
                    ${content.achievement2}
                  </div>
                  <div style="background: white; padding: 12px; border-radius: 6px; margin: 8px 0;">
                    ${content.achievement3}
                  </div>
                </div>
              </div>
              
              <div class="card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left-color: #3b82f6;">
                <h3 style="margin-top: 0; color: #1e40af;">${content.competitiveAnalysis}</h3>
                <div style="margin: 16px 0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #1e40af; font-size: 14px;">${content.avgProposals}: 8</span>
                    <span style="color: #1e40af; font-size: 14px;">${content.yourProposals}: ${stats.proposalsSubmitted || 0}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((stats.proposalsSubmitted || 0) / 8 * 100, 100)}%; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);">
                      ${stats.proposalsSubmitted && stats.proposalsSubmitted > 8 ? '🔥 ' : ''}${Math.min(Math.round((stats.proposalsSubmitted || 0) / 8 * 100), 100)}%
                    </div>
                  </div>
                </div>
                ${stats.averageRating !== undefined ? `
                  <div style="margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #1e40af; font-size: 14px;">${content.avgRating}: 4.2</span>
                      <span style="color: #1e40af; font-size: 14px;">${content.yourRating}: ${stats.averageRating.toFixed(1)}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${Math.min((stats.averageRating / 5) * 100, 100)}%; background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);">
                        ${stats.averageRating >= 4.5 ? '⭐ ' : ''}${Math.round((stats.averageRating / 5) * 100)}%
                      </div>
                    </div>
                  </div>
                ` : ''}
                <div class="text-center mt-2">
                  <strong style="color: #1e40af;">${content.performanceBar} ${content.better}</strong>
                </div>
              </div>
              
              <div class="alert info">
                <strong>${content.insights}</strong><br/><br/>
                <div style="margin: 8px 0;">📌 ${content.insight1}</div>
                <div style="margin: 8px 0;">📌 ${content.insight2}</div>
                <div style="margin: 8px 0;">📌 ${content.insight3}</div>
              </div>
              
              <div class="highlight">
                <h3 style="margin-top: 0;">${content.nextSteps}</h3>
                <div style="line-height: 2;">
                  <div>${content.nextStep1}</div>
                  <div>${content.nextStep2}</div>
                  <div>${content.nextStep3}</div>
                  <div>${content.nextStep4}</div>
                </div>
              </div>
              
              <div class="alert success">
                ${content.tip}
              </div>
              
              <div class="text-center">
                <a href="#" class="button">${content.cta}</a>
                <br/><br/>
                <a href="#" class="button success">${content.viewProfile}</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 🎯 項目推薦郵件
export function getProjectRecommendationEmail(params: {
  name: string;
  projects: Array<{
    title: string;
    budget: string;
    skills: string[];
    deadline: string;
  }>;
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, projects, language, logoUrl, headerLogoUrl } = params;
  
  const content = language === 'en' ? {
    title: 'Projects Matching Your Skills 🎯',
    greeting: `Hi ${name},`,
    intro: 'We found some projects that match your skills and expertise!',
    budgetLabel: 'Budget',
    skillsLabel: 'Skills Required',
    deadlineLabel: 'Deadline',
    viewButton: 'View Project',
    browseMore: 'Browse More Projects',
    tip: '💡 Tip: Submit proposals early to increase your chances of being selected!',
    team: 'Good luck!<br/>The Case Where Team'
  } : {
    title: '符合您技能的項目 🎯',
    greeting: `${name}，您好！`,
    intro: '我們找到了一些符合您技和專業的項目！',
    budgetLabel: '預算',
    skillsLabel: '所需技能',
    deadlineLabel: '截止日期',
    viewButton: '查看項目',
    browseMore: '瀏覽更多項目',
    tip: '💡 提示：儘早提交提案以增加被選中的機會！',
    team: '祝您好運！<br/>Case Where 團隊'
  };

  const projectCards = projects.slice(0, 3).map(project => `
    <div class="card">
      <h3 style="margin-top: 0; color: #667eea;">${project.title}</h3>
      <div class="detail-row">
        <span class="detail-label">${content.budgetLabel}:</span>
        <span class="detail-value">${project.budget}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${content.skillsLabel}:</span>
        <span class="detail-value">
          ${project.skills.map(skill => `<span class="badge">${skill}</span>`).join(' ')}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${content.deadlineLabel}:</span>
        <span class="detail-value">${project.deadline}</span>
      </div>
      <div class="text-center mt-2">
        <a href="#" class="button">${content.viewButton}</a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <p><strong>${content.greeting}</strong></p>
              <p>${content.intro}</p>
              
              ${projectCards}
              
              <div class="alert info">
                ${content.tip}
              </div>
              
              <div class="text-center">
                <a href="#" class="button">${content.browseMore}</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 🔔 系統通知郵件
export function getSystemNotificationEmail(params: {
  name: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  actionButton?: {
    text: string;
    url: string;
  };
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, title, message, type, actionButton, language, logoUrl, headerLogoUrl } = params;
  
  const greeting = language === 'en' ? `Hi ${name},` : `${name}，您好！`;
  const team = language === 'en' ? 'The Case Where Team' : 'Case Where 團隊';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header ${type}">
              <h1>${title}</h1>
            </div>
            
            <div class="content">
              <p><strong>${greeting}</strong></p>
              
              <div class="alert ${type}">
                ${message}
              </div>
              
              ${actionButton ? `
                <div class="text-center">
                  <a href="${actionButton.url}" class="button ${type}">${actionButton.text}</a>
                </div>
              ` : ''}
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 🎊 里程碑提醒郵件（附帶進度條）
export function getMilestoneReminderEmail(params: {
  name: string;
  projectTitle: string;
  milestonesCompleted: number;
  totalMilestones: number;
  nextMilestone: string;
  daysRemaining: number;
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, projectTitle, milestonesCompleted, totalMilestones, nextMilestone, daysRemaining, language, logoUrl, headerLogoUrl } = params;
  
  const progress = Math.round((milestonesCompleted / totalMilestones) * 100);
  
  const content = language === 'en' ? {
    title: 'Project Progress Update 🎊',
    greeting: `Hi ${name},`,
    intro: `Here's an update on your project "${projectTitle}".`,
    progressTitle: 'Overall Progress',
    completedLabel: 'Milestones Completed',
    nextLabel: 'Next Milestone',
    daysLabel: 'Days Remaining',
    encouragement: daysRemaining <= 3 ? 
      '⏰ Deadline is approaching! Stay focused and complete your milestone on time.' :
      '👍 You\'re making great progress! Keep up the good work.',
    viewProject: 'View Project',
    team: 'The Case Where Team'
  } : {
    title: '項目進度更新 🎊',
    greeting: `${name}，您好！`,
    intro: `這是您的項目「${projectTitle}」的進度更新。`,
    progressTitle: '總體進度',
    completedLabel: '已完成里程碑',
    nextLabel: '下一個里程碑',
    daysLabel: '剩餘天數',
    encouragement: daysRemaining <= 3 ?
      '⏰ 截止日期臨近！保持專注，按時完成您的里程碑。' :
      '👍 您的進度很好！繼續保持。',
    viewProject: '查看項目',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header info">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <p><strong>${content.greeting}</strong></p>
              <p>${content.intro}</p>
              
              <div class="card">
                <h3>${content.progressTitle}</h3>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress}%;">${progress}%</div>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">${content.completedLabel}:</span>
                  <span class="detail-value">${milestonesCompleted} / ${totalMilestones}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">${content.nextLabel}:</span>
                  <span class="detail-value">${nextMilestone}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">${content.daysLabel}:</span>
                  <span class="detail-value" style="color: ${daysRemaining <= 3 ? '#ef4444' : '#10b981'};">${daysRemaining}</span>
                </div>
              </div>
              
              <div class="alert ${daysRemaining <= 3 ? 'warning' : 'success'}">
                ${content.encouragement}
              </div>
              
              <div class="text-center">
                <a href="#" class="button">${content.viewProject}</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 💌 客戶端訊息通知郵件
export function getMessageNotificationEmail(params: {
  name: string;
  senderName: string;
  messagePreview: string;
  projectTitle?: string;
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { name, senderName, messagePreview, projectTitle, language, logoUrl, headerLogoUrl } = params;
  
  const content = language === 'en' ? {
    title: 'New Message 💌',
    greeting: `Hi ${name},`,
    intro: `You have a new message from ${senderName}${projectTitle ? ` regarding "${projectTitle}"` : ''}.`,
    preview: 'Message Preview:',
    viewButton: 'View Message',
    replyButton: 'Reply Now',
    team: 'The Case Where Team'
  } : {
    title: '新訊息 💌',
    greeting: `${name}，您好！`,
    intro: `您收到了來自 ${senderName} 的新訊息${projectTitle ? `，關於「${projectTitle}」` : ''}。`,
    preview: '訊息預覽：',
    viewButton: '查看訊息',
    replyButton: '立即回覆',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header info">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <p><strong>${content.greeting}</strong></p>
              <p>${content.intro}</p>
              
              <div class="card">
                <p><strong>${content.preview}</strong></p>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #667eea;">
                  <p style="margin: 0; font-style: italic; color: #6b7280;">"${messagePreview}"</p>
                </div>
              </div>
              
              <div class="text-center">
                <a href="#" class="button">${content.viewButton}</a>
                <br/><br/>
                <a href="#" class="button success">${content.replyButton}</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}

// 🔐 密碼重設郵件 - 雙語版
export function getPasswordResetEmail(params: {
  userName: string;
  resetUrl: string;
  language: 'en' | 'zh';
  logoUrl?: string; // Footer LOGO（所有用戶）
  headerLogoUrl?: string; // Header LOGO（🌟 企業版專屬）
}) {
  const { userName, resetUrl, language, logoUrl, headerLogoUrl } = params;
  
  const content = language === 'en' ? {
    title: 'Password Reset Request 🔐',
    greeting: `Hi ${userName},`,
    intro: 'We received a request to reset your password. Click the button below to create a new password.',
    warning: '⚠️ Important: This link will expire in 5 minutes for security reasons.',
    button: 'Reset Password',
    noRequest: 'If you didn\'t request a password reset, please ignore this email or contact support if you have concerns.',
    security: '🔒 Security Tips:',
    tip1: '• Never share your password with anyone',
    tip2: '• Use a strong, unique password',
    tip3: '• Enable two-factor authentication if available',
    team: 'Stay secure!<br/>The Case Where Team'
  } : {
    title: '密碼重設請求 🔐',
    greeting: `${userName}，您好！`,
    intro: '我們收到了重設您密碼的請求。點擊下方按鈕建立新密碼。',
    warning: '⚠️ 重要：此連結將在 5 分鐘後過期，以確保安全性。',
    button: '重設密碼',
    noRequest: '如果您未請求重設密碼，請忽略此郵件，或如有疑慮請聯繫客服。',
    security: '🔒 安全提示：',
    tip1: '• 絕不與任何人分享您的密碼',
    tip2: '• 使用強且獨特的密碼',
    tip3: '• 如果可用，請啟用雙重驗證',
    team: '保持安全！<br/>Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getEmailStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            ${getEmailHeader(logoUrl, headerLogoUrl)}
            
            <div class="header warning">
              <h1>${content.title}</h1>
            </div>
            
            <div class="content">
              <div class="emoji-large">🔐</div>
              <p><strong>${content.greeting}</strong></p>
              <p>${content.intro}</p>
              
              <div class="alert warning">
                ${content.warning}
              </div>
              
              <div class="text-center">
                <a href="${resetUrl}" class="button warning">${content.button}</a>
              </div>
              
              <div class="card">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  ${content.noRequest}
                </p>
              </div>
              
              <div class="highlight">
                <h3 style="margin-top: 0;">${content.security}</h3>
                <div style="line-height: 2;">
                  <div>${content.tip1}</div>
                  <div>${content.tip2}</div>
                  <div>${content.tip3}</div>
                </div>
              </div>
              
              <div class="divider"></div>
              
              <p class="text-center"><strong>${content.team}</strong></p>
            </div>
            
            ${getEmailFooter(language)}
          </div>
        </div>
      </body>
    </html>
  `;
}