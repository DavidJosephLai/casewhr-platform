import { Card } from "./ui/card";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";

export function Process() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).process;

  return (
    <section id="process" className="py-20 bg-blue-600 text-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-white">{t.title}</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {t.steps.map((step, index) => (
            <Card key={index} className="bg-white/10 border-white/20 text-white p-6 backdrop-blur-sm">
              <div className="text-4xl mb-4 text-blue-200">0{index + 1}</div>
              <h3 className="mb-2 text-white">{step.title}</h3>
              <p className="text-sm text-blue-100">{step.description}</p>
              {index < t.steps.length - 1 && (
                <CheckCircle2 className="h-6 w-6 mt-4 text-green-400" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Process;