import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ConfigStatus {
  stripe: { configured: boolean; key_length: number };
  paypal: { 
    configured: boolean; 
    client_id_length: number; 
    client_secret_length: number;
    mode: string;
    api_base: string;
  };
  ecpay: { configured: boolean; merchant_id_length: number };
}

export function PayPalTestPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/config-check`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to check config:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPayPalPayment = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            plan: 'standard',
            email: 'test@example.com',
            name: 'Test User',
            company: 'Test Company',
            paymentMethod: 'paypal'
          })
        }
      );

      const data = await response.json();
      
      setTestResult({
        success: response.ok && data.success,
        status: response.status,
        data
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading configuration...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">PayPal Configuration Test</h1>

      {/* Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Gateway Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PayPal */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">PayPal</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <strong>Configured:</strong> {config?.paypal.configured ? 
                    <span className="text-green-600">✓ Yes</span> : 
                    <span className="text-red-600">✗ No</span>
                  }
                </div>
                <div>
                  <strong>Client ID Length:</strong> {config?.paypal.client_id_length || 0} chars
                  {config?.paypal.client_id_length && config.paypal.client_id_length > 0 && (
                    <span className={config.paypal.client_id_length > 50 ? 'text-green-600 ml-2' : 'text-orange-600 ml-2'}>
                      {config.paypal.client_id_length > 50 ? '✓ Valid' : '⚠ Too short'}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Client Secret Length:</strong> {config?.paypal.client_secret_length || 0} chars
                  {config?.paypal.client_secret_length && config.paypal.client_secret_length > 0 && (
                    <span className={config.paypal.client_secret_length > 50 ? 'text-green-600 ml-2' : 'text-orange-600 ml-2'}>
                      {config.paypal.client_secret_length > 50 ? '✓ Valid' : '⚠ Too short'}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Mode:</strong> <span className="font-mono">{config?.paypal.mode}</span>
                </div>
                <div>
                  <strong>API Base:</strong> <span className="font-mono text-xs">{config?.paypal.api_base}</span>
                </div>
              </div>
            </div>
            {config?.paypal.configured ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>

          {/* ECPay */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">ECPay</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <strong>Configured:</strong> {config?.ecpay.configured ? 
                    <span className="text-green-600">✓ Yes</span> : 
                    <span className="text-red-600">✗ No</span>
                  }
                </div>
                <div>
                  <strong>Merchant ID Length:</strong> {config?.ecpay.merchant_id_length || 0} chars
                </div>
              </div>
            </div>
            {config?.ecpay.configured ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>

          {/* Stripe */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Stripe</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <strong>Configured:</strong> {config?.stripe.configured ? 
                    <span className="text-green-600">✓ Yes</span> : 
                    <span className="text-red-600">✗ No</span>
                  }
                </div>
                <div>
                  <strong>Key Length:</strong> {config?.stripe.key_length || 0} chars
                </div>
              </div>
            </div>
            {config?.stripe.configured ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* PayPal Test */}
      {config?.paypal.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Test PayPal Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This will create a test payment session for PerfectComm Standard Edition ($100 USD).
              No actual payment will be charged.
            </p>

            <Button 
              onClick={testPayPalPayment}
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test PayPal Integration'}
            </Button>

            {testResult && (
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">
                      {testResult.success ? '✓ Test Successful' : '✗ Test Failed'}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>HTTP Status:</strong> {testResult.status}
                      </div>
                      
                      {testResult.data && (
                        <>
                          {testResult.data.paymentUrl && (
                            <div>
                              <strong>Payment URL:</strong>
                              <div className="mt-1">
                                <a 
                                  href={testResult.data.paymentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {testResult.data.paymentUrl}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {testResult.data.orderId && (
                            <div>
                              <strong>Order ID:</strong> {testResult.data.orderId}
                            </div>
                          )}
                          
                          {testResult.data.paypalOrderId && (
                            <div>
                              <strong>PayPal Order ID:</strong> {testResult.data.paypalOrderId}
                            </div>
                          )}
                          
                          {testResult.data.error && (
                            <div className="text-red-600">
                              <strong>Error:</strong> {testResult.data.error}
                            </div>
                          )}
                          
                          {testResult.data.details && (
                            <div className="mt-2">
                              <strong>Details:</strong>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(testResult.data.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                      
                      {testResult.error && (
                        <div className="text-red-600">
                          <strong>Exception:</strong> {testResult.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Instructions */}
      {!config?.paypal.configured && (
        <Card className="bg-yellow-50 border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              PayPal Not Configured
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>To configure PayPal, you need to set the following environment variables in Supabase:</p>
            
            <div className="bg-white p-4 rounded border space-y-2 font-mono text-xs">
              <div>PAYPAL_CLIENT_ID = your_client_id</div>
              <div>PAYPAL_CLIENT_SECRET = your_client_secret</div>
              <div>PAYPAL_MODE = sandbox (or live)</div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Steps to get PayPal credentials:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developer.paypal.com</a></li>
                <li>Log in with your PayPal account</li>
                <li>Go to Dashboard → Apps & Credentials</li>
                <li>Select <strong>Sandbox</strong> (for testing) or <strong>Live</strong> (for production)</li>
                <li>Create a new app or select an existing one</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Secret</strong></li>
                <li>Add them to Supabase Edge Functions secrets</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
