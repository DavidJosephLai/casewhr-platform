import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function NewsSection() {
  const news = [
    {
      id: 1,
      title: "Peluncuran Program Imunisasi HPV Nasional untuk Anak Sekolah",
      excerpt: "Kementerian Kesehatan meluncurkan program imunisasi HPV gratis untuk mencegah kanker serviks pada anak perempuan usia sekolah.",
      date: "2025-06-05",
      time: "14:30",
      category: "Program",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" // Vaccination scene
    },
    {
      id: 2,
      title: "Update Protokol Kesehatan untuk Musim Hujan 2025",
      excerpt: "Panduan pencegahan penyakit yang sering muncul di musim hujan seperti DBD, diare, dan ISPA untuk masyarakat Indonesia.",
      date: "2025-06-04",
      time: "10:15",
      category: "Pengumuman",
      image: "https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" // Healthcare protocol
    },
    {
      id: 3,
      title: "Terobosan Baru: Indonesia Berhasil Produksi Vaksin Merah Putih",
      excerpt: "Vaksin produksi dalam negeri telah lulus uji klinis dan siap didistribusikan ke seluruh nusantara sebagai upaya kemandirian kesehatan.",
      date: "2025-06-03",
      time: "16:45",
      category: "Inovasi",
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" // Medical research lab
    }
  ];

  const announcements = [
    {
      title: "Rekrutmen Tenaga Kesehatan 2025",
      date: "2025-06-06",
      urgent: true
    },
    {
      title: "Workshop Kesehatan Mental di Tempat Kerja",
      date: "2025-06-10",
      urgent: false
    },
    {
      title: "Sosialisasi Gerakan Masyarakat Hidup Sehat (GERMAS)",
      date: "2025-06-15",
      urgent: false
    },
    {
      title: "Pelatihan Kader Posyandu Se-Indonesia",
      date: "2025-06-20",
      urgent: false
    }
  ];

  return (
    <section id="news" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main News */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Berita Terbaru</h2>
              <Button variant="outline" className="hover:bg-kemenkes-teal hover:text-white hover:border-kemenkes-teal transition-all duration-300">
                Lihat Semua Berita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {news.map((item) => (
                <Card key={item.id} className="hover:shadow-soft-teal transition-all duration-300 group">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <ImageWithFallback 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-48 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-center mb-3">
                        <Badge variant="secondary" className="mr-3 bg-kemenkes-teal/10 text-kemenkes-teal hover:bg-kemenkes-teal hover:text-white transition-colors duration-300">
                          {item.category}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.date).toLocaleDateString('id-ID')}
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          {item.time}
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 hover:text-kemenkes-teal cursor-pointer transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{item.excerpt}</p>
                      <Button variant="ghost" size="sm" className="text-kemenkes-teal hover:text-kemenkes-dark-teal hover:bg-kemenkes-teal/10 p-0 transition-all duration-300">
                        Baca Selengkapnya
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Announcements */}
            <Card className="shadow-soft-lime">
              <CardHeader>
                <CardTitle className="text-xl text-kemenkes-teal">Pengumuman</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <div key={index} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 hover:text-kemenkes-teal cursor-pointer transition-colors">
                            {announcement.title}
                          </h4>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(announcement.date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        {announcement.urgent && (
                          <Badge variant="destructive" className="ml-2">
                            Penting
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 hover:bg-kemenkes-lime hover:text-white hover:border-kemenkes-lime transition-all duration-300">
                  Lihat Semua Pengumuman
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats with Background Images */}
            <Card className="shadow-soft-gradient">
              <CardHeader>
                <CardTitle className="text-xl text-kemenkes-teal">Data Kesehatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-kemenkes-teal/10 to-kemenkes-lime/10 rounded-lg hover:shadow-soft-teal transition-all duration-300 group cursor-pointer">
                    <div className="absolute inset-0 opacity-5">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                        alt="Imunisasi background"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-kemenkes-teal group-hover:scale-110 transition-transform duration-300">98.2%</div>
                      <div className="text-sm text-gray-600">Cakupan Imunisasi Dasar</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-blue-50 to-kemenkes-teal/10 rounded-lg hover:shadow-soft-teal transition-all duration-300 group cursor-pointer">
                    <div className="absolute inset-0 opacity-5">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                        alt="Puskesmas background"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">11,847</div>
                      <div className="text-sm text-gray-600">Puskesmas di Indonesia</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-purple-50 to-kemenkes-lime/10 rounded-lg hover:shadow-soft-lime transition-all duration-300 group cursor-pointer">
                    <div className="absolute inset-0 opacity-5">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                        alt="Rumah sakit background"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-300">2,813</div>
                      <div className="text-sm text-gray-600">Rumah Sakit</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}