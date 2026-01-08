// 🔧 Fix PayPal Transaction Key Format
// This tool migrates old PayPal transactions from "transaction:" to "transaction_" format

import * as kv from './kv_store.tsx';

/**
 * Fix PayPal transaction key format
 * Migrates from old format (transaction:txn_xxx) to new format (transaction_txn_xxx)
 */
export async function fixPayPalTransactionKeys(): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> {
  console.log('🔧 [PayPal Fix] Starting transaction key migration...');
  
  let migratedCount = 0;
  const errors: string[] = [];
  
  try {
    // Get all keys with old format
    const oldTransactions = await kv.getByPrefix('transaction:txn_') || [];
    
    console.log(`📊 [PayPal Fix] Found ${oldTransactions.length} old format transactions`);
    
    for (const oldTransaction of oldTransactions) {
      try {
        // Extract transaction ID from old key
        const oldKey = oldTransaction.id || '';
        const transactionId = oldKey.replace('transaction:', '');
        
        if (!transactionId) {
          console.warn('⚠️ [PayPal Fix] Invalid transaction key:', oldKey);
          continue;
        }
        
        // Create new key
        const newKey = `transaction_${transactionId}`;
        
        // Check if new key already exists
        const existing = await kv.get(newKey);
        if (existing) {
          console.log(`⏭️ [PayPal Fix] Transaction already migrated: ${transactionId}`);
          continue;
        }
        
        // Get old transaction data
        const transaction = await kv.get(oldKey);
        if (!transaction) {
          console.warn('⚠️ [PayPal Fix] Transaction data not found:', oldKey);
          continue;
        }
        
        // Normalize field names to snake_case
        const normalizedTransaction = {
          ...transaction,
          user_id: transaction.user_id || transaction.userId,
          created_at: transaction.created_at || transaction.createdAt,
          paypal_order_id: transaction.paypal_order_id || transaction.paypalOrderId,
        };
        
        // Remove old camelCase fields
        delete normalizedTransaction.userId;
        delete normalizedTransaction.createdAt;
        delete normalizedTransaction.paypalOrderId;
        
        // Save with new key
        await kv.set(newKey, normalizedTransaction);
        
        // Delete old key
        await kv.del(oldKey);
        
        migratedCount++;
        console.log(`✅ [PayPal Fix] Migrated: ${oldKey} → ${newKey}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate transaction: ${error}`;
        console.error('❌ [PayPal Fix]', errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`✅ [PayPal Fix] Migration complete: ${migratedCount} transactions migrated`);
    
    return {
      success: true,
      migrated: migratedCount,
      errors,
    };
    
  } catch (error) {
    console.error('❌ [PayPal Fix] Migration failed:', error);
    return {
      success: false,
      migrated: migratedCount,
      errors: [...errors, String(error)],
    };
  }
}

/**
 * Verify all PayPal transactions are in correct format
 */
export async function verifyPayPalTransactions(): Promise<{
  totalTransactions: number;
  correctFormat: number;
  oldFormat: number;
  issues: string[];
}> {
  console.log('🔍 [PayPal Verify] Checking transaction format...');
  
  const issues: string[] = [];
  
  try {
    // Check for old format transactions
    const oldTransactions = await kv.getByPrefix('transaction:txn_') || [];
    
    // Check for new format transactions with PayPal provider
    const allTransactions = await kv.getByPrefix('transaction_') || [];
    const paypalTransactions = allTransactions.filter((t: any) => 
      t.provider === 'paypal' || t.paypal_order_id
    );
    
    // Identify issues
    for (const txn of paypalTransactions) {
      // Check for camelCase fields
      if (txn.userId || txn.createdAt || txn.paypalOrderId) {
        issues.push(`Transaction ${txn.id} has camelCase fields`);
      }
      
      // Check for missing description
      if (!txn.description) {
        issues.push(`Transaction ${txn.id} missing description`);
      }
    }
    
    console.log('📊 [PayPal Verify] Results:', {
      total: paypalTransactions.length,
      correctFormat: paypalTransactions.length,
      oldFormat: oldTransactions.length,
      issues: issues.length,
    });
    
    return {
      totalTransactions: paypalTransactions.length + oldTransactions.length,
      correctFormat: paypalTransactions.length,
      oldFormat: oldTransactions.length,
      issues,
    };
    
  } catch (error) {
    console.error('❌ [PayPal Verify] Verification failed:', error);
    return {
      totalTransactions: 0,
      correctFormat: 0,
      oldFormat: 0,
      issues: [String(error)],
    };
  }
}
