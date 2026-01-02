import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function Contact() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).contact;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessType: "",
    message: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log('📧 [Contact Form] Submitting form...', formData);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/contact/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit form');
      }

      console.log('✅ [Contact Form] Form submitted successfully');
      toast.success(data.message || t.form.successMessage);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        businessType: "",
        message: ""
      });
    } catch (error: any) {
      console.error('❌ [Contact Form] Error:', error);
      toast.error(
        language !== 'en'
          ? '提交失敗，請稍後再試。'
          : 'Submission failed. Please try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">{t.title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">{t.form.name}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.form.namePlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t.form.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.form.emailPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">{t.form.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.form.phonePlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">{t.form.businessType}</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                    >
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder={t.form.businessTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="manufacturing" value="manufacturing">{t.businessTypes.manufacturing}</SelectItem>
                        <SelectItem key="retail" value="retail">{t.businessTypes.retail}</SelectItem>
                        <SelectItem key="technology" value="technology">{t.businessTypes.technology}</SelectItem>
                        <SelectItem key="services" value="services">{t.businessTypes.services}</SelectItem>
                        <SelectItem key="other" value="other">{t.businessTypes.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">{t.form.message}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t.form.messagePlaceholder}
                    rows={12}
                    className="min-h-[300px]"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (language !== 'en' ? '提交中...' : 'Submitting...') : t.form.submit}
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <Phone className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="mb-2">{t.info.phone}</h3>
              <p className="text-gray-600">+886-906-595777</p>
              <p className="text-sm text-gray-500 mt-2">{t.info.phoneHours}</p>
            </Card>

            <Card className="p-6">
              <Mail className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="mb-2">{t.info.email}</h3>
              <a href="mailto:support@casewhr.com" className="text-gray-600 hover:text-blue-600 transition-colors">
                support@casewhr.com
              </a>
              <p className="text-sm text-gray-500 mt-2">{t.info.emailResponse}</p>
            </Card>

            <Card className="p-6">
              <MapPin className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="mb-2">{t.info.office}</h3>
              <p className="text-gray-600 whitespace-pre-line">{t.info.address}</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;