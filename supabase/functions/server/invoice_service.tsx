import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Helper function to safely get user from access token (supports dev mode)
async function getUserFromToken(c: any) {
  const authHeader = c.req.header('Authorization');
  const devToken = c.req.header('X-Dev-Token');
  
  // Priority: X-Dev-Token > Authorization token
  const tokenToCheck = devToken || authHeader?.split(' ')[1];
  
  if (!tokenToCheck) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // 🧪 DEV MODE: Handle mock tokens (dev-user-*)
  if (tokenToCheck.startsWith('dev-user-')) {
    console.log('🧪 [Invoice getUserFromToken] Dev mode detected:', tokenToCheck.substring(0, 30) + '...');
    
    let mockEmail = 'admin@casewhr.com';
    if (tokenToCheck.includes('||')) {
      const parts = tokenToCheck.split('||');
      mockEmail = parts[1] || mockEmail;
    }
    
    const mockUser = {
      id: tokenToCheck.split('||')[0],
      email: mockEmail,
      user_metadata: { name: 'Dev Mode User' },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ [Invoice getUserFromToken] Mock user:', { id: mockUser.id, email: mockUser.email });
    
    // 🔧 AUTO-CREATE ADMIN PROFILE IN DEV MODE
    const adminEmails = [
      'admin@casewhr.com',
      'davidjosephlai@gmail.com',
      'davidjosephlai@casewhr.com',
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com',
    ];
    
    if (adminEmails.includes(mockEmail.toLowerCase())) {
      const profileKey = `profile:${mockUser.id}`;
      const existingProfile = await kv.get(profileKey);
      
      if (!existingProfile) {
        console.log('🔧 [Invoice] Auto-creating admin profile for dev user');
        const adminProfile = {
          id: mockUser.id,
          email: mockEmail,
          name: 'Dev Admin User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(profileKey, adminProfile);
        console.log('✅ [Invoice] Admin profile created');
      } else if (existingProfile.role !== 'admin') {
        console.log('🔧 [Invoice] Upgrading existing profile to admin');
        existingProfile.role = 'admin';
        existingProfile.updated_at = new Date().toISOString();
        await kv.set(profileKey, existingProfile);
        console.log('✅ [Invoice] Profile upgraded to admin');
      }
    }
    
    return { user: mockUser, error: null };
  }
  
  // Real authentication
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: { user }, error } = await supabase.auth.getUser(tokenToCheck);
    if (error) {
      console.log('ℹ️ [Invoice getUserFromToken] Auth error:', error.message);
      return { user: null, error: { message: 'Invalid or expired token' } };
    }
    return { user, error: null };
  } catch (error: any) {
    console.log('⚠️ [Invoice getUserFromToken] Error:', error instanceof Error ? error.message : 'Unknown error');
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// 台湾电子发票接口
interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  transaction_id?: string;
  user_id: string;
  user_email: string;
  user_name: string;
  tax_id?: string; // 买方统一编号
  seller_tax_id: string; // 卖方统一编号
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: 'issued' | 'voided' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// 生成台湾发票号码（两位大写字母 + 8位数字）
async function generateInvoiceNumber(): Promise<string> {
  // 获取当月发票字轨头（如果已设置）
  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const prefixKey = `invoice_prefix:${currentYearMonth}`;
  const savedPrefix = await kv.get(prefixKey);
  
  let letters: string;
  if (savedPrefix && typeof savedPrefix === 'string' && /^[A-Z]{2}$/.test(savedPrefix)) {
    letters = savedPrefix;
    console.log(`✅ [Invoice] Using saved prefix for ${currentYearMonth}: ${letters}`);
  } else {
    // 如果没有设置字轨头，随机生成
    letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
              String.fromCharCode(65 + Math.floor(Math.random() * 26));
    console.log(`⚠️ [Invoice] No prefix set for ${currentYearMonth}, using random: ${letters}`);
  }
  
  const numbers = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `${letters}${numbers}`;
}

// 验证统一编号格式
function validateTaxId(taxId: string): boolean {
  return /^\d{8}$/.test(taxId);
}

// 创建发票
app.post('/invoices/create', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    // 验证必填字段
    if (!body.user_email || !body.user_name || !body.items || body.items.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // 验证统一编号格式
    if (body.tax_id && !validateTaxId(body.tax_id)) {
      return c.json({ error: 'Invalid tax ID format. Must be 8 digits.' }, 400);
    }

    if (!validateTaxId(body.seller_tax_id)) {
      return c.json({ error: 'Invalid seller tax ID format. Must be 8 digits.' }, 400);
    }

    // 计算金额
    const subtotal = body.items.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0);
    const taxRate = body.tax_rate || 0.05; // 台湾营业税 5%
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoice_number: body.invoice_number || await generateInvoiceNumber(),
      invoice_date: body.invoice_date || new Date().toISOString().split('T')[0],
      transaction_id: body.transaction_id,
      user_id: body.user_id || user.id,
      user_email: body.user_email,
      user_name: body.user_name,
      tax_id: body.tax_id,
      seller_tax_id: body.seller_tax_id,
      items: body.items,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total: total,
      currency: body.currency || 'TWD',
      status: 'issued',
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 保存发票到 KV store
    await kv.set(`invoice:${invoice.id}`, invoice);
    await kv.set(`invoice_by_number:${invoice.invoice_number}`, invoice.id);
    
    // 添加到用户的发票列表
    const userInvoicesKey = `user_invoices:${invoice.user_id}`;
    const userInvoices = await kv.get(userInvoicesKey) || [];
    userInvoices.push(invoice.id);
    await kv.set(userInvoicesKey, userInvoices);

    // 添加到全局发票列表
    const allInvoicesKey = 'all_invoices';
    const allInvoices = await kv.get(allInvoicesKey) || [];
    allInvoices.push(invoice.id);
    await kv.set(allInvoicesKey, allInvoices);

    console.log(`✅ Invoice created: ${invoice.invoice_number}`);

    // 自动发送发票邮件
    try {
      await sendInvoiceEmail(invoice);
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // 不阻止发票创建，仅记录错误
    }

    return c.json({ 
      success: true, 
      invoice,
      message: 'Invoice created successfully' 
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// 获取用户的发票列表
app.get('/user/invoices/:userId', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    const status = c.req.query('status');

    // 确保用户只能查看自己的发票
    if (user.id !== userId) {
      // 检查是否是管理员
      const profile = await kv.get(`profile:${user.id}`);
      if (!profile || profile.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    const userInvoicesKey = `user_invoices:${userId}`;
    const invoiceIds = await kv.get(userInvoicesKey) || [];

    let invoices: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = await kv.get(`invoice:${id}`);
      if (invoice) {
        if (!status || invoice.status === status) {
          invoices.push(invoice);
        }
      }
    }

    // 按日期降序排列
    invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ invoices });
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// 管理员获取所有发票
app.get('/admin/invoices', async (c) => {
  try {
    console.log('📄 [Invoice Service] Admin invoices request received');
    
    const { user, error } = await getUserFromToken(c);
    
    console.log('📄 [Invoice Service] getUserFromToken result:', { 
      userId: user?.id, 
      userEmail: user?.email,
      error: error?.message 
    });
    
    if (error || !user) {
      console.log('❌ [Invoice Service] Unauthorized - no user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 验证管理员权限
    const profile = await kv.get(`profile:${user.id}`);
    console.log('📄 [Invoice Service] User profile:', { 
      userId: user.id, 
      role: profile?.role,
      hasProfile: !!profile 
    });
    
    if (!profile || profile.role !== 'admin') {
      console.log('❌ [Invoice Service] Forbidden - user is not admin');
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const status = c.req.query('status');
    const allInvoicesKey = 'all_invoices';
    const invoiceIds = await kv.get(allInvoicesKey) || [];

    console.log('📄 [Invoice Service] Invoice IDs from KV:', invoiceIds.length);

    let invoices: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = await kv.get(`invoice:${id}`);
      if (invoice) {
        if (!status || invoice.status === status) {
          invoices.push(invoice);
        }
      }
    }

    // 按日期降序排列
    invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('✅ [Invoice Service] Returning invoices:', invoices.length);
    return c.json({ invoices });
  } catch (error) {
    console.error('❌ [Invoice Service] Error fetching admin invoices:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// 获取单张发票详情
app.get('/invoices/:invoiceId', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('invoiceId');
    const invoice = await kv.get(`invoice:${invoiceId}`);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // 确保用户只能查看自己的发票
    if (invoice.user_id !== user.id) {
      const profile = await kv.get(`profile:${user.id}`);
      if (!profile || profile.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    return c.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return c.json({ error: 'Failed to fetch invoice' }, 500);
  }
});

// 作废发票
app.post('/invoices/:invoiceId/void', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 验证管理员权限
    const profile = await kv.get(`profile:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const invoiceId = c.req.param('invoiceId');
    const invoice = await kv.get(`invoice:${invoiceId}`);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    if (invoice.status !== 'issued') {
      return c.json({ error: 'Only issued invoices can be voided' }, 400);
    }

    invoice.status = 'voided';
    invoice.updated_at = new Date().toISOString();

    await kv.set(`invoice:${invoiceId}`, invoice);

    console.log(`✅ Invoice voided: ${invoice.invoice_number}`);

    return c.json({ 
      success: true, 
      invoice,
      message: 'Invoice voided successfully' 
    });
  } catch (error) {
    console.error('Error voiding invoice:', error);
    return c.json({ error: 'Failed to void invoice' }, 500);
  }
});

// 生成发票 PDF
app.get('/invoices/:invoiceId/pdf', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('invoiceId');
    const invoice = await kv.get(`invoice:${invoiceId}`);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // 确保用户只能下载自己的发票
    if (invoice.user_id !== user.id) {
      const profile = await kv.get(`profile:${user.id}`);
      if (!profile || profile.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    // 生成 HTML 发票（简化版，实际应使用 PDF 生成库）
    const html = generateInvoiceHTML(invoice);

    return c.html(html);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return c.json({ error: 'Failed to generate PDF' }, 500);
  }
});

// 发送发票邮件
app.post('/invoices/:invoiceId/send-email', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('invoiceId');
    const invoice = await kv.get(`invoice:${invoiceId}`);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    await sendInvoiceEmail(invoice);

    return c.json({ 
      success: true,
      message: 'Invoice email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return c.json({ error: 'Failed to send invoice email' }, 500);
  }
});

// ========== 发票字轨头管理 API ==========

// 设置当月发票字轨头（管理员专用）
app.post('/admin/invoices/set-prefix', async (c) => {
  try {
    console.log('🔧 [Invoice Prefix] Set prefix request received');
    
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      console.log('❌ [Invoice Prefix] Unauthorized - no user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 验证管理员权限
    const profile = await kv.get(`profile:${user.id}`);
    console.log('🔧 [Invoice Prefix] User profile:', { 
      userId: user.id, 
      role: profile?.role,
      hasProfile: !!profile 
    });
    
    if (!profile || profile.role !== 'admin') {
      console.log('❌ [Invoice Prefix] Forbidden - user is not admin');
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { prefix, yearMonth } = body;
    
    // 验证字轨头格式（必须是两位大写字母）
    if (!prefix || !/^[A-Z]{2}$/.test(prefix)) {
      return c.json({ 
        error: 'Invalid prefix format. Must be exactly 2 uppercase letters (e.g., AB, XY)' 
      }, 400);
    }
    
    // 验证年月格式
    if (!yearMonth || !/^\\d{4}-\\d{2}$/.test(yearMonth)) {
      return c.json({ 
        error: 'Invalid year-month format. Must be YYYY-MM (e.g., 2025-01)' 
      }, 400);
    }
    
    // 保存字轨头
    const prefixKey = `invoice_prefix:${yearMonth}`;
    await kv.set(prefixKey, prefix);
    
    console.log(`✅ [Invoice Prefix] Set prefix for ${yearMonth}: ${prefix}`);
    
    return c.json({ 
      success: true,
      yearMonth,
      prefix,
      message: `Invoice prefix for ${yearMonth} set to ${prefix}` 
    });
  } catch (error) {
    console.error('❌ [Invoice Prefix] Error setting prefix:', error);
    return c.json({ error: 'Failed to set invoice prefix' }, 500);
  }
});

// 获取当月发票字轨头（管理员专用）
app.get('/admin/invoices/prefix/:yearMonth', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 验证管理员权限
    const profile = await kv.get(`profile:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const yearMonth = c.req.param('yearMonth');
    const prefixKey = `invoice_prefix:${yearMonth}`;
    const prefix = await kv.get(prefixKey);
    
    return c.json({ 
      yearMonth,
      prefix: prefix || null,
      hasPrefix: !!prefix
    });
  } catch (error) {
    console.error('Error fetching invoice prefix:', error);
    return c.json({ error: 'Failed to fetch invoice prefix' }, 500);
  }
});

// 获取所有已设置的发票字轨头（管理员专用）
app.get('/admin/invoices/prefixes', async (c) => {
  try {
    const { user, error } = await getUserFromToken(c);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 验证管理员权限
    const profile = await kv.get(`profile:${user.id}`);
    if (!profile || profile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // 获取所有以 'invoice_prefix:' 开头的键
    const prefixes = await kv.getByPrefix('invoice_prefix:');
    
    // 转换为易于使用的格式
    const prefixList = prefixes.map((item: any) => {
      const yearMonth = item.key.replace('invoice_prefix:', '');
      return {
        yearMonth,
        prefix: item.value,
      };
    });
    
    // 按年月降序排列
    prefixList.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
    
    return c.json({ prefixes: prefixList });
  } catch (error) {
    console.error('Error fetching invoice prefixes:', error);
    return c.json({ error: 'Failed to fetch invoice prefixes' }, 500);
  }
});

// ========== 原有的邮件和 HTML 生成函数 ==========

// 发送发票邮件函数
async function sendInvoiceEmail(invoice: Invoice) {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const emailHTML = generateInvoiceEmailHTML(invoice);

  const emailData = {
    sender: {
      name: 'CaseWhr 财务部',
      email: 'finance@casewhr.com'
    },
    to: [{
      email: invoice.user_email,
      name: invoice.user_name
    }],
    subject: `电子发票 ${invoice.invoice_number} - CaseWhr`,
    htmlContent: emailHTML,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send invoice email: ${error}`);
  }

  console.log(`✅ Invoice email sent to ${invoice.user_email}`);
}

// 生成发票邮件 HTML
function generateInvoiceEmailHTML(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; }
    .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 您的电子发票已开立</h1>
      <p>Your Electronic Invoice Has Been Issued</p>
    </div>
    
    <div class="content">
      <p>亲爱的 ${invoice.user_name}，</p>
      
      <p>感谢您使用 CaseWhr 接案平台！您的电子发票已经开立，详情如下：</p>
      
      <div class="invoice-box">
        <h3>发票信息 Invoice Information</h3>
        <table>
          <tr>
            <td>发票号码 Invoice Number:</td>
            <td class="text-right"><strong>${invoice.invoice_number}</strong></td>
          </tr>
          <tr>
            <td>开票日期 Invoice Date:</td>
            <td class="text-right">${invoice.invoice_date}</td>
          </tr>
          <tr>
            <td>金额 Amount:</td>
            <td class="text-right">${invoice.currency} ${invoice.subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td>营业税 Tax (5%):</td>
            <td class="text-right">${invoice.currency} ${invoice.tax_amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>总计 Total:</strong></td>
            <td class="text-right"><strong>${invoice.currency} ${invoice.total.toLocaleString()}</strong></td>
          </tr>
        </table>

        <h4>明细 Items:</h4>
        <table>
          <thead>
            <tr>
              <th>品名 Description</th>
              <th class="text-right">金额 Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${invoice.currency} ${item.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <p style="text-align: center;">
        <a href="https://casewhr.com/dashboard?tab=invoices" class="button">查看发票详情 View Invoice Details</a>
      </p>

      <p style="color: #666; font-size: 14px;">
        💡 提示：您可以随时在个人中心下载发票 PDF。<br>
        Tip: You can download the invoice PDF anytime from your dashboard.
      </p>
    </div>
    
    <div class="footer">
      <p>此邮件由系统自动发送，请勿回复<br>This is an automated email, please do not reply</p>
      <p>CaseWhr 全球接案平台 | www.casewhr.com</p>
      <p style="font-size: 10px; color: #999;">
        卖方统一编号 Seller Tax ID: ${invoice.seller_tax_id}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export default app;

// ========== 導出的工具函數 ==========

// 發票詳情介面（用於生成 HTML）
export interface InvoiceDetails {
  customer_name: string;
  customer_email: string;
  customer_address?: string;
  company_name: string;
  company_address: string;
  company_tax_id: string;
  company_email: string;
}

// 生成訂閱發票的函數
export function createSubscriptionInvoice(params: {
  userId: string;
  plan: string;
  amount: number;
  transactionId: string;
  language: 'en' | 'zh' | 'zh-CN' | 'zh-TW';
  currency: string;
}) {
  const { userId, plan, amount, transactionId, language, currency } = params;
  
  // 生成發票號碼
  const invoiceNumber = generateInvoiceNumberSync();
  
  // 訂閱計劃名稱映射
  const planNames: Record<string, { en: string; zh: string }> = {
    basic: { en: 'Basic Plan', zh: '基礎方案' },
    pro: { en: 'Pro Plan', zh: '專業方案' },
    enterprise: { en: 'Enterprise Plan', zh: '企業方案' },
  };
  
  const planName = planNames[plan] || { en: plan, zh: plan };
  const description = language === 'en' ? planName.en : planName.zh;
  
  // 計算稅金（台灣營業稅 5%）
  const subtotal = amount;
  const taxRate = 0.05;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  return {
    invoice_number: invoiceNumber,
    invoice_date: new Date().toISOString().split('T')[0],
    transaction_id: transactionId,
    user_id: userId,
    items: [
      {
        description: `${description} - Subscription`,
        quantity: 1,
        unit_price: amount,
        amount: amount,
      },
    ],
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total,
    currency: currency || 'USD',
    status: 'issued' as const,
  };
}

// 同步生成發票號碼（簡化版，不查詢 KV）
function generateInvoiceNumberSync(): string {
  // 生成兩位大寫字母
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  // 生成 8 位數字
  const numbers = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  
  return `${letters}${numbers}`;
}

// 生成帶詳細信息的發票 HTML
export function generateInvoiceHTML(
  invoice: any,
  details?: InvoiceDetails,
  language?: 'en' | 'zh' | 'zh-CN' | 'zh-TW'
): string {
  const lang = language || 'zh-TW';
  const isEnglish = lang === 'en';
  
  // 如果沒有提供詳細信息，使用默認值
  const customerName = details?.customer_name || invoice.user_name || 'Customer';
  const customerEmail = details?.customer_email || invoice.user_email || '';
  const companyName = details?.company_name || 'Case Where 接得準公司';
  const companyAddress = details?.company_address || 'Taiwan';
  const companyTaxId = details?.company_tax_id || '12345678';
  const sellerTaxId = invoice.seller_tax_id || companyTaxId;
  
  return `
<!DOCTYPE html>
<html lang="${isEnglish ? 'en' : 'zh-TW'}">
<head>
  <meta charset="UTF-8">
  <title>${isEnglish ? 'Invoice' : '電子發票'} ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .invoice-title { font-size: 24px; margin-bottom: 10px; }
    .invoice-number { font-size: 18px; color: #666; }
    .section { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .label { color: #666; font-size: 12px; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; }
    .text-right { text-align: right; }
    .total-section { margin-top: 20px; float: right; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-final { border-top: 2px solid #333; padding-top: 8px; font-size: 18px; }
    .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="invoice-title">${isEnglish ? 'Electronic Invoice' : '電子發票'}</div>
    <div class="invoice-number">${invoice.invoice_number}</div>
  </div>

  <div class="section grid">
    <div>
      <div class="label">${isEnglish ? 'Seller' : '賣方'}</div>
      <div>${companyName}</div>
      <div>${isEnglish ? 'Tax ID' : '統一編號'}: ${sellerTaxId}</div>
      <div>${companyAddress}</div>
    </div>
    <div>
      <div class="label">${isEnglish ? 'Buyer' : '買方'}</div>
      <div>${customerName}</div>
      <div>${customerEmail}</div>
      ${invoice.tax_id ? `<div>${isEnglish ? 'Tax ID' : '統一編號'}: ${invoice.tax_id}</div>` : ''}
    </div>
  </div>

  <div class="section grid">
    <div>
      <div class="label">${isEnglish ? 'Invoice Date' : '開票日期'}</div>
      <div>${invoice.invoice_date}</div>
    </div>
    <div>
      <div class="label">${isEnglish ? 'Currency' : '幣別'}</div>
      <div>${invoice.currency}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isEnglish ? 'Description' : '品名'}</th>
        <th class="text-right">${isEnglish ? 'Quantity' : '數量'}</th>
        <th class="text-right">${isEnglish ? 'Unit Price' : '單價'}</th>
        <th class="text-right">${isEnglish ? 'Amount' : '金額'}</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map((item: InvoiceItem) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${invoice.currency} ${item.unit_price.toLocaleString()}</td>
          <td class="text-right">${invoice.currency} ${item.amount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span>${isEnglish ? 'Subtotal' : '小計'}:</span>
      <span>${invoice.currency} ${invoice.subtotal.toLocaleString()}</span>
    </div>
    <div class="total-row">
      <span>${isEnglish ? 'Tax' : '營業稅'} (${(invoice.tax_rate * 100).toFixed(0)}%):</span>
      <span>${invoice.currency} ${invoice.tax_amount.toLocaleString()}</span>
    </div>
    <div class="total-row total-final">
      <span>${isEnglish ? 'Total' : '總計'}:</span>
      <span>${invoice.currency} ${invoice.total.toLocaleString()}</span>
    </div>
  </div>

  <div style="clear: both;"></div>

  ${invoice.notes ? `
    <div class="section">
      <div class="label">${isEnglish ? 'Notes' : '備註'}</div>
      <div>${invoice.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    <div>${isEnglish 
      ? 'This invoice is issued in accordance with Taiwan tax law' 
      : '此發票依台灣稅法開立'}</div>
    <div>${companyName} | www.casewhr.com</div>
  </div>
</body>
</html>
  `;
}