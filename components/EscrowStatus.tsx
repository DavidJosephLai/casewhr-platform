import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Clock, XCircle, Lock, DollarSign, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { projectId } from "../utils/supabase/info";
import { formatCurrencyAuto, type Currency } from "../lib/currency";

interface EscrowStatusProps {
  projectId: string;
  onEscrowChange?: () => void;
}

interface Escrow {
  id: string;
  project_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number;
  status: 'locked' | 'released' | 'refunded';
  description: string;
  created_at: string;
  updated_at: string;
  released_at?: string;
  refunded_at?: string;
}

export function EscrowStatus({ projectId: projectIdProp, onEscrowChange }: EscrowStatusProps) {
  const { language } = useLanguage();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ⭐ Escrow 金額統一以 TWD 儲存
  const storedCurrency: Currency = 'TWD';

  const translations = {
    en: {
      title: 'Payment Escrow',
      noEscrow: 'No escrow created yet',
      amount: 'Amount',
      status: {
        locked: 'Locked in Escrow',
        released: 'Payment Released',
        refunded: 'Refunded',
      },
      createdAt: 'Created',
      releasedAt: 'Released',
      refundedAt: 'Refunded',
      description: 'Description',
      info: {
        locked: 'Funds are securely held in escrow and will be released when deliverables are approved.',
        released: 'Payment has been released to the freelancer.',
        refunded: 'Payment has been refunded to the client.',
      },
    },
    zh: {
      title: '托管付款',
      noEscrow: '尚未創建托管',
      amount: '金額',
      status: {
        locked: '托管中',
        released: '已釋放',
        refunded: '已退款',
      },
      createdAt: '創建時間',
      releasedAt: '釋放時間',
      refundedAt: '退款時間',
      description: '描述',
      info: {
        locked: '資金安全托管中，當交付物審核通過後將自動釋放。',
        released: '款項已釋放給接案者。',
        refunded: '款項已退款給案主。',
      },
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchEscrow();
  }, [projectIdProp]);

  const fetchEscrow = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/payment/escrow/project/${projectIdProp}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch escrow');
      }

      const data = await response.json();
      setEscrow(data.escrow);
    } catch (error) {
      console.error('Error fetching escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: Escrow['status']) => {
    const configs = {
      locked: {
        icon: Lock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        badgeVariant: 'default' as const,
      },
      released: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeVariant: 'default' as const,
      },
      refunded: {
        icon: XCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeVariant: 'outline' as const,
      },
    };
    return configs[status];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!escrow) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="size-5 text-muted-foreground" />
          <h3 className="text-sm">{t.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t.noEscrow}</p>
      </Card>
    );
  }

  const config = getStatusConfig(escrow.status);
  const StatusIcon = config.icon;

  return (
    <Card className={`p-6 border-2 ${config.borderColor} ${config.bgColor}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`size-6 ${config.color}`} />
            <div>
              <h3 className="text-sm">{t.title}</h3>
              <Badge variant={config.badgeVariant} className={`mt-1 ${config.color}`}>
                {t.status[escrow.status]}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t.amount}</p>
            <p className={`text-2xl ${config.color}`}>{formatCurrencyAuto(escrow.amount, storedCurrency, language)}</p>
          </div>
        </div>

        {/* Info Alert */}
        <div className={`p-3 rounded-lg border ${config.borderColor} bg-white/50`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`size-4 mt-0.5 ${config.color}`} />
            <p className="text-sm">{t.info[escrow.status]}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.description}:</span>
            <span>{escrow.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.createdAt}:</span>
            <span>{new Date(escrow.created_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</span>
          </div>
          {escrow.released_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.releasedAt}:</span>
              <span>{new Date(escrow.released_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</span>
            </div>
          )}
          {escrow.refunded_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.refundedAt}:</span>
              <span>{new Date(escrow.refunded_at).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}