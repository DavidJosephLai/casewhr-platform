import * as kv from './kv_store.tsx';

/**
 * 品牌化郵件助手
 * 為企業用戶自動添加品牌 Logo 和顏色到郵件模板
 */

interface BrandingConfig {
  logo_url?: string;
  company_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  email_footer?: string;
}

/**
 * 獲取用戶品牌設置
 */
export async function getUserBranding(userId: string): Promise<BrandingConfig | null> {
  try {
    console.log('🔍 [getUserBranding] Fetching branding for userId:', userId);
    
    // Try new format first
    const brandingNew = await kv.get(`branding:${userId}`);
    console.log('🔍 [getUserBranding] Tried branding:userId format:', {
      found: !!brandingNew,
      data: brandingNew
    });
    
    if (brandingNew) {
      console.log('✅ [getUserBranding] Found branding with new format (branding:userId)');
      return brandingNew as BrandingConfig;
    }
    
    // Try old format as fallback
    const brandingOld = await kv.get(`branding_${userId}`);
    console.log('🔍 [getUserBranding] Tried branding_userId format:', {
      found: !!brandingOld,
      data: brandingOld
    });
    
    if (brandingOld) {
      console.log('✅ [getUserBranding] Found branding with old format (branding_userId)');
      return brandingOld as BrandingConfig;
    }
    
    console.log('ℹ️ [getUserBranding] No branding found for userId:', userId);
    return null;
  } catch (error) {
    console.error('❌ [getUserBranding] Error fetching user branding:', error);
    return null;
  }
}

/**
 * 將品牌 Logo 和顏色注入到郵件 HTML 中
 */
export function injectBranding(emailHtml: string, branding: BrandingConfig | null): string {
  if (!branding) {
    return emailHtml;
  }

  console.log('🎨 [BrandedEmail] Injecting branding:', {
    hasLogo: !!branding.logo_url,
    logoUrl: branding.logo_url,
    companyName: branding.company_name,
    hasPrimaryColor: !!branding.primary_color,
    hasEmailFooter: !!branding.email_footer
  });

  let brandedHtml = emailHtml;

  // 1. 插入 Logo（在 header 頂部）
  if (branding.logo_url) {
    const logoHtml = `
      <div style="text-align: center; padding: 20px 0 10px 0;">
        <img src="${branding.logo_url}" alt="${branding.company_name || 'Company Logo'}" style="max-height: 60px; max-width: 200px; object-fit: contain;" />
      </div>
    `;
    
    // 在 header div 開始後插入 logo
    const beforeReplace = brandedHtml;
    brandedHtml = brandedHtml.replace(
      /<div class="header">/,
      `<div class="header">${logoHtml}`
    );
    
    if (beforeReplace === brandedHtml) {
      console.warn('⚠️ [BrandedEmail] Failed to inject logo - header class not found');
    } else {
      console.log('✅ [BrandedEmail] Logo injected successfully');
    }
  }

  // 2. 替換品牌顏色
  if (branding.primary_color) {
    // 替換漸變背景色
    brandedHtml = brandedHtml.replace(
      /background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\)/g,
      `background: linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color || branding.primary_color} 100%)`
    );
    
    // 替換按鈕顏色
    brandedHtml = brandedHtml.replace(
      /background: #667eea/g,
      `background: ${branding.primary_color}`
    );
  }

  // 3. 添加自訂頁尾
  if (branding.email_footer) {
    const customFooter = `
      <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center; color: #6b7280; font-size: 14px;">
        ${branding.email_footer}
      </div>
    `;
    
    // 在官方頁尾之前插入自訂頁尾
    brandedHtml = brandedHtml.replace(
      /<div class="footer">/,
      `${customFooter}<div class="footer">`
    );
  }

  // 4. 替換公司名稱（如果有設置）
  if (branding.company_name) {
    // 在 footer 中顯示公司名稱
    brandedHtml = brandedHtml.replace(
      /© 2024 Case Where 接得準股份有限公司/g,
      `© 2024 ${branding.company_name} | Powered by Case Where`
    );
  }

  return brandedHtml;
}

/**
 * 發送品牌化郵件
 * 自動獲取用戶品牌並注入到郵件中
 */
export async function sendBrandedEmail(
  userId: string,
  emailHtml: string,
  to: string,
  subject: string,
  sendEmailFn: (params: { to: string; subject: string; html: string }) => Promise<any>
): Promise<any> {
  try {
    // 獲取用戶品牌
    const branding = await getUserBranding(userId);
    
    // 注入品牌
    const brandedHtml = injectBranding(emailHtml, branding);
    
    console.log(`📧 [BrandedEmail] Sending to ${to}`, {
      userId,
      hasBranding: !!branding,
      hasLogo: !!branding?.logo_url,
      companyName: branding?.company_name
    });
    
    // 發送郵件
    return await sendEmailFn({
      to,
      subject,
      html: brandedHtml
    });
  } catch (error) {
    console.error('Error sending branded email:', error);
    throw error;
  }
}

/**
 * 生成品牌化的郵件頁首 HTML
 */
export function getBrandedHeader(branding: BrandingConfig | null, title: string): string {
  const primaryColor = branding?.primary_color || '#667eea';
  const secondaryColor = branding?.secondary_color || '#764ba2';
  
  return `
    <div class="header" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      ${branding?.logo_url ? `
        <div style="padding-bottom: 20px;">
          <img src="${branding.logo_url}" alt="${branding.company_name || 'Company Logo'}" style="max-height: 60px; max-width: 200px;" />
        </div>
      ` : ''}
      <h1 style="margin: 0; font-size: 28px;">${title}</h1>
    </div>
  `;
}

/**
 * 生成品牌化的郵件頁尾 HTML
 */
export function getBrandedFooter(branding: BrandingConfig | null): string {
  return `
    ${branding?.email_footer ? `
      <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center; color: #6b7280; font-size: 14px;">
        ${branding.email_footer}
      </div>
    ` : ''}
    <div class="footer" style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
      © 2024 ${branding?.company_name || 'Case Where 接得準股份有限公司'}${branding?.company_name ? ' | Powered by Case Where' : ''}
    </div>
  `;
}