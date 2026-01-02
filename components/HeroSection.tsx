import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, Users, Award, Heart, Shield, Play, Pause } from "lucide-react";
import { useState, useEffect, useMemo } from "react"; // ✅ Added useMemo
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ✅ Move static data outside component to prevent recreation on every render
const HERO_SLIDES = [
  {
    id: 1,
    title: "Cara Daftar Cek Kesehatan Gratis",
    subtitle: "Program Skrining Kesehatan Nasional 2025",
    description: "Dapatkan pemeriksaan kesehatan gratis di Puskesmas terdekat. Daftar online sekarang dan lindungi kesehatan keluarga Anda.",
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=500&fit=crop&crop=center",
    cta: "Daftar Sekarang",
    ctaSecondary: "Pelajari Lebih Lanjut",
    badge: "GRATIS",
    priority: "high"
  },
  {
    id: 2,
    title: "Imunisasi HPV Nasional",
    subtitle: "Lindungi Anak Perempuan dari Kanker Serviks",
    description: "Program imunisasi HPV gratis untuk anak perempuan usia sekolah. Cegah kanker serviks sejak dini dengan vaksin yang aman dan efektif.",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=500&fit=crop&crop=center",
    cta: "Info Lokasi Vaksin",
    ctaSecondary: "Jadwal Imunisasi",
    badge: "PROGRAM BARU",
    priority: "medium"
  },
  {
    id: 3,
    title: "Vaksin Merah Putih",
    subtitle: "Kebanggaan Produksi Dalam Negeri",
    description: "Indonesia berhasil memproduksi vaksin sendiri. Vaksin Merah Putih telah lulus uji klinis dan siap melindungi masyarakat Indonesia.",
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&h=500&fit=crop&crop=center",
    cta: "Lokasi Vaksinasi",
    ctaSecondary: "Info Vaksin",
    badge: "MADE IN INDONESIA",
    priority: "high"
  }
];

const RUNNING_NEWS = [
  "Puskesmas Teregistrasi Semester I Tahun 2024",
  "Survei Kesehatan Indonesia (SKI) 2023",
  "KMK tentang Perubahan atas KMK No HK.01.07/MENKES/4416/2021",
  "Rekrutmen Tenaga Kesehatan 2025 - Pendaftaran Dibuka",
  "Workshop Kesehatan Mental di Tempat Kerja - Daftar Sekarang"
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentNews, setCurrentNews] = useState(0);

  // Preload images for smoother transitions
  useEffect(() => {
    const preloadImages = () => {
      let loadedCount = 0;
      HERO_SLIDES.forEach((slide) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === HERO_SLIDES.length) {
            setImagesLoaded(true);
          }
        };
        img.src = slide.image;
      });
    };
    preloadImages();
  }, []); // ✅ No dependencies - only run once

  useEffect(() => {
    if (isPlaying && imagesLoaded) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, imagesLoaded]); // ✅ Removed heroSlides.length - use constant

  useEffect(() => {
    const newsInterval = setInterval(() => {
      setCurrentNews((prev) => (prev + 1) % RUNNING_NEWS.length);
    }, 4000);
    return () => clearInterval(newsInterval);
  }, []); // ✅ No dependencies - use constant length

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const quickStats = [
    { icon: Users, number: "234 juta", label: "Warga Terlindungi", color: "text-kemenkes-teal" },
    { icon: Heart, number: "11,847", label: "Puskesmas", color: "text-gray-600" },
    { icon: Shield, number: "2,813", label: "Rumah Sakit", color: "text-gray-700" },
    { icon: Award, number: "98.2%", label: "Cakupan Imunisasi", color: "text-kemenkes-teal" }
  ];

  const slideVariants = {
    enter: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    center: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const contentVariants = {
    enter: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1
      }
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const getBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-kemenkes-teal/20 text-kemenkes-teal border border-kemenkes-teal/30';
      case 'medium':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-white/20 text-white backdrop-blur-sm border border-white/30';
    }
  };

  return (
    <section id="home" className="relative overflow-hidden bg-gray-50 min-h-screen flex flex-col">
      {/* Running News Ticker */}
      <div className="bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime text-white py-2 relative z-20 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Badge className="bg-white/20 text-white hover:bg-white/30 mr-2 sm:mr-3 flex-shrink-0 backdrop-blur-sm text-xs">
              INFORMASI TERKINI
            </Badge>
            <div className="overflow-hidden flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentNews}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                  className="text-xs sm:text-sm font-medium truncate"
                >
                  {RUNNING_NEWS[currentNews]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel - Full viewport height minus news ticker */}
      <div className="relative flex-1 bg-gray-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 bg-gray-800"
          >
            {/* Background Image with Professional Overlay */}
            <div className="absolute inset-0">
              <ImageWithFallback
                src={HERO_SLIDES[currentSlide].image}
                alt={HERO_SLIDES[currentSlide].title}
                className="w-full h-full object-cover"
              />
              {/* Professional gradient overlay - consistent background */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-800/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent" />
            </div>
            
            <div className="relative z-10 h-full flex items-center py-8 sm:py-12">
              <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px] lg:min-h-[500px]">
                  <motion.div
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="text-white flex flex-col justify-center"
                  >
                    <Badge className={`mb-4 sm:mb-6 ${getBadgeStyle(HERO_SLIDES[currentSlide].priority)} font-medium px-3 py-1.5 text-xs sm:text-sm w-fit`}>
                      {HERO_SLIDES[currentSlide].badge}
                    </Badge>
                    {/* Responsive Typography for viewport */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                      {HERO_SLIDES[currentSlide].title}
                    </h1>
                    <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium mb-4 sm:mb-6 text-gray-100">
                      {HERO_SLIDES[currentSlide].subtitle}
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 text-gray-200 max-w-2xl leading-relaxed">
                      {HERO_SLIDES[currentSlide].description}
                    </p>
                    
                    {/* Button Layout */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="w-full sm:w-auto"
                      >
                        <Button size="lg" className="w-full sm:w-auto bg-kemenkes-teal hover:bg-kemenkes-dark-teal text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-base sm:text-lg">
                          {HERO_SLIDES[currentSlide].cta}
                          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="w-full sm:w-auto"
                      >
                        <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-gray-900 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-200 text-base sm:text-lg backdrop-blur-sm">
                          {HERO_SLIDES[currentSlide].ctaSecondary}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Quick Access Panel */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeOut",
                      delay: 0.2
                    }}
                    className="hidden md:flex md:items-center md:justify-center lg:block"
                  >
                    <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 w-full max-w-md">
                      <CardContent className="p-6 lg:p-8">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Akses Cepat</h3>
                        <div className="space-y-3 lg:space-y-4">
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button variant="outline" className="w-full justify-start h-12 lg:h-14 hover:bg-kemenkes-teal hover:text-white hover:border-kemenkes-teal transition-all duration-200 text-left">
                              <Calendar className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                              <div>
                                <div className="font-medium text-gray-900 text-sm lg:text-base">Buat Janji Temu</div>
                                <div className="text-xs text-gray-700">Booking online faskes</div>
                              </div>
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button variant="outline" className="w-full justify-start h-12 lg:h-14 hover:bg-kemenkes-lime hover:text-white hover:border-kemenkes-lime transition-all duration-200 text-left">
                              <Shield className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                              <div>
                                <div className="font-medium text-gray-900 text-sm lg:text-base">Cek Status Imunisasi</div>
                                <div className="text-xs text-gray-700">Riwayat vaksinasi</div>
                              </div>
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button variant="outline" className="w-full justify-start h-12 lg:h-14 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-all duration-200 text-left">
                              <Heart className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                              <div>
                                <div className="font-medium text-gray-900 text-sm lg:text-base">Konsultasi Online</div>
                                <div className="text-xs text-gray-700">Telehealth 24/7</div>
                              </div>
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button variant="outline" className="w-full justify-start h-12 lg:h-14 hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all duration-200 text-left">
                              <Users className="mr-3 h-4 w-4 lg:h-5 lg:w-5" />
                              <div>
                                <div className="font-medium text-gray-900 text-sm lg:text-base">Lokasi Puskesmas</div>
                                <div className="text-xs text-gray-700">Cari faskes terdekat</div>
                              </div>
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls - Touch-friendly sizes */}
        <motion.button
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Slide sebelumnya"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" />
        </motion.button>
        
        <motion.button
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Slide selanjutnya"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" />
        </motion.button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3" role="tablist" aria-label="Hero slide indicators">
          {HERO_SLIDES.map((slide, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-6 sm:w-8' 
                  : 'bg-white/50 hover:bg-white/70 w-2.5 sm:w-3'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Slide ${index + 1}: ${slide.title}`}
            />
          ))}
        </div>

        {/* Play/Pause Control */}
        <motion.button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          ) : (
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
          )}
        </motion.button>


      </div>

      {/* Mobile Quick Access - More compact */}
      <div className="md:hidden bg-white py-4 border-t border-gray-100 flex-shrink-0">
        <div className="container mx-auto px-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Akses Cepat</h3>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="outline" className="w-full h-14 hover:bg-kemenkes-teal hover:text-white hover:border-kemenkes-teal transition-all duration-200 flex-col text-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Janji Temu</span>
              </Button>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="outline" className="w-full h-14 hover:bg-kemenkes-lime hover:text-white hover:border-kemenkes-lime transition-all duration-200 flex-col text-center gap-1">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-medium">Imunisasi</span>
              </Button>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="outline" className="w-full h-14 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-all duration-200 flex-col text-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="text-xs font-medium">Konsultasi</span>
              </Button>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="outline" className="w-full h-14 hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all duration-200 flex-col text-center gap-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Puskesmas</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Compact and separate section */}
      <div className="bg-white py-6 sm:py-8 border-t border-gray-100 relative z-10 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className="text-center group cursor-pointer"
                whileHover={{ y: -3 }}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 ${stat.color} mb-2 sm:mb-3 group-hover:bg-gray-100 transition-all duration-200 group-hover:scale-105`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}