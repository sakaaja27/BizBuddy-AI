import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { HelpCircle, Search, BookOpen, PlayCircle, MessageCircle, Store, Package, ShoppingBag, Star, Bot, ChevronDown, Mail, Users, Play, ExternalLink, Check } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Pesanan',
    items: [
      {
        q: "Bagaimana cara menambah pesanan dengan AI?",
        a: "Ketik pesanan dalam bahasa natural di input bar halaman Kelola Pesanan. Contoh: \"2 nasi goreng untuk Budi meja 3\". AI akan otomatis memproses dan mengenali item dari menu kamu."
      },
      {
        q: "Kenapa pesanan tidak bisa ditambah?",
        a: "Pastikan stok produk mencukupi. BizBuddy akan memberi peringatan jika stok tidak cukup untuk pesanan."
      },
      {
        q: "Bisa tidak import pesanan dari GoFood/GrabFood?",
        a: "Saat ini pesanan dari platform eksternal perlu diinput manual. Fitur integrasi otomatis ada di roadmap kami."
      }
    ]
  },
  {
    category: 'Stok',
    items: [
      {
        q: "Kapan stok otomatis berkurang?",
        a: "Stok berkurang otomatis saat status pesanan diubah ke \"Diproses\". Jika pesanan dibatalkan, stok akan dikembalikan otomatis."
      },
      {
        q: "Bagaimana cara restock produk?",
        a: "Buka Inventory Radar → klik ikon titik tiga pada produk → pilih \"Tambah Stok\" → masukkan jumlah yang diterima."
      },
      {
        q: "Apa itu prediksi AI restock?",
        a: "BizBuddy menganalisis kecepatan penjualan 7 hari terakhir dan memprediksi kapan stok akan habis. Alert otomatis muncul saat stok kritis."
      }
    ]
  },
  {
    category: 'Review',
    items: [
      {
        q: "Dari mana sumber review yang bisa dianalisis?",
        a: "Kamu bisa paste review dari mana saja: Tokopedia, Shopee, Google Maps, GoFood, WhatsApp, dll. Cukup copy teks review dan paste ke analyzer."
      },
      {
        q: "Apa itu Draft Balasan AI?",
        a: "Untuk review negatif, BizBuddy akan otomatis generate draft balasan yang profesional dan empati. Kamu tinggal copy dan paste ke platform."
      }
    ]
  },
  {
    category: 'AI',
    items: [
      {
        q: "Apa saja yang bisa ditanya ke BizBuddy AI?",
        a: "Kamu bisa tanya tentang: Produk terlaris periode tertentu, Kapan harus restock produk, Analisis review pelanggan, Saran promosi berdasarkan tren, Ringkasan keuangan, dan Tips bisnis sesuai jenis usahamu."
      },
      {
        q: "Kenapa jawaban AI kadang tidak akurat?",
        a: "AI menggunakan data yang sudah kamu input ke BizBuddy. Semakin lengkap data pesanan, stok, dan review kamu, semakin akurat sarannya."
      }
    ]
  },
  {
    category: 'Akun & Billing',
    items: [
      {
        q: "Apa bedanya Trial vs Premium?",
        a: "Trial memberikan akses penuh selama 30 hari gratis. Setelah trial berakhir, akun otomatis turun ke Plan Gratis dengan batasan fitur."
      },
      {
        q: "Bagaimana cara upgrade ke Premium?",
        a: "Klik tombol \"Upgrade Bisnis\" di sidebar atau buka menu Pengaturan → Plan & Billing → pilih metode pembayaran."
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya. Semua data dienkripsi AES-256 dan disimpan di server Indonesia. Kami tidak pernah menjual atau membagikan data bisnis kamu."
      }
    ]
  }
];

const VIDEOS = [
  { title: "Setup Awal BizBuddy AI", duration: "3:24", tag: "Pemula" },
  { title: "Cara Pakai AI Order Parser", duration: "2:15", tag: "Pesanan" },
  { title: "Analisis Review dengan AI", duration: "4:01", tag: "Review" },
  { title: "Laporan Keuangan & Export", duration: "5:30", tag: "Keuangan" }
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const categories = ['Semua', 'Pesanan', 'Stok', 'Review', 'AI', 'Akun & Billing'];

  const filteredFaqs = FAQ_DATA.map(group => {
    if (activeCategory !== 'Semua' && group.category !== activeCategory) return null;
    
    const filteredItems = group.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length === 0) return null;
    return { ...group, items: filteredItems };
  }).filter(Boolean);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <DashboardLayout>
      <div className="pb-24 md:pb-8">
        
        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#0f2057] to-primary rounded-b-3xl md:rounded-b-none p-8 md:p-16 text-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="text-5xl md:text-6xl mb-4 animate-bounce">💬</div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">Pusat Bantuan BizBuddy AI</h1>
            <p className="text-white/80 text-lg mb-8">Temukan jawaban, panduan, dan tips untuk mengembangkan bisnis kamu</p>
            
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari artikel bantuan, panduan, atau FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border-none shadow-xl text-gray-900 focus:ring-4 focus:ring-white/30 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 md:-mt-8 relative z-20">
          {/* QUICK ACTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:scale-105 transition-transform cursor-pointer group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Panduan Mulai</h3>
              <p className="text-gray-500 text-sm mb-4">Pelajari cara setup BizBuddy AI dari awal hingga mahir</p>
              <button className="text-primary font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform">
                Lihat Panduan <span className="ml-1">→</span>
              </button>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:scale-105 transition-transform cursor-pointer group relative">
              <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Baru!</span>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <PlayCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Video Tutorial</h3>
              <p className="text-gray-500 text-sm mb-4">Tonton cara pakai setiap fitur step by step secara visual</p>
              <button className="text-primary font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform">
                Tonton Sekarang <span className="ml-1">→</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:scale-105 transition-transform cursor-pointer group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <MessageCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Hubungi Support</h3>
              <p className="text-gray-500 text-sm mb-4">Butuh bantuan lebih lanjut? Tim kami siap membantu 24/7</p>
              <button className="text-primary font-bold text-sm flex items-center group-hover:translate-x-2 transition-transform" onClick={() => window.open('https://wa.me/628000000000', '_blank')}>
                Chat Support <span className="ml-1">→</span>
              </button>
            </div>
          </div>

          {/* GETTING STARTED */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
              <span className="mr-3 text-2xl">🚀</span> Mulai dari Sini
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              
              <div className="min-w-[280px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm snap-start">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-primary mb-4">
                  <Store size={20} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Step 1: Setup Toko</h4>
                <p className="text-gray-500 text-sm mb-4">Lengkapi profil toko kamu agar AI dapat memberikan saran yang personal.</p>
                <a href="/dashboard/settings" className="text-sm font-bold text-primary hover:underline">Buka Pengaturan →</a>
              </div>

              <div className="min-w-[280px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm snap-start">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <Package size={20} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Step 2: Tambah Produk</h4>
                <p className="text-gray-500 text-sm mb-4">Daftarkan semua produk/layanan kamu ke Inventory Radar.</p>
                <a href="/dashboard/inventory" className="text-sm font-bold text-blue-600 hover:underline">Buka Inventory →</a>
              </div>

              <div className="min-w-[280px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm snap-start">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <ShoppingBag size={20} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Step 3: Catat Pesanan</h4>
                <p className="text-gray-500 text-sm mb-4">Coba tambah pesanan dengan input AI natural language yang pintar.</p>
                <a href="/dashboard/orders" className="text-sm font-bold text-green-600 hover:underline">Buka Pesanan →</a>
              </div>

              <div className="min-w-[280px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm snap-start">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                  <Star size={20} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Step 4: Analisis Review</h4>
                <p className="text-gray-500 text-sm mb-4">Paste review pelanggan dan biarkan AI menganalisis & membuat balasan.</p>
                <a href="/dashboard/reviews" className="text-sm font-bold text-yellow-600 hover:underline">Buka Review →</a>
              </div>

              <div className="min-w-[280px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm snap-start">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                  <Bot size={20} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Step 5: Tanya AI</h4>
                <p className="text-gray-500 text-sm mb-4">Tanya BizBuddy tentang performa bisnis kamu hari ini.</p>
                <a href="/dashboard/ai-assistant" className="text-sm font-bold text-purple-600 hover:underline">Buka AI Chat →</a>
              </div>

            </div>
          </div>

          {/* FAQ SECTION */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
              <span className="mr-3 text-2xl">❓</span> Pertanyaan yang Sering Ditanyakan
            </h2>
            
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((group, groupIndex) => (
                  <div key={group.category}>
                    <div className="bg-gray-50 px-6 py-3 font-bold text-gray-500 text-sm uppercase tracking-wider">
                      {group.category}
                    </div>
                    {group.items.map((item, itemIndex) => {
                      const absoluteIndex = `${groupIndex}-${itemIndex}`;
                      const isOpen = openFaqIndex === absoluteIndex;
                      return (
                        <div key={itemIndex} className="border-b border-gray-100 last:border-0">
                          <button
                            onClick={() => toggleFaq(absoluteIndex)}
                            className="w-full text-left px-6 py-4 focus:outline-none flex justify-between items-center hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-gray-900">{item.q}</span>
                            <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4 text-gray-600 text-sm animate-fade-in leading-relaxed">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search size={32} className="mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada hasil untuk "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* VIDEO TUTORIALS */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
              <span className="mr-3 text-2xl">🎥</span> Tutorial Video
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {VIDEOS.map((vid, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-3">
                    <img src={`https://source.unsplash.com/600x400/?tech,business&sig=${idx}`} alt={vid.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary/90 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                        <Play size={24} className="ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
                      {vid.duration}
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{vid.title}</h4>
                  <span className="text-xs text-gray-500 font-semibold mt-1 inline-block">{vid.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONTACT SUPPORT */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
              <span className="mr-3 text-2xl">📞</span> Hubungi Kami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a href="https://wa.me/628000000000" target="_blank" rel="noreferrer" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-center group">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-500 text-sm mb-4">Chat langsung dengan tim support kami. Respons dalam 1x24 jam.</p>
                <span className="inline-flex items-center text-green-600 font-bold text-sm">
                  Chat WhatsApp <ExternalLink size={14} className="ml-1" />
                </span>
              </a>

              <a href="mailto:support@bizbuddy.ai" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-center group">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
                <p className="text-gray-500 text-sm mb-4">Kirim pertanyaan detail via email. support@bizbuddy.ai</p>
                <span className="inline-flex items-center text-blue-600 font-bold text-sm">
                  Kirim Email <ExternalLink size={14} className="ml-1" />
                </span>
              </a>

              <a href="#" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-center group">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users size={32} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Komunitas</h3>
                <p className="text-gray-500 text-sm mb-4">Bergabung dengan komunitas UMKM BizBuddy. 1,200+ member aktif.</p>
                <span className="inline-flex items-center text-orange-600 font-bold text-sm">
                  Gabung Grup <ExternalLink size={14} className="ml-1" />
                </span>
              </a>
            </div>
          </div>

          {/* FEEDBACK SECTION */}
          <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
            {!feedbackSubmitted ? (
              <div className="animate-fade-in">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Apakah halaman bantuan ini bermanfaat?</h3>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setFeedbackSubmitted(true)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm">
                    👍 Ya, Membantu
                  </button>
                  <button onClick={() => setFeedbackSubmitted(true)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                    👎 Belum Membantu
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-scale-in">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Terima kasih atas masukannya!</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">Masukan Anda membantu kami untuk terus meningkatkan kualitas Pusat Bantuan BizBuddy AI.</p>
                <textarea 
                  className="w-full max-w-md mx-auto block p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm mb-3"
                  placeholder="Ada saran atau komentar tambahan? (Opsional)"
                  rows="3"
                ></textarea>
                <button onClick={() => setFeedbackSubmitted(true)} className="bg-primary text-white font-bold px-6 py-2 rounded-xl text-sm">Kirim Feedback</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;
