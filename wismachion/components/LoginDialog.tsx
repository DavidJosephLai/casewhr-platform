import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

export function LoginDialog({ open, onClose, onSuccess }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/my-licenses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (data.licenses && data.licenses.length > 0) {
        onSuccess({ email, licenses: data.licenses });
        toast.success('Login successful!');
      } else {
        toast.error('No licenses found for this email address');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Customer Login</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-600">
            Enter the email address you used for your purchase to access your licenses.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Checking...' : 'Access My Licenses'}
            </Button>
          </div>

          <div className="text-sm text-gray-500 text-center">
            No account required. We'll show you all licenses associated with your email.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
