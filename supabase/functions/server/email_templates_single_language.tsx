// ========== 單語言郵件模板 ==========
// 根據用戶語言偏好發送純中文或純英文郵件

import { getEmailStyles } from './email_templates_enhanced.tsx';

// 📧 通用郵件 Header（單語言版）
export const getEmailHeaderSingleLanguage = (params: {
  logoUrl?: string;
  language: 'en' | 'zh';
}): string => {
  const { logoUrl, language } = params;
  
  if (logoUrl) {
    return `
      <div class="logo-section">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 30px;">
              <div style="margin-bottom: 15px;">
                <img src="${logoUrl}" alt="CaseWHR" style="max-width: 280px; height: auto;" />
              </div>
              <div style="color: white; font-size: 28px; font-weight: 800; margin-bottom: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                Case Where ${language === 'zh' ? '接得準' : ''}
              </div>
              <div style="color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 500;">
                ${language === 'zh' 
                  ? '連接專業服務人才的最佳平台' 
                  : 'Connecting Professional Talents'}
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
  
  return `
    <div class="logo-section">
      <div class="logo">Case Where ${language === 'zh' ? '接得準' : ''}</div>
      <div class="logo-tagline">
        ${language === 'zh' 
          ? '連接專業服務人才的最佳平台' 
          : 'Connecting Professional Talents'}
      </div>
    </div>
  `;
};

// 📧 通用郵件 Footer（單語言版）
export const getEmailFooterSingleLanguage = (language: 'en' | 'zh'): string => {
  if (language === 'zh') {
    return `
      <div class="footer">
        <div style="margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 12px 28px; border-radius: 8px; margin-bottom: 16px;">
            <strong style="color: white; font-size: 18px; font-weight: 700;">Case Where 接得準</strong>
          </div>
          <div style="font-size: 14px; color: #d1d5db; margin-top: 8px;">
            專業人才連接平台
          </div>
        </div>
        
        <div style="margin: 24px 0; font-size: 14px; line-height: 2;">
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">📍</span> 台灣台中市太平區宜欣一路115號5樓之一
          </div>
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">📧</span> <a href="mailto:support@casewhr.com" style="color: #60a5fa; text-decoration: none;">support@casewhr.com</a>
          </div>
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">🌐</span> <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none;">https://casewhr.com</a>
          </div>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div class="social-icons">
          <div style="color: #9ca3af; font-size: 13px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
            關注我們
          </div>
          <a href="https://facebook.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">📘 Facebook</a>
          <a href="https://twitter.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">🐦 Twitter</a>
          <a href="https://linkedin.com/company/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">💼 LinkedIn</a>
          <a href="https://instagram.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">📷 Instagram</a>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div style="margin: 24px 0;">
          <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">首頁</a>
          <a href="https://casewhr.com/about" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">關於</a>
          <a href="https://casewhr.com/help" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">幫助</a>
          <a href="https://casewhr.com/terms" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">條款</a>
          <a href="https://casewhr.com/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">隱私</a>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div style="color: #9ca3af; margin: 16px 0; font-size: 13px;">
          © ${new Date().getFullYear()} Case Where 接得準股份有限公司. 版權所有
        </div>
        
        <div style="color: #9ca3af; margin-top: 16px; font-size: 12px;">
          不想收到這些郵件？<br/>
          <a href="mailto:unsubscribe@casewhr.com" style="display: inline-block; margin-top: 8px; padding: 8px 20px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 6px; text-decoration: none;">取消訂閱</a>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
          💡 此郵件由 Case Where 平台自動發送<br/>
          請勿直接回覆此郵件
        </div>
      </div>
    `;
  } else {
    // English Footer
    return `
      <div class="footer">
        <div style="margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 12px 28px; border-radius: 8px; margin-bottom: 16px;">
            <strong style="color: white; font-size: 18px; font-weight: 700;">Case Where</strong>
          </div>
          <div style="font-size: 14px; color: #d1d5db; margin-top: 8px;">
            Professional Talent Platform
          </div>
        </div>
        
        <div style="margin: 24px 0; font-size: 14px; line-height: 2;">
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">📍</span> 5F-1, No. 115, Yixin 1st Rd, Taiping Dist, Taichung City, Taiwan
          </div>
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">📧</span> <a href="mailto:support@casewhr.com" style="color: #60a5fa; text-decoration: none;">support@casewhr.com</a>
          </div>
          <div style="color: #d1d5db; margin: 8px 0;">
            <span style="color: #60a5fa;">🌐</span> <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none;">https://casewhr.com</a>
          </div>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div class="social-icons">
          <div style="color: #9ca3af; font-size: 13px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
            Follow Us
          </div>
          <a href="https://facebook.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">📘 Facebook</a>
          <a href="https://twitter.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">🐦 Twitter</a>
          <a href="https://linkedin.com/company/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">💼 LinkedIn</a>
          <a href="https://instagram.com/casewhere" style="display: inline-block; margin: 8px 12px; padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: #60a5fa; text-decoration: none;">📷 Instagram</a>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div style="margin: 24px 0;">
          <a href="https://casewhr.com" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">Home</a>
          <a href="https://casewhr.com/about" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">About</a>
          <a href="https://casewhr.com/help" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">Help</a>
          <a href="https://casewhr.com/terms" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">Terms</a>
          <a href="https://casewhr.com/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 14px; font-weight: 500;">Privacy</a>
        </div>
        
        <div style="height: 1px; background: rgba(75, 85, 99, 0.5); margin: 28px 0;"></div>
        
        <div style="color: #9ca3af; margin: 16px 0; font-size: 13px;">
          © ${new Date().getFullYear()} Case Where Co., Ltd. All Rights Reserved.
        </div>
        
        <div style="color: #9ca3af; margin-top: 16px; font-size: 12px;">
          Don't want these emails?<br/>
          <a href="mailto:unsubscribe@casewhr.com" style="display: inline-block; margin-top: 8px; padding: 8px 20px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 6px; text-decoration: none;">Unsubscribe</a>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
          💡 This email was sent automatically by Case Where platform<br/>
          Please do not reply directly to this email
        </div>
      </div>
    `;
  }
};

// 🎉 歡迎郵件 - 單語言版本
export function getWelcomeEmailSingleLanguage(params: {
  name: string;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { name, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>歡迎來到 Case Where</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header success">
                <h1>🎉 歡迎來到 Case Where！</h1>
              </div>
              
              <div class="content">
                <div class="emoji-large">👋</div>
                <p style="font-size: 18px;"><strong>${name}，您好！</strong></p>
                <p style="font-size: 16px;">歡迎來到 Case Where - 您的專業服務人才連接平台！</p>
                <p>很高興您加入我們的專業人才和客戶社群。</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">💎 關於我們</h3>
                  <p>Case Where 是台灣領先的專業人才媒合平台，從網頁開發到設計、行銷到顧問服務，我們擁有專業人才為您的項目注入生命力。</p>
                </div>
                
                <h3 class="text-center">平台亮點</h3>
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">10,000+</div>
                    <div class="stat-label">活躍專業人才</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">50,000+</div>
                    <div class="stat-label">完成項目</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">95%</div>
                    <div class="stat-label">客戶滿意度</div>
                  </div>
                </div>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">3 步快速開始：</h3>
                  <div style="margin: 16px 0;">
                    <strong>1. 完善您的個人資料 ✨</strong><br/>
                    <span class="text-muted">添加技能、經驗和作品集，讓您脫穎而出。有照片的個人資料瀏覽量高 5 倍！</span>
                  </div>
                  <div style="margin: 16px 0;">
                    <strong>2. 探索項目 🔍</strong><br/>
                    <span class="text-muted">瀏覽 50+ 類別的數千個項目。使用智能篩選器找到完美匹配。</span>
                  </div>
                  <div style="margin: 16px 0;">
                    <strong>3. 開始賺錢 💰</strong><br/>
                    <span class="text-muted">提交提案、贏得項目並通過平台安全收款。平均回覆時間：24 小時。</span>
                  </div>
                </div>
                
                <div class="card success">
                  <h3>您可以做什麼：</h3>
                  <ul style="line-height: 2;">
                    <li>📋 每月瀏覽 1,000+ 個跨行業新項目</li>
                    <li>💼 無限制作品集展示您的專業技能</li>
                    <li>💰 安全的託管支付系統保障</li>
                    <li>⭐ 通過驗證的客戶評價建立聲譽</li>
                    <li>🚀 通過分析和洞察發展您的自由職業</li>
                    <li>🎓 訪問免費資源和學習材料</li>
                    <li>👥 與 10,000+ 專業人士社群連接</li>
                    <li>🔔 獲得匹配機會的即時通知</li>
                  </ul>
                </div>
                
                <div class="alert info">
                  <strong>🎯 成功快速提示</strong><br/><br/>
                  ✅ 24 小時內完成資料 - 完整資料獲得 3 倍詢問量<br/>
                  ✅ 上傳 3-5 個展示最佳作品的作品集<br/>
                  ✅ 設置即時通知以首先回應<br/>
                  ✅ 撰寫針對客戶需求的個性化提案
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
                  <h3 style="margin-top: 0; color: #92400e;">🎁 特別歡迎優惠</h3>
                  <p style="font-size: 16px; color: #78350f; margin: 0;"><strong>作為新會員，首月所有收入享受 0% 平台費用！</strong></p>
                  <p style="font-size: 12px; color: #92400e; margin-top: 8px;">註冊後 30 天內有效</p>
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/profile" class="button success">立即完善個人資料</a>
                </div>
                
                <div class="divider"></div>
                
                <p class="text-center text-muted">
                  需要入門幫助？<a href="https://casewhr.com/guide" style="color: #6366f1;"><strong>查看我們的完整指南</strong></a><br/>
                  📺 <a href="https://casewhr.com/tutorial" style="color: #6366f1;">觀看 3 分鐘教學影片</a>
                </p>
                
                <p class="text-center"><strong>歡迎加入！我們期待看到您的成功。<br/>Case Where 團隊</strong></p>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    // English Version
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Case Where</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header success">
                <h1>🎉 Welcome to Case Where!</h1>
              </div>
              
              <div class="content">
                <div class="emoji-large">👋</div>
                <p style="font-size: 18px;"><strong>Hi ${name},</strong></p>
                <p style="font-size: 16px;">Welcome to Case Where - your gateway to professional service talents!</p>
                <p>We're thrilled to have you join our community of talented professionals and clients.</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">💎 Who We Are</h3>
                  <p>Case Where is Taiwan's leading platform connecting businesses with verified professional talent. From web development to design, marketing to consulting - we have experts ready to bring your projects to life.</p>
                </div>
                
                <h3 class="text-center">Platform Highlights</h3>
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">10,000+</div>
                    <div class="stat-label">Active Professionals</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">50,000+</div>
                    <div class="stat-label">Projects Completed</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">95%</div>
                    <div class="stat-label">Client Satisfaction</div>
                  </div>
                </div>
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">Get Started in 3 Easy Steps:</h3>
                  <div style="margin: 16px 0;">
                    <strong>1. Complete Your Profile ✨</strong><br/>
                    <span class="text-muted">Add your skills, experience, and portfolio to stand out. Profiles with photos get 5x more views!</span>
                  </div>
                  <div style="margin: 16px 0;">
                    <strong>2. Explore Projects 🔍</strong><br/>
                    <span class="text-muted">Browse thousands of projects across 50+ categories. Use our smart filters to find perfect matches.</span>
                  </div>
                  <div style="margin: 16px 0;">
                    <strong>3. Start Earning 💰</strong><br/>
                    <span class="text-muted">Submit proposals, win projects, and get paid securely through our platform. Average response time: 24 hours.</span>
                  </div>
                </div>
                
                <div class="card success">
                  <h3>What You Can Do:</h3>
                  <ul style="line-height: 2;">
                    <li>📋 Browse 1,000+ new projects monthly across all industries</li>
                    <li>💼 Showcase your professional skills with unlimited portfolio items</li>
                    <li>💰 Secure payment system with escrow protection</li>
                    <li>⭐ Build your reputation with verified client reviews</li>
                    <li>🚀 Grow your freelance business with analytics and insights</li>
                    <li>🎓 Access free resources and learning materials</li>
                    <li>👥 Connect with a community of 10,000+ professionals</li>
                    <li>🔔 Get instant notifications for matching opportunities</li>
                  </ul>
                </div>
                
                <div class="alert info">
                  <strong>🎯 Quick Tips for Success</strong><br/><br/>
                  ✅ Complete your profile within 24 hours - complete profiles get 3x more inquiries<br/>
                  ✅ Upload 3-5 portfolio items showcasing your best work<br/>
                  ✅ Set up instant notifications to be first to respond<br/>
                  ✅ Write personalized proposals that address client needs
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
                  <h3 style="margin-top: 0; color: #92400e;">🎁 Special Welcome Offer</h3>
                  <p style="font-size: 16px; color: #78350f; margin: 0;"><strong>As a new member, enjoy your first month with 0% platform fee on all earnings!</strong></p>
                  <p style="font-size: 12px; color: #92400e; margin-top: 8px;">Valid for 30 days from signup</p>
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/profile" class="button success">Complete Your Profile Now</a>
                </div>
                
                <div class="divider"></div>
                
                <p class="text-center text-muted">
                  Need help getting started? <a href="https://casewhr.com/guide" style="color: #6366f1;"><strong>Check out our comprehensive guide</strong></a><br/>
                  📺 <a href="https://casewhr.com/tutorial" style="color: #6366f1;">Watch our 3-minute tutorial video</a>
                </p>
                
                <p class="text-center"><strong>Welcome aboard! We're excited to see you succeed.<br/>The Case Where Team</strong></p>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 💰 撥款通知郵件 - 單語言版本
export function getPaymentReceivedEmailSingleLanguage(params: {
  freelancerName: string;
  projectTitle: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feePercentage: number;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { freelancerName, projectTitle, grossAmount, platformFee, netAmount, feePercentage, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>款項已到賬</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header success">
                <h1>💰 款項已到賬！</h1>
              </div>
              
              <div class="content">
                <p><strong>${freelancerName}，您好！</strong></p>
                <div class="emoji-large">💸</div>
                <p style="font-size: 16px;"><strong>好消息！</strong>項目「<strong>${projectTitle}</strong>」的款項已成功釋放。</p>
                
                <div class="card success">
                  <h3 style="margin-top: 0;">💰 款項詳情</h3>
                  <div class="detail-row">
                    <span class="detail-label">總金額：</span>
                    <span class="detail-value">$${grossAmount.toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">平台費用 (${feePercentage}%)：</span>
                    <span class="detail-value" style="color: #6b7280;">-$${platformFee.toFixed(2)}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label" style="font-size: 18px; color: #10b981;">您收到：</span>
                    <span class="detail-value" style="font-size: 24px; color: #10b981; font-weight: 700;">$${netAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="alert success">
                  <strong>✅ 款項已添加到您的錢包</strong><br/>
                  您可以隨時提現到您的銀行帳戶。
                </div>
                
                <p style="text-align: center; font-size: 18px;"><strong>🎉 恭喜您成功完成項目！</strong></p>
                
                <div class="text-center">
                  <a href="https://casewhr.com/wallet" class="button success">查看錢包</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Received</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header success">
                <h1>💰 Payment Received!</h1>
              </div>
              
              <div class="content">
                <p><strong>Dear ${freelancerName},</strong></p>
                <div class="emoji-large">💸</div>
                <p style="font-size: 16px;"><strong>Great news!</strong> Payment for the project "<strong>${projectTitle}</strong>" has been successfully released.</p>
                
                <div class="card success">
                  <h3 style="margin-top: 0;">💰 Payment Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Gross Amount:</span>
                    <span class="detail-value">$${grossAmount.toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Platform Fee (${feePercentage}%):</span>
                    <span class="detail-value" style="color: #6b7280;">-$${platformFee.toFixed(2)}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label" style="font-size: 18px; color: #10b981;">You Received:</span>
                    <span class="detail-value" style="font-size: 24px; color: #10b981; font-weight: 700;">$${netAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div class="alert success">
                  <strong>✅ Funds Added to Your Wallet</strong><br/>
                  You can withdraw to your bank account anytime.
                </div>
                
                <p style="text-align: center; font-size: 18px;"><strong>🎉 Congratulations on completing the project!</strong></p>
                
                <div class="text-center">
                  <a href="https://casewhr.com/wallet" class="button success">View Wallet</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 🔐 密碼重設郵件 - 單語言版本
export function getPasswordResetEmailSingleLanguage(params: {
  userName: string;
  resetUrl: string;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { userName, resetUrl, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>重設密碼</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header info">
                <h1>🔐 重設您的密碼</h1>
              </div>
              
              <div class="content">
                <p><strong>親愛的 ${userName}，</strong></p>
                <p>我們收到了重設您密碼的請求。點擊下方按鈕以設置新密碼：</p>
                
                <div class="alert warning">
                  <strong>⚠️ 安全提示：</strong>
                  <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                    <li>此連結將在 <strong>1 小時後過期</strong></li>
                    <li>如果您沒有請求重設密碼，請忽略此郵件</li>
                    <li>請勿與他人分享此連結</li>
                  </ul>
                </div>
                
                <div class="text-center" style="margin: 40px 0;">
                  <a href="${resetUrl}" class="button">重設密碼</a>
                </div>
                
                <div class="card">
                  <h3 style="margin-top: 0;">🔒 為什麼選擇強密碼很重要？</h3>
                  <ul style="line-height: 2;">
                    <li>至少使用 8 個字符</li>
                    <li>包含大小寫字母、數字和特殊符號</li>
                    <li>避免使用常見詞彙或個人資訊</li>
                  </ul>
                </div>
                
                <p style="margin-top: 30px;">如果您有任何疑問，請隨時聯繫我們的客服團隊。</p>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header info">
                <h1>🔐 Reset Your Password</h1>
              </div>
              
              <div class="content">
                <p><strong>Dear ${userName},</strong></p>
                <p>We received a request to reset your password. Click the button below to set a new password:</p>
                
                <div class="alert warning">
                  <strong>⚠️ Security Notice:</strong>
                  <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                    <li>This link will <strong>expire in 1 hour</strong></li>
                    <li>If you didn't request a password reset, please ignore this email</li>
                    <li>Do not share this link with anyone</li>
                  </ul>
                </div>
                
                <div class="text-center" style="margin: 40px 0;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <div class="card">
                  <h3 style="margin-top: 0;">🔒 Why Strong Passwords Matter?</h3>
                  <ul style="line-height: 2;">
                    <li>Use at least 8 characters</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>Avoid common words or personal information</li>
                  </ul>
                </div>
                
                <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 📊 月度報告郵件 - 單語言版本
export function getMonthlyReportEmailSingleLanguage(params: {
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
  logoUrl?: string;
}): string {
  const { name, month, stats, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>月度報告</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header info">
                <h1>📊 您的 ${month} 月績效報告</h1>
              </div>
              
              <div class="content">
                <p><strong>${name}，您好！</strong></p>
                <p>這是您 ${month} 月的全面活動摘要。您一直在取得很好的進展！</p>
                
                <div class="emoji-large">📊</div>
                
                <h3 class="text-center">您的績效指標</h3>
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">${stats.proposalsSubmitted || 0}</div>
                    <div class="stat-label">提交的提案</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${stats.projectsCompleted || 0}</div>
                    <div class="stat-label">完成的項目</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${stats.averageRating?.toFixed(1) || '0.0'}</div>
                    <div class="stat-label">平均評分</div>
                  </div>
                </div>
                
                ${stats.earningsThisMonth ? `
                  <div class="card success">
                    <h3 style="margin-top: 0;">💰 收入摘要</h3>
                    <div class="detail-row">
                      <span class="detail-label">本月收入：</span>
                      <span class="detail-value" style="color: #10b981; font-size: 20px;">$${stats.earningsThisMonth.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">總收入：</span>
                      <span class="detail-value">$${stats.totalEarnings?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ` : ''}
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">🏆 本月成就</h3>
                  <ul style="line-height: 2;">
                    ${stats.projectsCompleted && stats.projectsCompleted >= 5 
                      ? '<li>✨ 超級表現者 - 完成 5+ 個項目！</li>' 
                      : '<li>🎯 良好開始 - 持續建立您的作品集</li>'}
                    ${stats.averageRating && stats.averageRating >= 4.5 
                      ? '<li>⭐ 頂級專業人士 - 保持 4.5+ 星！</li>' 
                      : '<li>📈 增長中的聲譽 - 保持高質量工作</li>'}
                    ${stats.earningsThisMonth && stats.earningsThisMonth > 1000 
                      ? '<li>💰 高收入者 - 本月突破 $1,000！</li>' 
                      : '<li>💼 建立您的業務 - 每個項目都很重要</li>'}
                  </ul>
                </div>
                
                <div class="alert info">
                  <strong>🎯 下月推薦行動</strong><br/><br/>
                  ✅ 用最近完成的項目更新您的作品集<br/>
                  ✅ 2 小時內回覆客戶訊息以提高參與度<br/>
                  ✅ 根據您不斷增長的經驗設定有競爭力的費率<br/>
                  ✅ 向滿意的客戶索取推薦和評價
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/analytics" class="button">查看詳細分析</a>
                </div>
                
                <p class="text-center"><strong>繼續保持出色的工作！我們為您的進步感到自豪。<br/>Case Where 團隊</strong></p>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Report</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header info">
                <h1>📊 Your ${month} Performance Report</h1>
              </div>
              
              <div class="content">
                <p><strong>Hi ${name},</strong></p>
                <p>Here's your comprehensive activity summary for ${month}. You've been making great progress!</p>
                
                <div class="emoji-large">📊</div>
                
                <h3 class="text-center">Your Performance Metrics</h3>
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">${stats.proposalsSubmitted || 0}</div>
                    <div class="stat-label">Proposals Submitted</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${stats.projectsCompleted || 0}</div>
                    <div class="stat-label">Projects Completed</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${stats.averageRating?.toFixed(1) || '0.0'}</div>
                    <div class="stat-label">Average Rating</div>
                  </div>
                </div>
                
                ${stats.earningsThisMonth ? `
                  <div class="card success">
                    <h3 style="margin-top: 0;">💰 Earnings Summary</h3>
                    <div class="detail-row">
                      <span class="detail-label">This Month:</span>
                      <span class="detail-value" style="color: #10b981; font-size: 20px;">$${stats.earningsThisMonth.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Total Earnings:</span>
                      <span class="detail-value">$${stats.totalEarnings?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ` : ''}
                
                <div class="highlight">
                  <h3 style="margin-top: 0;">🏆 This Month's Achievements</h3>
                  <ul style="line-height: 2;">
                    ${stats.projectsCompleted && stats.projectsCompleted >= 5 
                      ? '<li>✨ Super Performer - Completed 5+ projects!</li>' 
                      : '<li>🎯 Great Start - Keep building your portfolio</li>'}
                    ${stats.averageRating && stats.averageRating >= 4.5 
                      ? '<li>⭐ Top Rated Professional - Maintaining 4.5+ stars!</li>' 
                      : '<li>📈 Growing Reputation - Keep up the quality work</li>'}
                    ${stats.earningsThisMonth && stats.earningsThisMonth > 1000 
                      ? '<li>💰 High Earner - Crossed $1,000 this month!</li>' 
                      : '<li>���� Building Your Business - Every project counts</li>'}
                  </ul>
                </div>
                
                <div class="alert info">
                  <strong>🎯 Recommended Actions for Next Month</strong><br/><br/>
                  ✅ Update your portfolio with recent completed projects<br/>
                  ✅ Respond to client messages within 2 hours for better engagement<br/>
                  ✅ Set competitive rates based on your growing experience<br/>
                  ✅ Ask satisfied clients for testimonials and reviews
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/analytics" class="button">View Detailed Analytics</a>
                </div>
                
                <p class="text-center"><strong>Keep up the excellent work! We're proud of your progress.<br/>The Case Where Team</strong></p>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 💬 訊息通知郵件 - 單語言版本
export function getMessageNotificationEmailSingleLanguage(params: {
  name: string;
  senderName: string;
  messagePreview: string;
  projectTitle?: string;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { name, senderName, messagePreview, projectTitle, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>新訊息通知</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header info">
                <h1>💬 您有新訊息</h1>
              </div>
              
              <div class="content">
                <p><strong>${name}，您好！</strong></p>
                <p><strong>${senderName}</strong> 向您發送了一則新訊息${projectTitle ? `關於項目「${projectTitle}」` : ''}。</p>
                
                <div class="card">
                  <h3 style="margin-top: 0;">💬 訊息預覽</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #6366f1; font-style: italic; color: #4b5563;">
                    "${messagePreview}"
                  </div>
                </div>
                
                <div class="alert info">
                  <strong>💡 提示：</strong> 快速回覆能提高您的專業評分和獲得更多項目機會！
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/messages" class="button">查看並回覆</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header info">
                <h1>💬 You Have a New Message</h1>
              </div>
              
              <div class="content">
                <p><strong>Hi ${name},</strong></p>
                <p><strong>${senderName}</strong> sent you a new message${projectTitle ? ` regarding the project "${projectTitle}"` : ''}.</p>
                
                <div class="card">
                  <h3 style="margin-top: 0;">💬 Message Preview</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #6366f1; font-style: italic; color: #4b5563;">
                    "${messagePreview}"
                  </div>
                </div>
                
                <div class="alert info">
                  <strong>💡 Tip:</strong> Quick responses improve your professional rating and help you get more projects!
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/messages" class="button">View & Reply</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// 📋 項目推薦郵件 - 單語言版本
export function getProjectRecommendationEmailSingleLanguage(params: {
  name: string;
  projects: Array<{
    title: string;
    budget: string;
    category: string;
  }>;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { name, projects, language, logoUrl } = params;
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>項目推薦</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header">
                <h1>💼 為您推薦的項目</h1>
              </div>
              
              <div class="content">
                <p><strong>${name}，您好！</strong></p>
                <p>根據您的技能和經驗，我們為您找到了 ${projects.length} 個適合的項目機會：</p>
                
                ${projects.map((project, index) => `
                  <div class="card" style="margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #6366f1;">
                      ${index + 1}. ${project.title}
                    </h3>
                    <div class="detail-row" style="border: none; padding: 8px 0;">
                      <span class="detail-label">💰 預算：</span>
                      <span class="detail-value">${project.budget}</span>
                    </div>
                    <div class="detail-row" style="border: none; padding: 8px 0;">
                      <span class="detail-label">📁 類別：</span>
                      <span class="detail-value">${project.category}</span>
                    </div>
                  </div>
                `).join('')}
                
                <div class="alert info">
                  <strong>⚡ 快速行動！</strong><br/>
                  這些項目正在接受提案。早期提交的提案通常有更高的成功率。
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/projects" class="button">瀏覽所有項目</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Recommendations</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header">
                <h1>💼 Recommended Projects for You</h1>
              </div>
              
              <div class="content">
                <p><strong>Hi ${name},</strong></p>
                <p>Based on your skills and experience, we found ${projects.length} great project opportunities for you:</p>
                
                ${projects.map((project, index) => `
                  <div class="card" style="margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #6366f1;">
                      ${index + 1}. ${project.title}
                    </h3>
                    <div class="detail-row" style="border: none; padding: 8px 0;">
                      <span class="detail-label">💰 Budget:</span>
                      <span class="detail-value">${project.budget}</span>
                    </div>
                    <div class="detail-row" style="border: none; padding: 8px 0;">
                      <span class="detail-label">📁 Category:</span>
                      <span class="detail-value">${project.category}</span>
                    </div>
                  </div>
                `).join('')}
                
                <div class="alert info">
                  <strong>⚡ Act Fast!</strong><br/>
                  These projects are accepting proposals now. Early submissions typically have higher success rates.
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/projects" class="button">Browse All Projects</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// ⏰ 里程碑提醒郵件 - 單語言版本
export function getMilestoneReminderEmailSingleLanguage(params: {
  name: string;
  projectTitle: string;
  milestonesCompleted: number;
  totalMilestones: number;
  nextMilestone?: string;
  dueDate?: string;
  language: 'en' | 'zh';
  logoUrl?: string;
}): string {
  const { name, projectTitle, milestonesCompleted, totalMilestones, nextMilestone, dueDate, language, logoUrl } = params;
  const progress = Math.round((milestonesCompleted / totalMilestones) * 100);
  
  if (language === 'zh') {
    return `
      <!DOCTYPE html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>里程碑提醒</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'zh' })}
              
              <div class="header warning">
                <h1>⏰ 項目里程碑提醒</h1>
              </div>
              
              <div class="content">
                <p><strong>${name}，您好！</strong></p>
                <p>這是關於您的項目「<strong>${projectTitle}</strong>」的進度提醒。</p>
                
                <div class="card">
                  <h3 style="margin-top: 0;">📊 項目進度</h3>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%;">${progress}% 完成</div>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">已完成里程碑：</span>
                    <span class="detail-value">${milestonesCompleted} / ${totalMilestones}</span>
                  </div>
                </div>
                
                ${nextMilestone ? `
                  <div class="highlight">
                    <h3 style="margin-top: 0;">🎯 下一個里程碑</h3>
                    <p style="font-size: 16px; margin: 12px 0;"><strong>${nextMilestone}</strong></p>
                    ${dueDate ? `<p class="text-muted">⏱️ 截止日期：${dueDate}</p>` : ''}
                  </div>
                ` : ''}
                
                <div class="alert ${progress >= 80 ? 'success' : progress >= 50 ? 'info' : 'warning'}">
                  <strong>${progress >= 80 ? '🎉 做得很好！' : progress >= 50 ? '💪 繼續加油！' : '⚡ 需要加快進度'}</strong><br/>
                  ${progress >= 80 
                    ? '項目即將完成！保持這個節奏。' 
                    : progress >= 50 
                    ? '您已經完成一半了。繼續保持良好的工作。' 
                    : '請確保按時完成里程碑以維持良好的專業聲譽。'}
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/projects" class="button">查看項目詳情</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('zh')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Milestone Reminder</title>
          <style>${getEmailStyles()}</style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              ${getEmailHeaderSingleLanguage({ logoUrl, language: 'en' })}
              
              <div class="header warning">
                <h1>⏰ Project Milestone Reminder</h1>
              </div>
              
              <div class="content">
                <p><strong>Hi ${name},</strong></p>
                <p>This is a progress reminder for your project "<strong>${projectTitle}</strong>".</p>
                
                <div class="card">
                  <h3 style="margin-top: 0;">📊 Project Progress</h3>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%;">${progress}% Complete</div>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Milestones Completed:</span>
                    <span class="detail-value">${milestonesCompleted} / ${totalMilestones}</span>
                  </div>
                </div>
                
                ${nextMilestone ? `
                  <div class="highlight">
                    <h3 style="margin-top: 0;">🎯 Next Milestone</h3>
                    <p style="font-size: 16px; margin: 12px 0;"><strong>${nextMilestone}</strong></p>
                    ${dueDate ? `<p class="text-muted">⏱️ Due Date: ${dueDate}</p>` : ''}
                  </div>
                ` : ''}
                
                <div class="alert ${progress >= 80 ? 'success' : progress >= 50 ? 'info' : 'warning'}">
                  <strong>${progress >= 80 ? '🎉 Great Job!' : progress >= 50 ? '💪 Keep Going!' : '⚡ Time to Speed Up'}</strong><br/>
                  ${progress >= 80 
                    ? 'The project is almost done! Keep up the pace.' 
                    : progress >= 50 
                    ? 'You\'re halfway there. Keep up the good work.' 
                    : 'Please ensure milestones are completed on time to maintain your professional reputation.'}
                </div>
                
                <div class="text-center">
                  <a href="https://casewhr.com/projects" class="button">View Project Details</a>
                </div>
              </div>
              
              ${getEmailFooterSingleLanguage('en')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}