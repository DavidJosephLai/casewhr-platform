import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "framer-motion";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className={`h-6 px-2 font-semibold transition-all duration-300 ${
            language === 'id' 
              ? 'text-white bg-white/20 hover:bg-white/30' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          ID
        </Button>
      </motion.div>
      <span className="text-white/50">|</span>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className={`h-6 px-2 font-semibold transition-all duration-300 ${
            language === 'en' 
              ? 'text-white bg-white/20 hover:bg-white/30' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          EN
        </Button>
      </motion.div>
    </div>
  );
}