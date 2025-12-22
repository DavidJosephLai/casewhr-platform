// Global error handler
window.addEventListener('error', (event) => {
  if (event.message.includes('WASM')) {
    event.preventDefault();
    console.warn('WASM error suppressed:', event.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WASM')) {
    event.preventDefault();
    console.warn('WASM rejection suppressed:', event.reason);
  }
});

export {};
