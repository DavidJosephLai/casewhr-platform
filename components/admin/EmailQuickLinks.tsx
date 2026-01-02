import { Card } from '../ui/card';
import { Mail, Shield, ExternalLink } from 'lucide-react';

export function EmailQuickLinks() {
  const links = [
    {
      title: 'Brevo Dashboard',
      description: '查看發送統計',
      url: 'https://app.brevo.com',
      icon: Mail,
      color: 'blue',
    },
    {
      title: 'MX Toolbox',
      description: '檢查 DNS 記錄',
      url: 'https://mxtoolbox.com/SuperTool.aspx?action=mx%3acasewhr.com&run=toolpage',
      icon: Shield,
      color: 'green',
    },
    {
      title: 'Mail Tester',
      description: '測試垃圾評分',
      url: 'https://www.mail-tester.com',
      icon: Mail,
      color: 'purple',
    },
    {
      title: 'Zoho Mail',
      description: 'support@casewhr.com',
      url: 'https://mail.zoho.com',
      icon: Mail,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-900',
      subtext: 'text-blue-700',
      icon: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-200',
      text: 'text-green-900',
      subtext: 'text-green-700',
      icon: 'text-green-600',
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-900',
      subtext: 'text-purple-700',
      icon: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-900',
      subtext: 'text-orange-700',
      icon: 'text-orange-600',
    },
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🔗 Opening external link:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📧 郵件系統快速連結</h3>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
          ✅ 系統正常
        </span>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          const colors = colorClasses[link.color as keyof typeof colorClasses];
          
          return (
            <button
              key={link.title}
              onClick={(e) => handleLinkClick(link.url, e)}
              className={`flex items-start gap-3 p-3 ${colors.bg} border ${colors.border} rounded-lg transition-all group cursor-pointer w-full text-left`}
            >
              <div className={`p-2 bg-white rounded-lg ${colors.icon}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={`font-medium ${colors.text} text-sm truncate`}>
                    {link.title}
                  </p>
                  <ExternalLink className={`h-3 w-3 ${colors.icon} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                </div>
                <p className={`text-xs ${colors.subtext} truncate`}>
                  {link.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">發件人: support@casewhr.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">送達率:</span>
            <span className="font-semibold text-green-600">95%+</span>
          </div>
        </div>
      </div>
    </Card>
  );
}