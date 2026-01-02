export function SimpleLoginTest() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '40px',
      backgroundColor: 'white',
      border: '2px solid #333',
      borderRadius: '8px'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        🔍 簡易登入測試
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>如果你能看到這個頁面，說明路由正常工作。</p>
        
        <button 
          onClick={() => {
            console.log('Button clicked!');
            alert('按鈕點擊成功！請檢查瀏覽器控制台');
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          點我測試按鈕功能
        </button>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '4px'
      }}>
        <p style={{ fontSize: '14px' }}>
          <strong>測試步驟：</strong>
        </p>
        <ol style={{ fontSize: '14px', marginTop: '10px', paddingLeft: '20px' }}>
          <li>點擊上面的按鈕</li>
          <li>你應該會看到一個彈窗</li>
          <li>打開瀏覽器控制台 (F12)</li>
          <li>在 Console 標籤中應該能看到 "Button clicked!"</li>
        </ol>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#dbeafe',
        border: '1px solid #3b82f6',
        borderRadius: '4px'
      }}>
        <p style={{ fontSize: '14px' }}>
          <strong>如果按鈕沒反應：</strong>
        </p>
        <ul style={{ fontSize: '14px', marginTop: '10px', paddingLeft: '20px' }}>
          <li>請截圖瀏覽器控制台 (F12) 的錯誤訊息</li>
          <li>告訴我你的瀏覽器版本</li>
          <li>告訴我是否有任何彈窗被攔截</li>
        </ul>
      </div>
    </div>
  );
}
