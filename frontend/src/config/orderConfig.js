export const ORDER_CONFIG = {
  fnb: {
    label: "Pesanan Makanan & Minuman",
    orderTypes: [
      { 
        value: "dine_in", 
        label: "Makan di Tempat", 
        icon: "UtensilsCrossed",
        fields: ["tableNumber"]
      },
      { 
        value: "takeaway", 
        label: "Dibungkus / Takeaway", 
        icon: "ShoppingBag",
        fields: []
      },
      { 
        value: "delivery", 
        label: "Delivery / Antar", 
        icon: "Bike",
        fields: ["deliveryAddress", "customerPhone"]
      },
      {
        value: "gofood",
        label: "GoFood",
        icon: "Smartphone",
        fields: ["platformOrderId"]
      },
      {
        value: "grabfood", 
        label: "GrabFood",
        icon: "Smartphone",
        fields: ["platformOrderId"]
      }
    ],
    itemLabel: "Menu",
    customerLabel: "Nama Pelanggan",
    notesPlaceholder: "Catatan masak: pedas, tanpa bawang, dll...",
    statusLabels: {
      pending: "Pesanan Baru",
      processing: "Sedang Dimasak 👨‍🍳",
      done: "Selesai",
      cancelled: "Dibatalkan"
    },
    kanbanColumns: [
      { key: "pending", label: "Pesanan Baru", color: "orange" },
      { key: "processing", label: "Dimasak", color: "yellow" },
      { key: "done", label: "Selesai", color: "green" }
    ],
    aiParserHint: "contoh: '2 nasi goreng spesial untuk Budi meja 5, 1 es teh manis'"
  },

  fashion: {
    label: "Pesanan Fashion",
    orderTypes: [
      {
        value: "offline",
        label: "Beli Langsung (Toko)",
        icon: "Store",
        fields: []
      },
      {
        value: "whatsapp",
        label: "Order WhatsApp",
        icon: "MessageCircle",
        fields: ["customerPhone", "shippingAddress"]
      },
      {
        value: "shopee",
        label: "Shopee",
        icon: "ShoppingCart",
        fields: ["platformOrderId", "shippingAddress", "courierService"]
      },
      {
        value: "tokopedia",
        label: "Tokopedia", 
        icon: "ShoppingCart",
        fields: ["platformOrderId", "shippingAddress", "courierService"]
      },
      {
        value: "instagram",
        label: "Instagram/TikTok",
        icon: "Instagram",
        fields: ["customerPhone", "shippingAddress"]
      }
    ],
    itemLabel: "Produk",
    customerLabel: "Nama Pembeli",
    extraFields: {
      size: {
        label: "Ukuran",
        type: "select",
        options: ["XS","S","M","L","XL","XXL","XXXL"]
      },
      color: {
        label: "Warna",
        type: "text"
      },
      courierService: {
        label: "Ekspedisi",
        type: "select",
        options: ["JNE","J&T","SiCepat", "Anteraja","GoSend","GrabExpress", "Pos Indonesia"]
      },
      trackingNumber: {
        label: "Nomor Resi",
        type: "text"
      }
    },
    notesPlaceholder: "catatan ukuran, warna, atau permintaan khusus...",
    statusLabels: {
      pending: "Pesanan Masuk",
      processing: "Diproses / Packing 📦",
      shipped: "Dikirim 🚚",
      done: "Sampai / Selesai ✅",
      cancelled: "Dibatalkan",
      returned: "Retur"
    },
    kanbanColumns: [
      { key: "pending", label: "Pesanan Masuk", color: "orange" },
      { key: "processing", label: "Packing", color: "yellow" },
      { key: "shipped", label: "Dikirim", color: "blue" },
      { key: "done", label: "Selesai", color: "green" }
    ],
    aiParserHint: "contoh: 'kaos polos putih size L untuk Siti, kirim ke Surabaya via JNE'"
  },

  jasa: {
    label: "Pesanan Layanan / Jasa",
    orderTypes: [
      {
        value: "walk_in",
        label: "Datang Langsung",
        icon: "UserCheck",
        fields: []
      },
      {
        value: "appointment",
        label: "Booking / Janji",
        icon: "CalendarCheck",
        fields: ["appointmentDate", "appointmentTime", "customerPhone"]
      },
      {
        value: "home_service",
        label: "Panggilan ke Rumah",
        icon: "Home",
        fields: ["serviceAddress", "appointmentDate", "customerPhone"]
      },
      {
        value: "whatsapp",
        label: "Order WhatsApp",
        icon: "MessageCircle",
        fields: ["customerPhone"]
      }
    ],
    itemLabel: "Layanan",
    customerLabel: "Nama Pelanggan",
    extraFields: {
      appointmentDate: {
        label: "Tanggal Booking",
        type: "date"
      },
      appointmentTime: {
        label: "Jam Booking",
        type: "time"
      },
      serviceAddress: {
        label: "Alamat Servis",
        type: "textarea"
      },
      technicianName: {
        label: "Teknisi / Terapis",
        type: "text"
      }
    },
    notesPlaceholder: "keluhan atau permintaan khusus pelanggan...",
    statusLabels: {
      pending: "Booking Baru",
      confirmed: "Dikonfirmasi ✅",
      processing: "Sedang Dikerjakan 🔧",
      done: "Selesai",
      cancelled: "Dibatalkan"
    },
    kanbanColumns: [
      { key: "pending", label: "Booking Baru", color: "orange" },
      { key: "confirmed", label: "Dikonfirmasi", color: "blue" },
      { key: "processing", label: "Dikerjakan", color: "yellow" },
      { key: "done", label: "Selesai", color: "green" }
    ],
    aiParserHint: "contoh: 'creambath + blow dry untuk Dewi, besok jam 10 pagi'"
  },

  retail: {
    label: "Transaksi Retail",
    orderTypes: [
      {
        value: "cashier",
        label: "Kasir / Langsung",
        icon: "ShoppingCart",
        fields: []
      },
      {
        value: "delivery_local",
        label: "Antar Lokal",
        icon: "Bike",
        fields: ["deliveryAddress", "customerPhone"]
      },
      {
        value: "whatsapp",
        label: "Order WhatsApp",
        icon: "MessageCircle",
        fields: ["customerPhone"]
      }
    ],
    itemLabel: "Produk",
    customerLabel: "Nama Pembeli",
    extraFields: {
      paymentMethod: {
        label: "Cara Bayar",
        type: "select",
        options: ["Tunai","Transfer","QRIS", "GoPay","OVO","Dana"]
      },
      changeAmount: {
        label: "Kembalian",
        type: "calculated"
      }
    },
    notesPlaceholder: "catatan pesanan...",
    statusLabels: {
      pending: "Transaksi Baru",
      processing: "Disiapkan",
      done: "Selesai / Lunas ✅",
      cancelled: "Batal"
    },
    kanbanColumns: [
      { key: "pending", label: "Baru", color: "orange" },
      { key: "processing", label: "Disiapkan", color: "yellow" },
      { key: "done", label: "Lunas", color: "green" }
    ],
    aiParserHint: "contoh: '2 beras 5kg, 1 minyak goreng 2L untuk Bu Sari, bayar QRIS'"
  },

  home_industry: {
    label: "Pesanan Produk",
    orderTypes: [
      {
        value: "pre_order",
        label: "Pre-Order",
        icon: "ClipboardList",
        fields: ["dueDate", "customerPhone", "downPayment"]
      },
      {
        value: "ready_stock",
        label: "Stok Siap",
        icon: "Package",
        fields: []
      },
      {
        value: "custom_order",
        label: "Custom / Pesanan Khusus",
        icon: "Sparkles",
        fields: ["customDetails", "dueDate", "customerPhone", "downPayment"]
      },
      {
        value: "shipping",
        label: "Kirim via Ekspedisi",
        icon: "Truck",
        fields: ["shippingAddress", "courierService"]
      }
    ],
    itemLabel: "Produk",
    customerLabel: "Nama Pemesan",
    extraFields: {
      dueDate: {
        label: "Tanggal Selesai / Ambil",
        type: "date"
      },
      downPayment: {
        label: "DP / Uang Muka",
        type: "number",
        prefix: "Rp"
      },
      remainingPayment: {
        label: "Sisa Pembayaran",
        type: "calculated"
      },
      customDetails: {
        label: "Detail Pesanan Custom",
        type: "textarea",
        placeholder: "ukuran, rasa, warna, tulisan, dll..."
      }
    },
    notesPlaceholder: "detail custom, deadline, atau pesan khusus...",
    statusLabels: {
      pending: "Pesanan Masuk",
      dp_paid: "DP Diterima 💰",
      processing: "Sedang Dibuat 🎂",
      ready: "Siap Diambil/Kirim ✅",
      done: "Selesai / Lunas",
      cancelled: "Dibatalkan"
    },
    kanbanColumns: [
      { key: "pending", label: "Pesanan Masuk", color: "orange" },
      { key: "dp_paid", label: "DP Diterima", color: "gold" },
      { key: "processing", label: "Dibuat", color: "yellow" },
      { key: "ready", label: "Siap", color: "blue" },
      { key: "done", label: "Selesai", color: "green" }
    ],
    aiParserHint: "contoh: 'brownies custom tulisan Happy Birthday ukuran 22cm untuk Rina, selesai Jumat'"
  },

  other: {
    label: "Pesanan",
    orderTypes: [
      { value: "direct", label: "Langsung", icon: "ShoppingBag", fields: [] },
      { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle", fields: ["customerPhone"] },
      { value: "online", label: "Online/Lainnya", icon: "Globe", fields: ["platformOrderId"] }
    ],
    itemLabel: "Item",
    customerLabel: "Nama Pelanggan",
    notesPlaceholder: "catatan pesanan...",
    statusLabels: {
      pending: "Baru",
      processing: "Diproses",
      done: "Selesai",
      cancelled: "Dibatalkan"
    },
    kanbanColumns: [
      { key: "pending", label: "Baru", color: "orange" },
      { key: "processing", label: "Diproses", color: "yellow" },
      { key: "done", label: "Selesai", color: "green" }
    ],
    aiParserHint: "contoh: 'pesanan [nama item] untuk [nama pelanggan]'"
  }
};
