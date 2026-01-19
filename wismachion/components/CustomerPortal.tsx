import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Download, Copy, Shield, Calendar, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface CustomerPortalProps {
  user: any;
}

export function CustomerPortal({ user }: CustomerPortalProps) {
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});

  if (!user || !user.licenses) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-600">No licenses found. Please purchase a license first.</p>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('License key copied to clipboard!');
  };

  const handleDownload = async (licenseKey: string, architecture: 'x64' | 'x86') => {
    const downloadKey = `${licenseKey}-${architecture}`;
    setDownloading(prev => ({ ...prev, [downloadKey]: true }));

    try {
      // Import Supabase info
      const { projectId } = await import('../../utils/supabase/info.tsx');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/download-installer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licenseKey,
            architecture
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to generate download link');
        return;
      }

      if (data.success && data.download_url) {
        // Start download
        window.location.href = data.download_url;
        
        toast.success(
          `Downloading PerfectComm ${data.version} (${architecture})...`,
          { duration: 5000 }
        );
      } else {
        toast.error('Failed to generate download link');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again later.');
    } finally {
      setDownloading(prev => ({ ...prev, [downloadKey]: false }));
    }
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'standard') {
      return <Badge className="bg-blue-500">Standard Edition</Badge>;
    } else if (plan === 'enterprise') {
      return <Badge className="bg-purple-500">Enterprise Edition</Badge>;
    }
    return <Badge>{plan}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Active</Badge>;
    } else if (status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'lifetime') return 'Lifetime';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Licenses
            </h1>
            <p className="text-gray-600">
              Manage your PerfectComm licenses and downloads
            </p>
          </div>

          {/* User Info */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{user.email}</div>
                <div className="text-sm text-gray-600">
                  {user.licenses.length} {user.licenses.length === 1 ? 'License' : 'Licenses'}
                </div>
              </div>
            </div>
          </Card>

          {/* Licenses List */}
          <div className="space-y-6">
            {user.licenses.map((license: any, index: number) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getPlanBadge(license.plan)}
                      {getStatusBadge(license.status)}
                    </div>
                    <div className="font-mono text-2xl font-bold text-gray-900 mb-2">
                      {license.licenseKey}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(license.licenseKey)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy License Key
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Purchased</div>
                    <div className="font-semibold text-gray-900">
                      {formatDate(license.createdAt)}
                    </div>
                  </div>
                </div>

                {/* License Details */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Expires</div>
                      <div className="font-semibold text-gray-900">
                        {formatDate(license.expiryDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Activations</div>
                      <div className="font-semibold text-gray-900">
                        {license.activations?.length || 0} / {license.maxActivations}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">License Type</div>
                      <div className="font-semibold text-gray-900 capitalize">
                        {license.plan}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                    onClick={() => handleDownload(license.licenseKey, 'x64')}
                    disabled={downloading[`${license.licenseKey}-x64`]}
                  >
                    <Download className="w-4 h-4" />
                    Download PerfectComm (64-bit)
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                    onClick={() => handleDownload(license.licenseKey, 'x86')}
                    disabled={downloading[`${license.licenseKey}-x86`]}
                  >
                    <Download className="w-4 h-4" />
                    Download PerfectComm (32-bit)
                  </Button>
                  <Button variant="outline">
                    View Installation Guide
                  </Button>
                  <Button variant="outline">
                    Contact Support
                  </Button>
                </div>

                {/* Activated Machines */}
                {license.activations && license.activations.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Activated Machines</h4>
                    <div className="space-y-2">
                      {license.activations.map((activation: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="font-mono text-sm text-gray-900">
                                {activation.machineId}
                              </div>
                              <div className="text-xs text-gray-500">
                                Activated: {formatDate(activation.activatedAt)}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            Deactivate
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Download Section */}
          <Card className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="text-center">
              <Download className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Download PerfectComm
              </h3>
              <p className="text-gray-600 mb-6">
                Latest version: 1.0.0 | Windows 7/8/10/11
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Download (64-bit)
                </Button>
                <Button size="lg" variant="outline">
                  Download (32-bit)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}