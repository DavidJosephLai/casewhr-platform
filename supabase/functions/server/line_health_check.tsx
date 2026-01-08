/**
 * LINE OAuth Health Check
 * 用於檢查 LINE OAuth 環境變數是否正確配置
 */

export function getLineEnvStatus() {
  const lineChannelId = Deno.env.get('LINE_CHANNEL_ID');
  const lineChannelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
  const lineCallbackUrl = Deno.env.get('LINE_CALLBACK_URL');
  
  return {
    channel_id: {
      configured: !!lineChannelId,
      length: lineChannelId?.length || 0,
    },
    channel_secret: {
      configured: !!lineChannelSecret,
      length: lineChannelSecret?.length || 0,
    },
    callback_url: {
      configured: !!lineCallbackUrl,
      value: lineCallbackUrl || 'NOT_SET',
    },
    ready: !!(lineChannelId && lineChannelSecret && lineCallbackUrl),
  };
}

export function logLineEnvStatus() {
  const status = getLineEnvStatus();
  
  console.log('🔍 [LINE ENV CHECK]');
  console.log('  Channel ID:', status.channel_id.configured ? `✅ Configured (${status.channel_id.length} chars)` : '❌ NOT CONFIGURED');
  console.log('  Channel Secret:', status.channel_secret.configured ? `✅ Configured (${status.channel_secret.length} chars)` : '❌ NOT CONFIGURED');
  console.log('  Callback URL:', status.callback_url.configured ? `✅ ${status.callback_url.value}` : '❌ NOT CONFIGURED');
  console.log('  Ready:', status.ready ? '✅ YES' : '❌ NO - Please configure all 3 environment variables');
  
  return status;
}
