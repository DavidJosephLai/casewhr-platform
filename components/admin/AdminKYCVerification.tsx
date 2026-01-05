import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface KYCData {
  user_id: string;
  user_email?: string;
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  full_name: string;
  id_type: 'national_id' | 'passport' | 'driver_license';
  id_number: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  date_of_birth?: string;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export function AdminKYCVerification() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kycList, setKycList] = useState<KYCData[]>([]);
  const [selectedKYC, setSelectedKYC] = useState<KYCData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const content = {
    en: {
      title: 'KYC Verification Management',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      user: 'User',
      fullName: 'Full Name',
      idType: 'ID Type',
      idNumber: 'ID Number',
      status: 'Status',
      submittedDate: 'Submitted',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      viewDetails: 'View Details',
      noKYC: 'No KYC submissions found',
      approveSuccess: 'KYC verification approved successfully',
      rejectSuccess: 'KYC verification rejected successfully',
      error: 'Operation failed',
      kycDetails: 'KYC Verification Details',
      personalInfo: 'Personal Information',
      dateOfBirth: 'Date of Birth',
      phoneNumber: 'Phone Number',
      address: 'Address',
      city: 'City',
      postalCode: 'Postal Code',
      country: 'Country',
      documents: 'Documents',
      idFront: 'ID Front Side',
      idBack: 'ID Back Side',
      selfie: 'Selfie with ID',
      viewImage: 'View Image',
      rejectKYC: 'Reject KYC Verification',
      rejectionReason: 'Rejection Reason',
      reasonPlaceholder: 'Enter reason for rejection...',
      cancel: 'Cancel',
      confirmReject: 'Confirm Rejection',
      provideReason: 'Please provide a reason for rejection',
      rejectDescription: 'Please provide a clear reason for rejecting this KYC verification.',
      nationalId: 'National ID Card',
      passport: 'Passport',
      driverLicense: 'Driver License',
      verifiedDate: 'Verified Date',
      processing: 'Processing...',
    },
    'zh-TW': {
      title: 'KYC 身份驗證管理',
      all: '全部',
      pending: '待審核',
      approved: '已批准',
      rejected: '已拒絕',
      user: '用戶',
      fullName: '真實姓名',
      idType: '證件類型',
      idNumber: '證件號碼',
      status: '狀態',
      submittedDate: '提交日期',
      actions: '操作',
      approve: '批准',
      reject: '拒絕',
      viewDetails: '查看詳情',
      noKYC: '未找到 KYC 提交',
      approveSuccess: 'KYC 驗證已批准',
      rejectSuccess: 'KYC 驗證已拒絕',
      error: '操作失敗',
      kycDetails: 'KYC 驗證詳情',
      personalInfo: '個人資訊',
      dateOfBirth: '出生日期',
      phoneNumber: '手機號碼',
      address: '地址',
      city: '城市',
      postalCode: '郵遞區號',
      country: '國家',
      documents: '證件文件',
      idFront: '證件正面',
      idBack: '證件背面',
      selfie: '手持證件自拍照',
      viewImage: '查看圖片',
      rejectKYC: '拒絕 KYC 驗證',
      rejectionReason: '拒絕原因',
      reasonPlaceholder: '輸入拒絕原因...',
      cancel: '取消',
      confirmReject: '確認拒絕',
      provideReason: '請提供拒絕原因',
      rejectDescription: '請提供拒絕此 KYC 驗證的明確原因。',
      nationalId: '身份證',
      passport: '護照',
      driverLicense: '駕照',
      verifiedDate: '驗證日期',
      processing: '處理中...',
    },
    'zh-CN': {
      title: 'KYC 身份验证管理',
      all: '全部',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      user: '用户',
      fullName: '真实姓名',
      idType: '证件类型',
      idNumber: '证件号码',
      status: '状态',
      submittedDate: '提交日期',
      actions: '操作',
      approve: '批准',
      reject: '拒绝',
      viewDetails: '查看详情',
      noKYC: '未找到 KYC 提交',
      approveSuccess: 'KYC 验证已批准',
      rejectSuccess: 'KYC 验证已拒绝',
      error: '操作失败',
      kycDetails: 'KYC 验证详情',
      personalInfo: '个人信息',
      dateOfBirth: '出生日期',
      phoneNumber: '手机号码',
      address: '地址',
      city: '城市',
      postalCode: '邮政编码',
      country: '国家',
      documents: '证件文件',
      idFront: '证件正面',
      idBack: '证件背面',
      selfie: '手持证件自拍照',
      viewImage: '查看图片',
      rejectKYC: '拒绝 KYC 验证',
      rejectionReason: '拒绝原因',
      reasonPlaceholder: '输入拒绝原因...',
      cancel: '取消',
      confirmReject: '确认拒绝',
      provideReason: '请提供拒绝原因',
      rejectDescription: '请提供拒绝此 KYC 验证的明确原因。',
      nationalId: '身份证',
      passport: '护照',
      driverLicense: '驾照',
      verifiedDate: '验证日期',
      processing: '处理中...',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    if (accessToken) {
      fetchKYCList();
    }
  }, [accessToken, filterStatus]);

  const fetchKYCList = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/kyc/all`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let filtered = data.kyc_list || [];
        
        if (filterStatus !== 'all') {
          filtered = filtered.filter((k: KYCData) => k.status === filterStatus);
        }
        
        setKycList(filtered);
      }
    } catch (error) {
      console.error('Error fetching KYC list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycUserId: string) => {
    if (!accessToken) return;

    setActionLoading(kycUserId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/kyc/${kycUserId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t.approveSuccess);
        fetchKYCList();
        setShowDetailsDialog(false);
      } else {
        throw new Error('Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !selectedKYC || !rejectionReason.trim()) {
      toast.error(t.provideReason);
      return;
    }

    setActionLoading(selectedKYC.user_id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/kyc/${selectedKYC.user_id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        toast.success(t.rejectSuccess);
        setShowRejectDialog(false);
        setShowDetailsDialog(false);
        setRejectionReason('');
        setSelectedKYC(null);
        fetchKYCList();
      } else {
        throw new Error('Failed to reject KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error(t.error);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailsDialog = (kyc: KYCData) => {
    setSelectedKYC(kyc);
    setShowDetailsDialog(true);
  };

  const openRejectDialog = (kyc: KYCData) => {
    setSelectedKYC(kyc);
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            {t.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            {t.rejected}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getIdTypeName = (type: string) => {
    switch (type) {
      case 'national_id':
        return t.nationalId;
      case 'passport':
        return t.passport;
      case 'driver_license':
        return t.driverLicense;
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>{t.title}</CardTitle>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                {t.all}
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                {t.pending}
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('approved')}
              >
                {t.approved}
              </Button>
              <Button
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('rejected')}
              >
                {t.rejected}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {kycList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noKYC}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.user}</TableHead>
                    <TableHead>{t.fullName}</TableHead>
                    <TableHead>{t.idType}</TableHead>
                    <TableHead>{t.idNumber}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.submittedDate}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycList.map((kyc) => (
                    <TableRow key={kyc.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="font-medium">{kyc.user_email || 'N/A'}</div>
                            <div className="text-gray-500 text-xs">{kyc.user_id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{kyc.full_name}</TableCell>
                      <TableCell>{getIdTypeName(kyc.id_type)}</TableCell>
                      <TableCell className="font-mono text-sm">{kyc.id_number}</TableCell>
                      <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                      <TableCell className="text-sm">
                        {kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsDialog(kyc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t.viewDetails}
                          </Button>
                          {kyc.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(kyc.user_id)}
                                disabled={actionLoading === kyc.user_id}
                              >
                                {actionLoading === kyc.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {t.approve}
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => openRejectDialog(kyc)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {t.reject}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.kycDetails}</DialogTitle>
          </DialogHeader>
          
          {selectedKYC && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold">{selectedKYC.user_email}</span>
                </div>
                {getStatusBadge(selectedKYC.status)}
              </div>

              {/* Rejection Reason */}
              {selectedKYC.status === 'rejected' && selectedKYC.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-900 mb-1">{t.rejectionReason}</div>
                      <div className="text-sm text-red-800">{selectedKYC.rejection_reason}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{t.personalInfo}</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">{t.fullName}</div>
                    <div className="font-medium">{selectedKYC.full_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t.dateOfBirth}</div>
                    <div className="font-medium">{selectedKYC.date_of_birth || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t.idType}</div>
                    <div className="font-medium">{getIdTypeName(selectedKYC.id_type)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t.idNumber}</div>
                    <div className="font-medium font-mono">{selectedKYC.id_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t.phoneNumber}</div>
                    <div className="font-medium">{selectedKYC.phone_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t.country}</div>
                    <div className="font-medium">{selectedKYC.country}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">{t.address}</div>
                    <div className="font-medium">
                      {selectedKYC.address}
                      {selectedKYC.city && `, ${selectedKYC.city}`}
                      {selectedKYC.postal_code && ` ${selectedKYC.postal_code}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{t.documents}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedKYC.id_front_url && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t.idFront}</div>
                      <a
                        href={selectedKYC.id_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedKYC.id_front_url}
                          alt="ID Front"
                          className="w-full h-40 object-cover rounded-lg border-2 hover:border-blue-600 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                  {selectedKYC.id_back_url && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t.idBack}</div>
                      <a
                        href={selectedKYC.id_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedKYC.id_back_url}
                          alt="ID Back"
                          className="w-full h-40 object-cover rounded-lg border-2 hover:border-blue-600 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                  {selectedKYC.selfie_url && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t.selfie}</div>
                      <a
                        href={selectedKYC.selfie_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedKYC.selfie_url}
                          alt="Selfie"
                          className="w-full h-40 object-cover rounded-lg border-2 hover:border-blue-600 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedKYC.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => handleApprove(selectedKYC.user_id)}
                    disabled={actionLoading === selectedKYC.user_id}
                  >
                    {actionLoading === selectedKYC.user_id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.processing}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t.approve}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    size="lg"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openRejectDialog(selectedKYC);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t.reject}
                  </Button>
                </div>
              )}

              {/* Verified Date */}
              {selectedKYC.status === 'approved' && selectedKYC.verified_at && (
                <div className="text-sm text-gray-600 pt-4 border-t">
                  {t.verifiedDate}: {new Date(selectedKYC.verified_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectKYC}</DialogTitle>
            <DialogDescription>{t.rejectDescription}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">{t.rejectionReason} *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading !== null}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    {t.confirmReject}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
