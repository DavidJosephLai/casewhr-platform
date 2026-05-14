import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Gift, Mail, User, Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';

interface FreeTrialDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FreeTrialDialog({ open, onClose }: FreeTrialDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🎁 [Trial Frontend] Requesting trial download:', { email, name, company });

      // 直接獲取下載連結，不需要授權碼
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/download/trial?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🎁 [Trial Frontend] Response status:', response.status);
      const data = await response.json();
      console.log('🎁 [Trial Frontend] Response data:', data);

      if (response.ok && data.success && data.downloadUrl) {
        setSuccess(true);
        setDownloadUrl(data.downloadUrl);
        toast.success('🎉 Trial download ready! Starting download...');

        // 自動開始下載
        window.open(data.downloadUrl, '_blank');
      } else {
        setError(data.error || 'Failed to get download link');
        console.error('🎁 [Trial Frontend] Error:', data.error);
        toast.error(data.error || 'Failed to get download link');
      }
    } catch (error) {
      console.error('🎁 [Trial Frontend] Network error:', error);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setCompany('');
    setSuccess(false);
    setDownloadUrl('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!success ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Download Free Trial</DialogTitle>
                  <DialogDescription className="mt-1">
                    Try PerfectComm free - No license key required
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="trial-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="trial-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="trial-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="trial-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="trial-company" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company (Optional)
                </Label>
                <Input
                  id="trial-company"
                  type="text"
                  placeholder="Your Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-600 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Features */}
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trial version features:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Full RS-232 communication features</li>
                    <li>Protocol development tools</li>
                    <li>No license key required</li>
                    <li>No credit card required</li>
                    <li>Download and use immediately</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Download Trial Version
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Download Started! 🎉</DialogTitle>
                  <DialogDescription className="mt-2">
                    Your trial version download has begun
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Download Notice */}
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>No license key needed!</strong>
                  <p className="mt-2 text-sm">
                    The trial version works immediately after installation. Just download, install, and start using PerfectComm.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Download Again Button */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3 text-center">
                  If the download didn't start automatically:
                </p>
                <Button
                  onClick={() => window.open(downloadUrl, '_blank')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Download Again
                </Button>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Wait for the download to complete</li>
                  <li>Install PerfectComm on your Windows machine</li>
                  <li>Launch the application</li>
                  <li>Start testing your RS-232 communication immediately!</li>
                </ol>
              </div>

              {/* Close Button */}
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}