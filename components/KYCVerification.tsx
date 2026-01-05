import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText,
  Shield,
  AlertTriangle,
  IdCard,
  Building2,
  Phone,
  User
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { createClient } from '@supabase/supabase-js';

interface KYCData {
  user_id: string;
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

export function KYCVerification() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState<'national_id' | 'passport' | 'driver_license'>('national_id');
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('TW');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  // File uploads
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const content = {
    en: {
      title: 'Identity Verification (KYC)',
      description: 'Complete identity verification to unlock withdrawal features',
      status: 'Verification Status',
      notStarted: 'Not Started',
      pending: 'Pending Review',
      approved: 'Verified',
      rejected: 'Rejected',
      startVerification: 'Start Verification',
      resubmit: 'Resubmit',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full legal name',
      idType: 'ID Type',
      nationalId: 'National ID Card',
      passport: 'Passport',
      driverLicense: 'Driver License',
      idNumber: 'ID Number',
      idNumberPlaceholder: 'Enter your ID number',
      phoneNumber: 'Phone Number',
      phonePlaceholder: '+886 912 345 678',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
      addressPlaceholder: 'Street address',
      city: 'City',
      cityPlaceholder: 'City',
      postalCode: 'Postal Code',
      postalCodePlaceholder: 'Postal code',
      country: 'Country',
      documentUpload: 'Document Upload',
      idFront: 'ID Front Side',
      idBack: 'ID Back Side',
      selfie: 'Selfie with ID',
      uploadImage: 'Upload Image',
      changeImage: 'Change',
      submit: 'Submit for Verification',
      submitting: 'Submitting...',
      success: 'KYC verification submitted successfully',
      error: 'Failed to submit KYC verification',
      fillAllFields: 'Please fill in all required fields',
      uploadAllDocuments: 'Please upload all required documents',
      rejectionReason: 'Rejection Reason',
      requirements: 'Requirements',
      req1: '✓ Clear photo of government-issued ID',
      req2: '✓ Both front and back sides of ID',
      req3: '✓ Selfie holding your ID next to your face',
      req4: '✓ All information must be clearly visible',
      req5: '✓ Documents must be valid and not expired',
      whyKyc: 'Why verify?',
      benefit1: '✓ Unlock withdrawal to bank account',
      benefit2: '✓ Increase trust with clients',
      benefit3: '✓ Comply with financial regulations',
      benefit4: '✓ Protect your account security',
      pendingMessage: 'Your verification is under review. We will notify you within 1-3 business days.',
      approvedMessage: 'Your identity has been verified. You can now withdraw funds to your bank account.',
      verifiedOn: 'Verified on',
    },
    'zh-TW': {
      title: '身份驗證（KYC）',
      description: '完成身份驗證以解鎖提現功能',
      status: '驗證狀態',
      notStarted: '未開始',
      pending: '審核中',
      approved: '已驗證',
      rejected: '已拒絕',
      startVerification: '開始驗證',
      resubmit: '重新提交',
      personalInfo: '個人資訊',
      fullName: '真實姓名',
      fullNamePlaceholder: '輸入您的法定姓名',
      idType: '證件類型',
      nationalId: '身份證',
      passport: '護照',
      driverLicense: '駕照',
      idNumber: '證件號碼',
      idNumberPlaceholder: '輸入證件號碼',
      phoneNumber: '手機號碼',
      phonePlaceholder: '+886 912 345 678',
      dateOfBirth: '出生日期',
      address: '地址',
      addressPlaceholder: '街道地址',
      city: '城市',
      cityPlaceholder: '城市',
      postalCode: '郵遞區號',
      postalCodePlaceholder: '郵遞區號',
      country: '國家',
      documentUpload: '文件上傳',
      idFront: '證件正面',
      idBack: '證件背面',
      selfie: '手持證件自拍照',
      uploadImage: '上傳圖片',
      changeImage: '更換',
      submit: '提交驗證',
      submitting: '提交中...',
      success: 'KYC 驗證已提交',
      error: '提交失敗',
      fillAllFields: '請填寫所有必填欄位',
      uploadAllDocuments: '請上傳所有必要文件',
      rejectionReason: '拒絕原因',
      requirements: '驗證要求',
      req1: '✓ 政府核發證件的清晰照片',
      req2: '✓ 證件正反面',
      req3: '✓ 手持證件在臉部旁的自拍照',
      req4: '✓ 所有資訊必須清晰可見',
      req5: '✓ 證件必須有效且未過期',
      whyKyc: '為什麼要驗證？',
      benefit1: '✓ 解鎖銀行提現功能',
      benefit2: '✓ 提高客戶信任度',
      benefit3: '✓ 符合金融法規',
      benefit4: '✓ 保護帳戶安全',
      pendingMessage: '您的驗證正在審核中。我們將在 1-3 個工作日內通知您。',
      approvedMessage: '您的身份已驗證。您現在可以提現到銀行帳戶。',
      verifiedOn: '驗證日期',
    },
    'zh-CN': {
      title: '身份验证（KYC）',
      description: '完成身份验证以解锁提现功能',
      status: '验证状态',
      notStarted: '未开始',
      pending: '审核中',
      approved: '已验证',
      rejected: '已拒绝',
      startVerification: '开始验证',
      resubmit: '重新提交',
      personalInfo: '个人信息',
      fullName: '真实姓名',
      fullNamePlaceholder: '输入您的法定姓名',
      idType: '证件类型',
      nationalId: '身份证',
      passport: '护照',
      driverLicense: '驾照',
      idNumber: '证件号码',
      idNumberPlaceholder: '输入证件号码',
      phoneNumber: '手机号码',
      phonePlaceholder: '+86 138 0000 0000',
      dateOfBirth: '出生日期',
      address: '地址',
      addressPlaceholder: '街道地址',
      city: '城市',
      cityPlaceholder: '城市',
      postalCode: '邮政编码',
      postalCodePlaceholder: '邮政编码',
      country: '国家',
      documentUpload: '文件上传',
      idFront: '证件正面',
      idBack: '证件背面',
      selfie: '手持证件自拍照',
      uploadImage: '上传图片',
      changeImage: '更换',
      submit: '提交验证',
      submitting: '提交中...',
      success: 'KYC 验证已提交',
      error: '提交失败',
      fillAllFields: '请填写所有必填栏位',
      uploadAllDocuments: '请上传所有必要文件',
      rejectionReason: '拒绝原因',
      requirements: '验证要求',
      req1: '✓ 政府核发证件的清晰照片',
      req2: '✓ 证件正反面',
      req3: '✓ 手持证件在脸部旁的自拍照',
      req4: '✓ 所有信息必须清晰可见',
      req5: '✓ 证件必须有效且未过期',
      whyKyc: '为什么要验证？',
      benefit1: '✓ 解锁银行提现功能',
      benefit2: '✓ 提高客户信任度',
      benefit3: '✓ 符合金融法规',
      benefit4: '✓ 保护账户安全',
      pendingMessage: '您的验证正在审核中。我们将在 1-3 个工作日内通知您。',
      approvedMessage: '您的身份已验证。您现在可以提现到银行账户。',
      verifiedOn: '验证日期',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    if (user?.id && accessToken) {
      fetchKYCData();
    }
  }, [user?.id, accessToken]);

  const fetchKYCData = async () => {
    if (!user?.id || !accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kyc/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setKycData(data.kyc);
        
        // Pre-fill form if data exists
        if (data.kyc) {
          setFullName(data.kyc.full_name || '');
          setIdType(data.kyc.id_type || 'national_id');
          setIdNumber(data.kyc.id_number || '');
          setPhoneNumber(data.kyc.phone_number || '');
          setAddress(data.kyc.address || '');
          setCity(data.kyc.city || '');
          setPostalCode(data.kyc.postal_code || '');
          setCountry(data.kyc.country || 'TW');
          setDateOfBirth(data.kyc.date_of_birth || '');
        }
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'id_front' | 'id_back' | 'selfie', file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'en' ? 'Please upload an image file' : '請上傳圖片檔案');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'en' ? 'File size must be less than 5MB' : '檔案大小必須小於 5MB');
      return;
    }

    switch (type) {
      case 'id_front':
        setIdFrontFile(file);
        break;
      case 'id_back':
        setIdBackFile(file);
        break;
      case 'selfie':
        setSelfieFile(file);
        break;
    }
  };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('make-215f78a5-kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('make-215f78a5-kyc-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to get signed URL');
    }

    return signedUrlData.signedUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !accessToken) {
      toast.error(language === 'en' ? 'Please sign in' : '請先登入');
      return;
    }

    // Validation
    if (!fullName || !idNumber || !phoneNumber || !address || !city || !country || !dateOfBirth) {
      toast.error(t.fillAllFields);
      return;
    }

    if (!idFrontFile || !idBackFile || !selfieFile) {
      toast.error(t.uploadAllDocuments);
      return;
    }

    setSubmitting(true);
    try {
      // Upload files
      toast.info(language === 'en' ? 'Uploading documents...' : '上傳文件中...');
      
      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadFile(idFrontFile, 'id_front'),
        uploadFile(idBackFile, 'id_back'),
        uploadFile(selfieFile, 'selfie'),
      ]);

      // Submit KYC data
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/kyc/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: fullName,
            id_type: idType,
            id_number: idNumber,
            id_front_url: idFrontUrl,
            id_back_url: idBackUrl,
            selfie_url: selfieUrl,
            phone_number: phoneNumber,
            address,
            city,
            postal_code: postalCode,
            country,
            date_of_birth: dateOfBirth,
          }),
        }
      );

      if (response.ok) {
        toast.success(t.success);
        fetchKYCData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error(t.error + ': ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {t.notStarted}
          </Badge>
        );
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  // Show status if already submitted
  if (kycData?.status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
            </div>
            {getStatusBadge(kycData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-600 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              {t.pendingMessage}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t.fullName}:</span>
              <span>{kycData.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.idType}:</span>
              <span>{kycData.id_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.idNumber}:</span>
              <span>{kycData.id_number}</span>
            </div>
            {kycData.submitted_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Submitted:' : '提交時間：'}</span>
                <span>{new Date(kycData.submitted_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kycData?.status === 'approved') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
            </div>
            {getStatusBadge(kycData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-600 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              {t.approvedMessage}
            </AlertDescription>
          </Alert>

          {kycData.verified_at && (
            <div className="text-sm text-gray-600">
              {t.verifiedOn}: {new Date(kycData.verified_at).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show form for not_started or rejected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
          </div>
          {kycData && getStatusBadge(kycData.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rejection reason */}
        {kycData?.status === 'rejected' && kycData.rejection_reason && (
          <Alert className="border-red-600 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <div className="font-semibold mb-1">{t.rejectionReason}:</div>
              <div>{kycData.rejection_reason}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="font-semibold text-blue-900 mb-2">{t.whyKyc}</div>
          <div className="text-sm text-blue-900 space-y-1">
            <div>{t.benefit1}</div>
            <div>{t.benefit2}</div>
            <div>{t.benefit3}</div>
            <div>{t.benefit4}</div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="font-semibold mb-2">{t.requirements}</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div>{t.req1}</div>
            <div>{t.req2}</div>
            <div>{t.req3}</div>
            <div>{t.req4}</div>
            <div>{t.req5}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">{t.personalInfo}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fullName} *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t.dateOfBirth} *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idType">{t.idType} *</Label>
                <Select value={idType} onValueChange={(value: any) => setIdType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">{t.nationalId}</SelectItem>
                    <SelectItem value="passport">{t.passport}</SelectItem>
                    <SelectItem value="driver_license">{t.driverLicense}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">{t.idNumber} *</Label>
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={t.idNumberPlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t.phoneNumber} *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t.country} *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TW">Taiwan (台灣)</SelectItem>
                    <SelectItem value="CN">China (中國)</SelectItem>
                    <SelectItem value="HK">Hong Kong (香港)</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="JP">Japan (日本)</SelectItem>
                    <SelectItem value="KR">South Korea (韓國)</SelectItem>
                    <SelectItem value="SG">Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t.address} *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.city} *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">{t.postalCode}</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t.postalCodePlaceholder}
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <IdCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">{t.documentUpload}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ID Front */}
              <div className="space-y-2">
                <Label>{t.idFront} *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-600 transition-colors">
                  {idFrontFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <div className="text-sm text-gray-600 truncate">{idFrontFile.name}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('idFrontInput')?.click()}
                      >
                        {t.changeImage}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => document.getElementById('idFrontInput')?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-600">{t.uploadImage}</div>
                    </div>
                  )}
                  <input
                    id="idFrontInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange('id_front', e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* ID Back */}
              <div className="space-y-2">
                <Label>{t.idBack} *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-600 transition-colors">
                  {idBackFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <div className="text-sm text-gray-600 truncate">{idBackFile.name}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('idBackInput')?.click()}
                      >
                        {t.changeImage}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => document.getElementById('idBackInput')?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-600">{t.uploadImage}</div>
                    </div>
                  )}
                  <input
                    id="idBackInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange('id_back', e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Selfie */}
              <div className="space-y-2">
                <Label>{t.selfie} *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-600 transition-colors">
                  {selfieFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <div className="text-sm text-gray-600 truncate">{selfieFile.name}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('selfieInput')?.click()}
                      >
                        {t.changeImage}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => document.getElementById('selfieInput')?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-600">{t.uploadImage}</div>
                    </div>
                  )}
                  <input
                    id="selfieInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {kycData?.status === 'rejected' ? t.resubmit : t.submit}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
