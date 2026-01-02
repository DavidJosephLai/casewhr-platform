import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useAuth } from "../contexts/AuthContext";

export function ProfileDebugger() {
  const { user, accessToken } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProfileUpdate = async () => {
    if (!user) {
      alert('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info.tsx');
      
      console.log('🧪 [ProfileDebugger] Starting test...');
      console.log('🧪 [ProfileDebugger] User:', {
        id: user.id,
        email: user.email,
        hasId: !!user.id
      });
      
      // 優先使用 accessToken，否則使用 publicAnonKey
      const authToken = accessToken || publicAnonKey;
      
      console.log('🧪 [ProfileDebugger] Token:', {
        hasAccessToken: !!accessToken,
        usingPublicKey: !accessToken,
        tokenPreview: authToken.substring(0, 30) + '...'
      });
      
      const testPayload = {
        user_id: user.id,
        email: user.email,
        full_name: "Test User",
        is_client: true,
        is_freelancer: false,
        skills: ["testing"],
        phone: "",
        company: "",
        job_title: "Tester",
        bio: "Test bio",
        website: "",
        avatar_url: "",
        language: "en"
      };
      
      console.log('🧪 [ProfileDebugger] Payload:', testPayload);
      console.log('🧪 [ProfileDebugger] Sending request to:', `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(testPayload),
        }
      );
      
      console.log('🧪 [ProfileDebugger] Response status:', response.status);
      console.log('🧪 [ProfileDebugger] Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🧪 [ProfileDebugger] Response data:', data);
      
      setResult({
        success: response.ok,
        status: response.status,
        data,
        user: {
          id: user.id,
          email: user.email
        },
        token: {
          hasAccessToken: !!accessToken,
          usingPublicKey: !accessToken,
          tokenPreview: authToken.substring(0, 30) + '...'
        }
      });
    } catch (error: any) {
      console.error('🧪 [ProfileDebugger] Error:', error);
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-6 m-4">
        <h2 className="text-xl font-bold mb-4">Profile Debugger</h2>
        <p className="text-red-500">No user logged in. Please log in first.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 m-4">
      <h2 className="text-xl font-bold mb-4">Profile API Debugger 🧪</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">User Info:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email,
              hasId: !!user.id
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Token Status:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              hasAccessToken: !!accessToken,
              tokenLength: accessToken?.length || 0,
              tokenPreview: accessToken ? accessToken.substring(0, 30) + '...' : 'null'
            }, null, 2)}
          </pre>
        </div>
        
        <Button 
          onClick={testProfileUpdate}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Profile Update API'}
        </Button>
        
        {result && (
          <div>
            <h3 className="font-semibold mb-2">
              Result: <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </span>
            </h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-4">
          <p>💡 Open browser console (F12) to see detailed logs</p>
          <p>💡 Check server logs in Supabase dashboard for server-side logs</p>
        </div>
      </div>
    </Card>
  );
}
