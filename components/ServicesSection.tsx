import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowRight, Stethoscope, Users, ShieldCheck, Heart, Calendar, FileText, Phone, MapPin, Clock, Award, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import satuSehatImage from 'figma:asset/822c7988ed2baf3bffdfaafe3b1ba3c9b8e61473.png';

export function ServicesSection() {
  const mainServices = [
    {
      icon: Stethoscope,
      title: "Platform SatuSehat",
      description: "Sistem informasi kesehatan terintegrasi untuk memudahkan akses layanan kesehatan di seluruh Indonesia.",
      image: satuSehatImage,
      features: ["Rekam Medis Digital", "Telemedicine", "Booking Online"],
      badge: "PRIORITAS",
      color: "from-kemenkes-teal to-blue-500"
    },
    {
      icon: ShieldCheck,
      title: "Penanggulangan Penyakit",
      description: "Program komprehensif pencegahan dan pengendalian penyakit menular dan tidak menular.",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      features: ["Vaksinasi Massal", "Surveilans Epidemiologi", "Contact Tracing"],
      badge: "PENTING", 
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Heart,
      title: "Farmasi dan Alat Kesehatan",
      description: "Pengawasan dan distribusi obat-obatan serta alat kesehatan untuk menjamin kualitas dan keamanan.",
      image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      features: ["Registrasi Obat", "Inspeksi Farmasi", "Standar Alkes"],
      badge: "REGULASI",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Users,
      title: "Kebijakan Kesehatan",
      description: "Perumusan dan implementasi kebijakan kesehatan nasional untuk mewujudkan Indonesia sehat.",
      image: "https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      features: ["Analisis Kebijakan", "Evaluasi Program", "Koordinasi Lintas Sektor"],
      badge: "STRATEGIS",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Award,
      title: "Pantauan Kejadian Krisis Kesehatan",
      description: "Sistem monitoring dan respons cepat untuk menangani krisis kesehatan dan bencana.",
      image: "https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      features: ["Alert System", "Emergency Response", "Crisis Management"],
      badge: "SIAGA",
      color: "from-orange-500 to-red-500"
    }
  ];

  const quickServices = [
    { icon: Calendar, title: "Buat Janji Temu", desc: "Booking online Puskesmas & RS", urgent: false },
    { icon: FileText, title: "Cek Hasil Lab", desc: "Akses hasil pemeriksaan", urgent: false },
    { icon: Phone, title: "Konsultasi Online", desc: "Telehealth 24/7", urgent: true },
    { icon: MapPin, title: "Lokasi Faskes", desc: "Cari fasilitas terdekat", urgent: false },
    { icon: ShieldCheck, title: "Status Imunisasi", desc: "Cek riwayat vaksin", urgent: false },
    { icon: Clock, title: "Layanan Darurat", desc: "Hotline 119", urgent: true }
  ];

  const digitalServices = [
    {
      title: "SIKM (Sistem Informasi Kesehatan Masyarakat)",
      description: "Portal terintegrasi untuk layanan kesehatan digital",
      icon: Globe,
      stats: "2.1M+ pengguna",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "E-Puskesmas",
      description: "Sistem manajemen Puskesmas berbasis digital",
      icon: Stethoscope,
      stats: "11,847 Puskesmas",
      image: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "Aplikasi PeduliLindungi",
      description: "Tracing dan monitoring kesehatan masyarakat",
      icon: ShieldCheck,
      stats: "234M+ unduhan",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    }
  ];

  return (
    <section id="services" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge className="bg-kemenkes-teal text-white mb-4">LAYANAN KEMENTERIAN KESEHATAN</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Layanan Unggulan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Akses mudah dan cepat ke berbagai layanan kesehatan digital untuk mendukung kesehatan masyarakat Indonesia
          </p>
        </motion.div>

        {/* Quick Access Services */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Akses Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickServices.map((service, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group cursor-pointer"
              >
                <Card className={`h-full transition-all duration-300 hover:shadow-soft-teal ${
                  service.urgent ? 'border-2 border-red-200 bg-red-50/50' : 'hover:shadow-lg'
                }`}>
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                      service.urgent ? 'bg-red-100 text-red-600' : 'bg-kemenkes-teal/10 text-kemenkes-teal'
                    } group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">{service.title}</h4>
                    <p className="text-xs text-gray-600">{service.desc}</p>
                    {service.urgent && (
                      <Badge className="mt-2 bg-red-500 text-white">Darurat</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Services Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {mainServices.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="h-full overflow-hidden hover:shadow-soft-gradient transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`} />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm font-semibold">
                      {service.badge}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <service.icon className="h-6 w-6 text-gray-900" />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 group-hover:text-kemenkes-teal transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 bg-kemenkes-teal rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-kemenkes-teal group-hover:text-white group-hover:border-kemenkes-teal transition-all duration-300"
                  >
                    Pelajari Lebih Lanjut
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Digital Services Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-r from-kemenkes-teal to-kemenkes-lime text-white overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                alt="Digital technology background"
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="bg-white/90 text-gray-900 mb-4 font-semibold">TRANSFORMASI DIGITAL</Badge>
                  <h3 className="text-3xl font-bold mb-4 text-white">Platform Digital Terdepan</h3>
                  <p className="text-gray-100 mb-6 text-lg leading-relaxed">
                    Kementerian Kesehatan menghadirkan berbagai platform digital untuk memudahkan akses layanan kesehatan bagi seluruh rakyat Indonesia.
                  </p>
                  <Button variant="outline" className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-kemenkes-teal font-semibold backdrop-blur-sm">
                    Jelajahi Semua Platform
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {digitalServices.map((digital, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white/20 backdrop-blur-sm rounded-lg p-4 hover:bg-white/30 transition-colors cursor-pointer border border-white/20 relative overflow-hidden"
                    >
                      {/* Platform Background Image */}
                      <div className="absolute inset-0 opacity-5">
                        <ImageWithFallback
                          src={digital.image}
                          alt={digital.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center">
                          <digital.icon className="h-6 w-6 text-gray-900" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{digital.title}</h4>
                          <p className="text-gray-100 text-sm leading-relaxed">{digital.description}</p>
                        </div>
                        <Badge className="bg-white/90 text-gray-900 font-semibold">{digital.stats}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Healthcare Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Pencapaian Kesehatan Indonesia</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Angka Harapan Hidup",
                value: "71.6 tahun",
                desc: "Meningkat dari tahun sebelumnya",
                image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Cakupan JKN-KIS",
                value: "234 juta",
                desc: "Warga terlindungi jaminan kesehatan",
                image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                color: "from-green-500 to-emerald-500"
              },
              {
                title: "Tenaga Kesehatan",
                value: "1.2 juta",
                desc: "Dokter, perawat, dan tenaga kesehatan lainnya",
                image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                color: "from-purple-500 to-violet-500"
              },
              {
                title: "Program Stunting",
                value: "21.6%",
                desc: "Penurunan prevalensi stunting balita",
                image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
                color: "from-orange-500 to-amber-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="h-full overflow-hidden hover:shadow-soft-gradient transition-all duration-300">
                  <div className="relative h-32 overflow-hidden">
                    <ImageWithFallback
                      src={stat.image}
                      alt={stat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${stat.color} opacity-80`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm opacity-90">{stat.title}</div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 text-center">{stat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}