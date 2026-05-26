import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Package, AlertTriangle, Plus, Edit2, Trash2, MoreVertical, TrendingUp, Lightbulb, Check, X, PackagePlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const Inventory = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const itemsPerPage = 6;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Forms state
  const [productForm, setProductForm] = useState({
    name: '', category: 'Makanan', sellPrice: '', buyPrice: '', stock: '', minStock: 5, unit: 'pcs', imageUrl: ''
  });
  const [restockForm, setRestockForm] = useState({ quantity: '', notes: '' });

  // Dropdown state for card menus
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, moveRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/products/movements?days=7')
      ]);
      setProducts(prodRes.data);
      setMovements(moveRes.data);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Gagal memuat data inventori');
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: 'Habis Total', color: 'bg-red-500', barColor: 'bg-red-500' };
    if (stock <= minStock) return { label: 'Stok Kritis', color: 'bg-red-500', barColor: 'bg-red-500' };
    if (stock <= minStock * 2) return { label: 'Hampir Habis', color: 'bg-orange-500', barColor: 'bg-orange-500' };
    return { label: 'Aman', color: 'bg-green-500', barColor: 'bg-green-500' };
  };

  const criticalCount = products.filter(p => p.stock <= p.minStock).length;

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        sellPrice: product.sellPrice,
        buyPrice: product.buyPrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', category: 'Makanan', sellPrice: '', buyPrice: '', stock: '', minStock: 5, unit: 'pcs', imageUrl: ''
      });
    }
    setIsProductModalOpen(true);
    setOpenMenuId(null);
  };

  const handleOpenRestockModal = (product) => {
    setEditingProduct(product);
    setRestockForm({ quantity: '', notes: 'Restock harian' });
    setIsRestockModalOpen(true);
    setOpenMenuId(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        sellPrice: Number(productForm.sellPrice),
        buyPrice: Number(productForm.buyPrice),
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock)
      };

      if (editingProduct) {
        await axios.put(`/products/${editingProduct._id}`, payload);
        toast.success('Produk berhasil diupdate');
      } else {
        await axios.post('/products', payload);
        toast.success('Produk berhasil ditambahkan');
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan produk');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/products/${editingProduct._id}/restock`, {
        quantity: Number(restockForm.quantity),
        notes: restockForm.notes
      });
      toast.success('Stok berhasil ditambah');
      setIsRestockModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menambah stok');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await axios.delete(`/products/${id}`);
      toast.success('Produk dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus produk');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const { data } = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // API returns something like "/uploads/img-123.jpg"
      // Since axios base URL is /api, the upload route is /api/upload.
      // Wait, we need to ensure the image URL works. We'll set the path.
      // If backend is on port 5000 and we proxy it, /uploads might not be proxied correctly by Vite unless configured. 
      // Assuming it's configured or using absolute URL if needed, but local path is usually fine if proxy is setup.
      // Let's just use the returned path.
      setProductForm(prev => ({ ...prev, imageUrl: data }));
      toast.success('Gambar berhasil diunggah');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = ['Semua', ...new Set(products.map(p => p.category))];

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
              <Package size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Radar</h1>
              <p className="text-gray-500 text-sm">Pantau pergerakan stok harian Anda secara real-time.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm w-full md:w-64"
            />
            <button 
              onClick={() => handleOpenProductModal()}
              className="flex items-center bg-primary hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-primary/20 justify-center shrink-0"
            >
              <Plus size={18} className="mr-2" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {criticalCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm shadow-red-100">
            <div className="flex items-center text-red-600">
              <AlertTriangle size={24} className="mr-3 shrink-0" />
              <p className="font-bold text-sm md:text-base">
                {criticalCount} produk hampir habis! Segera restock untuk menghindari kehilangan penjualan.
              </p>
            </div>
            <button 
              onClick={() => document.getElementById('ai-advisor')?.scrollIntoView({behavior: 'smooth'})}
              className="bg-white text-red-600 hover:bg-red-50 font-bold py-2 px-4 rounded-lg text-sm border border-red-200 transition-colors whitespace-nowrap"
            >
              Lihat Detail
            </button>
          </div>
        )}



        {/* Stock Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-lg font-bold text-gray-900">Daftar Produk</h2>
          <div className="flex overflow-x-auto hide-scrollbar gap-2 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedProducts.map(product => {
                const status = getStockStatus(product.stock, product.minStock);
              const progressWidth = Math.min(100, (product.stock / (product.minStock * 4)) * 100);
              
              return (
                <div key={product._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative">
                  {/* Badge */}
                  {status.label !== 'Aman' && (
                    <div className={`absolute top-4 left-4 ${status.color} text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md z-10 shadow-sm`}>
                      {status.label}
                    </div>
                  )}
                  
                  {/* Menu */}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === product._id ? null : product._id)}
                      className="text-gray-400 hover:bg-gray-100 p-1 rounded-md transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === product._id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 overflow-hidden">
                        <button onClick={() => handleOpenRestockModal(product)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                          <PackagePlus size={16} className="mr-2 text-green-500" /> Tambah Stok
                        </button>
                        <button onClick={() => handleOpenProductModal(product)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                          <Edit2 size={16} className="mr-2 text-blue-500" /> Edit Produk
                        </button>
                        <button onClick={() => handleDeleteProduct(product._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-50 mt-1 pt-2">
                          <Trash2 size={16} className="mr-2" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mb-4 mt-2">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                      <p className="text-sm font-semibold text-gray-700">Rp {product.sellPrice?.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-gray-500">Sisa Stok</span>
                      <span className="font-black text-gray-900">{product.stock} <span className="text-xs font-medium text-gray-500">{product.unit}</span></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${status.barColor}`} style={{ width: `${progressWidth}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-sm font-semibold text-gray-600 mx-2">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}

        {/* Stock Movement Chart */}
        {!isLoading && movements.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Stock Movement (7 Hari Terakhir)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movements} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Barang Masuk" dataKey="in" stroke="#FF6B35" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Barang Keluar" dataKey="out" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-10">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleProductSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk *</label>
                    <input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="Contoh: Nasi Goreng Spesial" />
                  </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                    <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm">
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Satuan Unit</label>
                    <input value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="pcs/porsi/cup" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Jual (Rp) *</label>
                    <input required type="number" value={productForm.sellPrice} onChange={e => setProductForm({...productForm, sellPrice: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Modal (Rp)</label>
                    <input type="number" value={productForm.buyPrice} onChange={e => setProductForm({...productForm, buyPrice: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok Saat Ini</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok Minimum Alert</label>
                    <input type="number" value={productForm.minStock} onChange={e => setProductForm({...productForm, minStock: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic mt-1">AI akan memberi peringatan jika stok di bawah angka minimum alert.</p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gambar Produk (Upload / URL)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="w-full sm:w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" 
                    />
                    <input 
                      value={productForm.imageUrl} 
                      onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} 
                      className="w-full sm:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                      placeholder="Atau paste URL gambar..." 
                    />
                  </div>
                  {isUploading && <p className="text-xs text-orange-500 mt-1">Sedang mengunggah...</p>}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 shadow-md shadow-primary/20 transition-colors">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {isRestockModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-10">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Quick Restock</h2>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 mb-4">
                  <p className="text-xs text-orange-600 font-bold uppercase mb-1">Produk</p>
                  <p className="font-bold text-gray-900">{editingProduct.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Stok saat ini: <span className="font-bold text-gray-900">{editingProduct.stock} {editingProduct.unit}</span></p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tambah Stok Berapa?</label>
                  <input required type="number" min="1" value={restockForm.quantity} onChange={e => setRestockForm({...restockForm, quantity: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder={`Contoh: 10`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keterangan / Supplier</label>
                  <input value={restockForm.notes} onChange={e => setRestockForm({...restockForm, notes: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="Pembelian pasar pagi" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button type="button" onClick={() => setIsRestockModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-md shadow-green-500/20 transition-colors flex items-center"><Check size={16} className="mr-2"/> Tambah</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

    </DashboardLayout>
  );
};

export default Inventory;
