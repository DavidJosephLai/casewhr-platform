/**
 * 🚨 儀表板調試工具 🚨
 * 
 * 在瀏覽器控制台運行此腳本來診斷儀表板問題
 * 
 * 使用方法：
 * 1. 打開瀏覽器控制台 (F12)
 * 2. 複製貼上此文件內容並執行
 * 3. 查看診斷結果
 */

console.log('🔧 ========== 儀表板診斷工具 ========== 🔧\n');

// 1. 檢查 localStorage
console.log('📦 1. LocalStorage 檢查:');
const storedLanguage = localStorage.getItem('preferred-language');
console.log(`   語言設定: "${storedLanguage}"`);

if (storedLanguage === 'zh') {
  console.log('   ⚠️ 警告：檢測到舊的語言值 "zh"，應該遷移到 "zh-TW" 或 "zh-CN"');
  console.log('   🔧 正在自動修復...');
  localStorage.setItem('preferred-language', 'zh-TW');
  console.log('   ✅ 已修復：zh → zh-TW');
}

// 2. 檢查當前視圖
console.log('\n🖥️ 2. 視圖狀態檢查:');
console.log(`   當前 URL: ${window.location.href}`);
console.log(`   當前 pathname: ${window.location.pathname}`);
console.log(`   當前 hash: ${window.location.hash}`);

// 3. 檢查認證狀態
console.log('\n🔐 3. 認證狀態檢查:');
const authData = localStorage.getItem('supabase.auth.token');
if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('   ✅ 已登入');
    console.log(`   用戶 ID: ${parsed.currentSession?.user?.id || 'N/A'}`);
    console.log(`   Email: ${parsed.currentSession?.user?.email || 'N/A'}`);
  } catch (e) {
    console.log('   ❌ 認證資料解析失敗');
  }
} else {
  console.log('   ❌ 未登入');
}

// 4. 測試跳轉到儀表板
console.log('\n🚀 4. 測試儀表板跳轉:');
console.log('   執行：window.dispatchEvent(new CustomEvent("showDashboard"))');

try {
  window.dispatchEvent(new CustomEvent('showDashboard', { 
    detail: { tab: 'overview' } 
  }));
  console.log('   ✅ 事件已發送');
  
  setTimeout(() => {
    const currentView = document.querySelector('[class*="container"]')?.textContent?.includes('Dashboard') || 
                        document.querySelector('[class*="container"]')?.textContent?.includes('儀表板');
    if (currentView) {
      console.log('   ✅ 儀表板已成功載入！');
    } else {
      console.log('   ❌ 儀表板未載入，請檢查控制台錯誤');
    }
  }, 1000);
} catch (error) {
  console.log('   ❌ 事件發送失敗:', error);
}

// 5. 檢查 translations 對象
console.log('\n📝 5. 翻譯系統檢查:');
setTimeout(() => {
  try {
    // @ts-ignore
    if (window.translations) {
      // @ts-ignore
      const trans = window.translations;
      console.log('   可用語言:', Object.keys(trans));
      
      const langs = ['en', 'zh', 'zh-TW', 'zh-CN'];
      langs.forEach(lang => {
        if (trans[lang]) {
          const hasDashboard = trans[lang].dashboard ? '✅' : '❌';
          console.log(`   ${lang}: ${hasDashboard} ${trans[lang].dashboard ? 'dashboard 存在' : 'dashboard 缺失'}`);
        } else {
          console.log(`   ${lang}: ❌ 語言不存在`);
        }
      });
    } else {
      console.log('   ⚠️ translations 對象未掛載到 window');
    }
  } catch (error) {
    console.log('   ❌ 翻譯檢查失敗:', error);
  }
}, 500);

// 6. 檢查錯誤日誌
console.log('\n⚠️ 6. 錯誤監聽:');
console.log('   正在監聽錯誤...');

const originalError = console.error;
console.error = function(...args) {
  console.log('   🔴 錯誤:', ...args);
  originalError.apply(console, args);
};

window.addEventListener('error', (e) => {
  console.log('   🔴 全局錯誤:', e.message);
});

console.log('\n✅ ========== 診斷完成 ========== ✅');
console.log('\n💡 解決建議:');
console.log('   1. 如果 localStorage 有舊值 "zh"，請刷新頁面');
console.log('   2. 確保已登入');
console.log('   3. 檢查控制台是否有紅色錯誤訊息');
console.log('   4. 嘗試清除瀏覽器快取並重新登入\n');
