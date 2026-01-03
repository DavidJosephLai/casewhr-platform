/**
 * Clipboard Utility with Fallback
 * Handles clipboard API errors with graceful fallback methods
 */

/**
 * Copy text to clipboard with fallback for blocked environments
 * @param text - Text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }

  // Method 2: Fallback - Create temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible and prevent scrolling
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return true;
      }
    } catch (execErr) {
      document.body.removeChild(textArea);
      console.warn('execCommand copy failed:', execErr);
    }
  } catch (fallbackErr) {
    console.error('Fallback copy method failed:', fallbackErr);
  }

  // Method 3: Last resort - Show text in a prompt
  try {
    const userAction = prompt(
      'Unable to copy automatically. Please copy the text below:',
      text
    );
    // If user clicked OK or copied manually, consider it a partial success
    return userAction !== null;
  } catch (promptErr) {
    console.error('Prompt fallback failed:', promptErr);
  }

  return false;
}

/**
 * Copy text to clipboard with toast notification
 * @param text - Text to copy
 * @param successMessage - Success message to show
 * @param errorMessage - Error message to show if copy fails
 * @param toast - Toast function from sonner
 */
export async function copyWithToast(
  text: string,
  successMessage: string,
  errorMessage: string,
  toast: any
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (success) {
    toast.success(successMessage);
  } else {
    toast.error(errorMessage);
  }
  
  return success;
}
