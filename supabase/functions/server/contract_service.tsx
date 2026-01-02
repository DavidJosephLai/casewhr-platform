import * as kv from "./kv_store.tsx";

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description: string;
  client_id: string;
  client_name?: string;
  freelancer_id: string;
  freelancer_name?: string;
  project_id?: string;
  project_title?: string;
  status: 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'cancelled';
  amount: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  payment_terms: string;
  deliverables: string;
  terms_and_conditions: string;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  client_signature?: string;
  freelancer_signature?: string;
}

export interface CreateContractInput {
  title: string;
  description: string;
  client_id: string;
  freelancer_id: string;
  project_id?: string;
  amount: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  payment_terms: string;
  deliverables: string;
  terms_and_conditions: string;
}

/**
 * Generate a unique contract number
 */
export function generateContractNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CT-${timestamp}-${random}`;
}

/**
 * Create a new contract
 */
export async function createContract(input: CreateContractInput, userId: string): Promise<Contract> {
  const contractId = `contract_${Date.now()}_${userId}`;
  const contractNumber = generateContractNumber();
  
  const contract: Contract = {
    id: contractId,
    contract_number: contractNumber,
    title: input.title,
    description: input.description,
    client_id: input.client_id,
    freelancer_id: input.freelancer_id,
    project_id: input.project_id,
    status: 'draft',
    amount: input.amount,
    currency: input.currency,
    start_date: input.start_date,
    end_date: input.end_date,
    payment_terms: input.payment_terms,
    deliverables: input.deliverables,
    terms_and_conditions: input.terms_and_conditions,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  await kv.set(contractId, contract);
  
  return contract;
}

/**
 * Get contract by ID
 */
export async function getContract(contractId: string): Promise<Contract | null> {
  const contract = await kv.get(contractId);
  return contract as Contract | null;
}

/**
 * Get all contracts for a user (client or freelancer)
 */
export async function getUserContracts(userId: string): Promise<Contract[]> {
  try {
    const allContracts = await kv.getByPrefix('contract_');
    
    if (!Array.isArray(allContracts)) {
      return [];
    }
    
    // Filter contracts where user is either client or freelancer
    const userContracts = allContracts.filter(
      (contract: any) => 
        contract?.client_id === userId || 
        contract?.freelancer_id === userId
    );
    
    // Sort by creation date, newest first
    return userContracts.sort(
      (a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching user contracts:', error);
    return [];
  }
}

/**
 * Update contract
 */
export async function updateContract(
  contractId: string, 
  updates: Partial<Contract>
): Promise<Contract | null> {
  const contract = await kv.get(contractId);
  
  if (!contract) {
    return null;
  }
  
  const updatedContract = {
    ...contract,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  await kv.set(contractId, updatedContract);
  
  return updatedContract as Contract;
}

/**
 * Update contract status
 */
export async function updateContractStatus(
  contractId: string,
  status: Contract['status']
): Promise<Contract | null> {
  const contract = await kv.get(contractId);
  
  if (!contract) {
    return null;
  }
  
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  // If signing, add signature timestamp
  if (status === 'signed' && contract.status !== 'signed') {
    updates.signed_at = new Date().toISOString();
  }
  
  const updatedContract = {
    ...contract,
    ...updates,
  };
  
  await kv.set(contractId, updatedContract);
  
  return updatedContract as Contract;
}

/**
 * Sign contract
 */
export async function signContract(
  contractId: string,
  userId: string,
  signature: string
): Promise<Contract | null> {
  const contract = await kv.get(contractId);
  
  if (!contract) {
    return null;
  }
  
  const updates: any = {
    updated_at: new Date().toISOString(),
  };
  
  // Determine if user is client or freelancer
  if (contract.client_id === userId) {
    updates.client_signature = signature;
  } else if (contract.freelancer_id === userId) {
    updates.freelancer_signature = signature;
  } else {
    throw new Error('User is not authorized to sign this contract');
  }
  
  // If both parties have signed, update status
  if (
    (updates.client_signature || contract.client_signature) &&
    (updates.freelancer_signature || contract.freelancer_signature)
  ) {
    updates.status = 'signed';
    updates.signed_at = new Date().toISOString();
  }
  
  const updatedContract = {
    ...contract,
    ...updates,
  };
  
  await kv.set(contractId, updatedContract);
  
  return updatedContract as Contract;
}

/**
 * Delete contract
 */
export async function deleteContract(contractId: string): Promise<boolean> {
  try {
    await kv.del(contractId);
    return true;
  } catch (error) {
    console.error('Error deleting contract:', error);
    return false;
  }
}

/**
 * Generate contract HTML for preview/download
 */
export function generateContractHTML(
  contract: Contract,
  language: 'en' | 'zh' = 'en'
): string {
  const t = language === 'en' ? {
    contract: 'Contract',
    contractNumber: 'Contract Number',
    date: 'Date',
    parties: 'Parties',
    client: 'Client',
    freelancer: 'Freelancer',
    projectDetails: 'Project Details',
    project: 'Project',
    amount: 'Amount',
    startDate: 'Start Date',
    endDate: 'End Date',
    paymentTerms: 'Payment Terms',
    deliverables: 'Deliverables',
    termsAndConditions: 'Terms and Conditions',
    signatures: 'Signatures',
    clientSignature: 'Client Signature',
    freelancerSignature: 'Freelancer Signature',
    signedDate: 'Signed Date',
    status: 'Status',
  } : {
    contract: '合約',
    contractNumber: '合約編號',
    date: '日期',
    parties: '參與方',
    client: '客戶',
    freelancer: '自由工作者',
    projectDetails: '項目詳情',
    project: '項目',
    amount: '金額',
    startDate: '開始日期',
    endDate: '結束日期',
    paymentTerms: '付款條款',
    deliverables: '交付物',
    termsAndConditions: '條款與細則',
    signatures: '簽名',
    clientSignature: '客戶簽名',
    freelancerSignature: '自由工作者簽名',
    signedDate: '簽署日期',
    status: '狀態',
  };

  const statusLabels = {
    en: {
      draft: 'Draft',
      sent: 'Sent',
      signed: 'Signed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    zh: {
      draft: '草稿',
      sent: '已發送',
      signed: '已簽署',
      active: '進行中',
      completed: '已完成',
      cancelled: '已取消',
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html lang="${language === 'en' ? 'en' : 'zh-TW'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.contract} - ${contract.contract_number}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .contract-container {
      background: white;
      padding: 60px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #8b5cf6;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #8b5cf6;
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .contract-number {
      color: #6b7280;
      font-size: 16px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
      background: ${contract.status === 'signed' ? '#dcfce7' : '#dbeafe'};
      color: ${contract.status === 'signed' ? '#166534' : '#1e40af'};
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .info-value {
      color: #1f2937;
      font-size: 16px;
    }
    .amount {
      font-size: 24px;
      font-weight: 700;
      color: #059669;
    }
    .content-block {
      background: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin-top: 10px;
      white-space: pre-wrap;
      border-left: 4px solid #8b5cf6;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 40px;
      border-top: 2px solid #e5e7eb;
    }
    .signature-box {
      text-align: center;
    }
    .signature-line {
      border-top: 2px solid #333;
      margin: 60px 20px 10px;
      padding-top: 10px;
    }
    .signature-name {
      font-weight: 600;
      color: #1f2937;
    }
    .signature-date {
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body {
        background: white;
      }
      .contract-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="contract-container">
    <div class="header">
      <h1>${contract.title}</h1>
      <div class="contract-number">${t.contractNumber}: ${contract.contract_number}</div>
      <div class="status-badge">${statusLabels[language][contract.status]}</div>
    </div>

    <div class="section">
      <div class="section-title">${t.parties}</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">${t.client}</div>
          <div class="info-value">${contract.client_name || contract.client_id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${t.freelancer}</div>
          <div class="info-value">${contract.freelancer_name || contract.freelancer_id}</div>
        </div>
      </div>
    </div>

    ${contract.description ? `
    <div class="section">
      <div class="section-title">${language === 'en' ? 'Description' : '描述'}</div>
      <div class="content-block">${contract.description}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">${t.projectDetails}</div>
      <div class="info-grid">
        ${contract.project_title ? `
        <div class="info-item">
          <div class="info-label">${t.project}</div>
          <div class="info-value">${contract.project_title}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">${t.amount}</div>
          <div class="info-value amount">${contract.currency === 'USD' ? '$' : 'NT$'}${contract.amount.toLocaleString()}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${t.startDate}</div>
          <div class="info-value">${formatDate(contract.start_date)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${t.endDate}</div>
          <div class="info-value">${formatDate(contract.end_date)}</div>
        </div>
      </div>
    </div>

    ${contract.payment_terms ? `
    <div class="section">
      <div class="section-title">${t.paymentTerms}</div>
      <div class="content-block">${contract.payment_terms}</div>
    </div>
    ` : ''}

    ${contract.deliverables ? `
    <div class="section">
      <div class="section-title">${t.deliverables}</div>
      <div class="content-block">${contract.deliverables}</div>
    </div>
    ` : ''}

    ${contract.terms_and_conditions ? `
    <div class="section">
      <div class="section-title">${t.termsAndConditions}</div>
      <div class="content-block">${contract.terms_and_conditions}</div>
    </div>
    ` : ''}

    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line">
          ${contract.client_signature ? `<div>${contract.client_signature}</div>` : ''}
        </div>
        <div class="signature-name">${t.clientSignature}</div>
        ${contract.signed_at ? `<div class="signature-date">${formatDate(contract.signed_at)}</div>` : ''}
      </div>
      <div class="signature-box">
        <div class="signature-line">
          ${contract.freelancer_signature ? `<div>${contract.freelancer_signature}</div>` : ''}
        </div>
        <div class="signature-name">${t.freelancerSignature}</div>
        ${contract.signed_at ? `<div class="signature-date">${formatDate(contract.signed_at)}</div>` : ''}
      </div>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      ${language === 'en' ? 'Generated on' : '生成於'} ${formatDate(new Date().toISOString())}
    </div>
  </div>
</body>
</html>
  `.trim();
}
