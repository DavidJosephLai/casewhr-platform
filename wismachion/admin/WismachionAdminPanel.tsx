import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Key, Users, DollarSign, TrendingUp, Plus, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function WismachionAdminPanel() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for generating new license
  const [newLicense, setNewLicense] = useState({
    email: '',
    name: '',
    company: '',
    plan: 'standard' as 'standard' | 'enterprise'
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/licenses`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.licenses) {
        setLicenses(data.licenses);
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const generateLicense = async () => {
    if (!newLicense.email || !newLicense.name) {
      toast.error('Email and name are required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/generate-license`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(newLicense)
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(`License generated: ${data.licenseKey}`);
        setNewLicense({ email: '', name: '', company: '', plan: 'standard' });
        loadLicenses();
      } else {
        toast.error(data.error || 'Failed to generate license');
      }
    } catch (error) {
      console.error('Failed to generate license:', error);
      toast.error('Failed to generate license');
    }
  };

  const revokeLicense = async (licenseKey: string) => {
    if (!confirm(`Are you sure you want to revoke license ${licenseKey}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/revoke-license`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ licenseKey })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('License revoked successfully');
        loadLicenses();
      } else {
        toast.error(data.error || 'Failed to revoke license');
      }
    } catch (error) {
      console.error('Failed to revoke license:', error);
      toast.error('Failed to revoke license');
    }
  };

  const extendLicense = async (licenseKey: string, days: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/admin/extend-license`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ licenseKey, days })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(`License extended by ${days} days`);
        loadLicenses();
      } else {
        toast.error(data.error || 'Failed to extend license');
      }
    } catch (error) {
      console.error('Failed to extend license:', error);
      toast.error('Failed to extend license');
    }
  };

  const filteredLicenses = licenses.filter(license =>
    license.licenseKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    standard: licenses.filter(l => l.plan === 'standard').length,
    enterprise: licenses.filter(l => l.plan === 'enterprise').length,
    revenue: licenses.reduce((sum, l) => sum + (l.amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Wismachion License Management</h1>
        <Button onClick={loadLicenses} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Licenses</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.standard}</div>
          <div className="text-sm text-gray-600">Standard Edition</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.enterprise}</div>
          <div className="text-sm text-gray-600">Enterprise Edition</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">${stats.revenue}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </Card>
      </div>

      <Tabs defaultValue="licenses" className="w-full">
        <TabsList>
          <TabsTrigger value="licenses">All Licenses</TabsTrigger>
          <TabsTrigger value="generate">Generate License</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by license key, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Licenses Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLicenses.map((license, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {license.licenseKey}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{license.name}</div>
                        <div className="text-sm text-gray-500">{license.email}</div>
                        {license.company && <div className="text-xs text-gray-400">{license.company}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={license.plan === 'enterprise' ? 'bg-purple-500' : 'bg-blue-500'}>
                          {license.plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={license.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                          {license.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {license.expiryDate === 'lifetime' ? 'Lifetime' : new Date(license.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {license.activations?.length || 0} / {license.maxActivations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {license.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => extendLicense(license.licenseKey, 365)}
                              >
                                Extend +1Y
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => revokeLicense(license.licenseKey)}
                              >
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate New License</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gen-name">Customer Name *</Label>
                  <Input
                    id="gen-name"
                    value={newLicense.name}
                    onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="gen-email">Email Address *</Label>
                  <Input
                    id="gen-email"
                    type="email"
                    value={newLicense.email}
                    onChange={(e) => setNewLicense({ ...newLicense, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gen-company">Company (Optional)</Label>
                <Input
                  id="gen-company"
                  value={newLicense.company}
                  onChange={(e) => setNewLicense({ ...newLicense, company: e.target.value })}
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <Label htmlFor="gen-plan">License Plan</Label>
                <Select
                  value={newLicense.plan}
                  onValueChange={(value: 'standard' | 'enterprise') => setNewLicense({ ...newLicense, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Edition - $100</SelectItem>
                    <SelectItem value="enterprise">Enterprise Edition - $200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateLicense} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Generate License
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
