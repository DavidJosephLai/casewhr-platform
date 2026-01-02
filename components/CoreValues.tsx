import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { Award, Lightbulb, Leaf, Eye, Zap } from "lucide-react";

export function CoreValues() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).coreValues;

  const icons = [
    <Award className="h-12 w-12" />,
    <Lightbulb className="h-12 w-12" />,
    <Leaf className="h-12 w-12" />,
    <Eye className="h-12 w-12" />,
    <Zap className="h-12 w-12" />
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 mb-4">{t.title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {t.values.map((value, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
                  {icons[index]}
                </div>
              </div>

              {/* Value Name */}
              <h3 className="text-center mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
                {value.name}
              </h3>

              {/* Description */}
              <p className="text-center text-gray-600">
                {value.description}
              </p>

              {/* Decorative Element */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoreValues;