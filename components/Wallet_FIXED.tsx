// 🔧 这是修复后的 handleECPayDeposit 函数
// 请替换 /components/Wallet.tsx 中的第 374-421 行

  // ECPay deposit handler
  const handleECPayDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    // 检查是否已登入
    if (!user?.id || !accessToken) {
      toast.error(
        language === 'en' 
          ? '🔐 Please sign in to deposit funds' 
          : language === 'zh-CN'
          ? '🔐 请先登入以充值'
          : '🔐 請先登入以充值'
      );
      return;
    }
    
    if (!amount || amount <= 0) {
      toast.error(language === 'en' ? 'Please enter a valid amount' : '請輸入有效金額');
      return;
    }

    // 根據顯示貨幣轉換為 TWD（ECPay 只支持 TWD）
    const twdAmount = displayCurrency === 'TWD'
      ? Math.round(amount)  // 已經是 TWD
      : Math.round(convertCurrency(amount, displayCurrency, 'TWD'));  // USD/CNY → TWD

    // 檢查最低儲值金額 300 NTD
    if (twdAmount < 300) {
      toast.error(
        language === 'en' 
          ? 'Minimum deposit is NT$300' 
          : '最小充值金額為 NT$300'
      );
      return;
    }

    setProcessing(true);
    try {
      console.log('💳 [ECPay] Creating order:', { amount: twdAmount });
      
      // 🆕 调用新的创建订单 API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/ecpay/create-order`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: twdAmount,
            payment_type: 'deposit',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ [ECPay] Order created:', {
          orderId: data.orderId,
          paymentId: data.paymentId,
        });
        
        // 🆕 使用自动提交表单跳转到 ECPay
        if (data.autoSubmitForm) {
          // 在新窗口中打开自动提交表单
          const paymentWindow = window.open('', '_blank');
          if (paymentWindow) {
            paymentWindow.document.write(data.autoSubmitForm);
            paymentWindow.document.close();
            
            toast.success(
              language === 'en'
                ? '🔄 Redirecting to ECPay payment page...'
                : language === 'zh-CN'
                ? '🔄 正在跳转到绿界付款页面...'
                : '🔄 正在跳轉到綠界付款頁面...',
              { duration: 3000 }
            );
            
            // 关闭充值对话框
            setDepositDialogOpen(false);
            setDepositAmount('');
          } else {
            toast.error(
              language === 'en'
                ? '❌ Please allow pop-ups to complete payment'
                : language === 'zh-CN'
                ? '❌ 请允许弹出窗口以完成付款'
                : '❌ 請允許彈出視窗以完成付款'
            );
          }
        } else {
          throw new Error('No payment form returned');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ [ECPay] Create order failed:', errorData);
        
        toast.error(
          language === 'en'
            ? `Failed to create order: ${errorData.error}`
            : language === 'zh-CN'
            ? `创建订单失败：${errorData.error}`
            : `創建訂單失敗：${errorData.error}`
        );
      }
    } catch (error: any) {
      console.error('❌ [ECPay] Error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to start ECPay payment'
          : language === 'zh-CN'
          ? '无法启动绿界付款'
          : '無法啟動綠界付款'
      );
    } finally {
      setProcessing(false);
    }
  };
