// This is a patch note - 
// Line 93 in email_service.tsx needs to be changed from:
//   <span class="detail-value">$${amount}</span>
// To:
//   <span class="detail-value">${formatAmount(amount, currency)}</span>
//
// Similarly, other instances of $${amount}, $${balance}, $${proposedBudget} etc 
// should use formatAmount(value, currency) instead

// The formatAmount function is already added at line 21-32
