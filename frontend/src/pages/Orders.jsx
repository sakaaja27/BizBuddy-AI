import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Package, Plus, Sparkles, ArrowRight, Search, List, Grid, GripVertical, Loader2, X, Check, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiParsedResult, setAiParsedResult] = useState(null);
  
  // Manual Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    orderType: 'meja',
    tableNumber: '',
    address: '',
    items: [],
    notes: ''
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  
  const [filter, setFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [filter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const filterParam = filter === 'Hari Ini' ? 'today' : filter === 'Minggu Ini' ? 'week' : 'all';
      const { data } = await axios.get(`/orders?filter=${filterParam}`);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsAiProcessing(true);
    try {
      const { data } = await axios.post('/orders/ai-parse', { text: aiInput });
      setAiParsedResult(data);
    } catch (error) {
      console.error('AI Parse error:', error);
      toast.error('Gagal memproses pesanan dengan AI. Silakan coba lagi.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiConfirm = async () => {
    try {
      const { data } = await axios.post('/orders', aiParsedResult);
      setOrders([data, ...orders]);
      setAiParsedResult(null);
      setAiInput('');
      toast.success('Pesanan berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal menyimpan pesanan.');
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || selectedQty < 1) return;
    const product = products.find(p => p._id === selectedProductId);
    if (!product) return;

    const newItem = {
      productId: product._id,
      productName: product.name,
      qty: parseInt(selectedQty, 10),
      price: product.price,
      subtotal: product.price * selectedQty
    };

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem]
    });
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...newOrder.items];
    newItems.splice(index, 1);
    setNewOrder({ ...newOrder, items: newItems });
  };

  const openAddModal = () => {
    setEditingOrderId(null);
    setNewOrder({
      customerName: '',
      orderType: 'meja',
      tableNumber: '',
      address: '',
      items: [],
      notes: ''
    });
    setSelectedProductId('');
    setSelectedQty(1);
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrderId(order._id);
    setNewOrder({
      customerName: order.customerName,
      orderType: order.orderType || 'meja',
      tableNumber: order.tableNumber || '',
      address: order.address || '',
      items: order.items,
      notes: order.notes || ''
    });
    setSelectedProductId('');
    setSelectedQty(1);
    setIsModalOpen(true);
  };

  const promptDeleteOrder = (id) => {
    setDeleteOrderId(id);
  };

  const executeDeleteOrder = async () => {
    if (!deleteOrderId) return;
    try {
      await axios.delete(`/orders/${deleteOrderId}`);
      setOrders(orders.filter(o => o._id !== deleteOrderId));
      toast.success('Pesanan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Gagal menghapus pesanan');
    } finally {
      setDeleteOrderId(null);
    }
  };

  const handleManualSubmit = async () => {
    if (!newOrder.customerName) {
      toast.error('Nama pelanggan wajib diisi');
      return;
    }
    if (newOrder.items.length === 0) {
      toast.error('Tambahkan minimal 1 item pesanan');
      return;
    }
    if (newOrder.orderType === 'meja' && !newOrder.tableNumber) {
      toast.error('Nomor meja wajib diisi untuk pesanan Meja');
      return;
    }
    if (newOrder.orderType === 'delivery' && !newOrder.address) {
      toast.error('Alamat wajib diisi untuk pesanan Delivery');
      return;
    }

    try {
      if (editingOrderId) {
        const { data } = await axios.put(`/orders/${editingOrderId}`, newOrder);
        setOrders(orders.map(o => (o._id === editingOrderId ? data : o)));
        toast.success('Pesanan berhasil diperbarui!');
      } else {
        const { data } = await axios.post('/orders', newOrder);
        setOrders([data, ...orders]);
        toast.success('Pesanan berhasil ditambahkan!');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Gagal menyimpan pesanan.');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const newStatus = destination.droppableId;
    
    // Optimistic update
    const newOrders = Array.from(orders);
    const orderIndex = newOrders.findIndex(o => o._id === draggableId);
    const oldStatus = newOrders[orderIndex].status;
    newOrders[orderIndex].status = newStatus;
    setOrders(newOrders);

    try {
      await axios.patch(`/orders/${draggableId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert if error
      const revertOrders = Array.from(orders);
      revertOrders[orderIndex].status = oldStatus;
      setOrders(revertOrders);
      toast.error('Gagal mengupdate status pesanan.');
    }
  };

  const filteredOrders = orders.filter(o => o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const processingOrders = filteredOrders.filter(o => o.status === 'processing');
  const doneOrders = filteredOrders.filter(o => o.status === 'done');

  const manualOrderTotal = newOrder.items.reduce((sum, item) => sum + item.subtotal, 0);

  const renderKanbanColumn = (title, id, items, headerBg, dotColor) => (
    <div className="flex-1 min-w-[280px] flex flex-col h-full">
      <div className={`flex items-center justify-between p-3 rounded-t-xl ${headerBg} border-b border-gray-100`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dotColor === 'bg-orange-500' ? 'bg-orange-500 text-white' : dotColor === 'bg-yellow-500' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
          {items.length}
        </span>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 rounded-b-xl border border-t-0 border-gray-100 min-h-[500px] transition-colors
              ${snapshot.isDraggingOver ? 'bg-orange-50/50 border-orange-200 border-dashed' : id === 'pending' ? 'bg-gray-50/50' : id === 'processing' ? 'bg-yellow-50/30' : 'bg-green-50/30'}`}
          >
            {items.map((order, index) => (
              <Draggable key={order._id} draggableId={order._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 group relative
                      ${snapshot.isDragging ? 'rotate-3 shadow-xl opacity-90 scale-[1.02] cursor-grabbing border-primary' : 'hover:shadow-md hover:scale-[1.01] transition-all cursor-grab'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-xs font-bold">{order.orderNumber}</span>
                        <span className="text-gray-400 text-[10px] font-medium">{new Date(order.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {id === 'pending' && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white rounded-lg shadow-sm border border-gray-100 p-0.5">
                            <button 
                              onClick={() => openEditModal(order)}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded-md transition-colors"
                              title="Edit Pesanan"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => promptDeleteOrder(order._id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                              title="Hapus Pesanan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <GripVertical size={16} className={`text-gray-300 group-hover:text-gray-400 transition-colors ${id === 'pending' && 'ml-1'}`} />
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-sm mb-2">
                      {order.customerName} <span className="text-gray-500 font-normal">({order.orderType === 'meja' ? `Meja ${order.tableNumber}` : order.orderType})</span>
                    </h4>
                    
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{item.qty}x {item.productName}</span>
                          <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${id === 'pending' ? 'bg-orange-100 text-orange-700' : id === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {id === 'pending' ? 'Baru' : id === 'processing' ? 'Dimasak' : 'Diambil'}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">Rp {order.totalAmount?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
              <p className="text-gray-500 text-sm">Manajemen pesanan pelanggan secara real-time</p>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="w-full md:w-auto bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 flex items-center justify-center transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Tambah Pesanan
          </button>
        </div>

        {/* AI Input Bar (Hero) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-3 mb-8 relative group">
          <form onSubmit={handleAiSubmit} className="flex items-center gap-3">
            <div className="flex-shrink-0 pl-2">
              <Sparkles size={24} className="text-primary animate-pulse" />
            </div>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ketik pesanan dengan bebas... contoh: '2 nasi goreng untuk Budi meja 3'"
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 text-sm md:text-base placeholder-gray-400 py-2"
              disabled={isAiProcessing || aiParsedResult}
            />
            <button
              type="submit"
              disabled={!aiInput || isAiProcessing || aiParsedResult}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all
                ${aiInput && !isAiProcessing && !aiParsedResult ? 'bg-primary hover:bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
            >
              {isAiProcessing ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
            </button>
          </form>
          
          <div className="absolute -bottom-6 left-4 text-xs text-gray-400 font-medium flex items-center">
            <Sparkles size={12} className="mr-1 opacity-70" /> AI akan otomatis memproses dan menambahkan pesanan kamu
          </div>

          <div className="absolute inset-0 rounded-2xl border-1.5 border-transparent pointer-events-none transition-colors group-focus-within:border-primary group-focus-within:shadow-[0_0_15px_rgba(249,115,22,0.15)]"></div>
        </div>

        {/* AI Parse Result Preview */}
        {aiParsedResult && (
          <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-5 mb-8 animate-fade-in shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <span className="text-xl mr-2">🤖</span> AI memahami pesanan ini:
              </h3>
              <button onClick={() => setAiParsedResult(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-5">
              <div><span className="text-gray-500">Pelanggan:</span> <span className="font-bold text-gray-900">{aiParsedResult.customerName}</span></div>
              <div><span className="text-gray-500">Tipe / Info:</span> <span className="font-bold text-gray-900">{aiParsedResult.orderType} {aiParsedResult.tableNumber ? `(Meja ${aiParsedResult.tableNumber})` : ''} {aiParsedResult.address ? `(${aiParsedResult.address})` : ''}</span></div>
            </div>
            
            <div className="bg-white rounded-xl border border-orange-100 p-4 mb-5">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Detail Item</h4>
              <div className="space-y-2">
                {aiParsedResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.qty}x {item.productName}</span>
                    <span className="text-gray-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                {aiParsedResult.notes && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">Catatan: {aiParsedResult.notes}</div>
                )}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-primary">Rp {aiParsedResult.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setAiParsedResult(null)} className="px-5 py-2 text-gray-500 hover:bg-gray-100 font-semibold rounded-xl transition-colors text-sm">Batal</button>
              <button onClick={() => {
                // Pre-fill the edit modal with AI result
                setEditingOrderId(null);
                setNewOrder({
                  customerName: aiParsedResult.customerName,
                  orderType: aiParsedResult.orderType,
                  tableNumber: aiParsedResult.tableNumber || '',
                  address: aiParsedResult.address || '',
                  items: aiParsedResult.items,
                  notes: aiParsedResult.notes || ''
                });
                setAiParsedResult(null);
                setIsModalOpen(true);
              }} className="px-5 py-2 border border-primary text-primary hover:bg-orange-50 font-bold rounded-xl transition-colors text-sm">Edit Manual</button>
              <button onClick={handleAiConfirm} className="px-5 py-2 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-colors text-sm flex items-center">
                <Check size={16} className="mr-2" /> Konfirmasi Tambah
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex bg-gray-100/80 p-1 rounded-xl w-full md:w-auto">
            {['Semua', 'Hari Ini', 'Minggu Ini'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1">
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-orange-50 text-primary' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}><Grid size={18} /></button>
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-50 text-primary' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}><List size={18} /></button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada pesanan hari ini</h3>
            <p className="text-gray-500 max-w-md mx-auto">Gunakan input AI di atas atau tombol "+ Tambah Pesanan" untuk mulai menambahkan transaksi.</p>
          </div>
        )}

        {/* Content Area */}
        {orders.length > 0 && viewMode === 'kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 hide-scrollbar">
              {renderKanbanColumn('Pending', 'pending', pendingOrders, 'bg-gray-50', 'bg-orange-500')}
              {renderKanbanColumn('Diproses', 'processing', processingOrders, 'bg-yellow-50/50', 'bg-yellow-500')}
              {renderKanbanColumn('Selesai', 'done', doneOrders, 'bg-green-50/50', 'bg-green-500')}
            </div>
          </DragDropContext>
        )}

        {orders.length > 0 && viewMode === 'table' && (
          <RecentOrdersTable orders={filteredOrders} />
        )}

        {/* Manual Add/Edit Order Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingOrderId ? 'Edit Pesanan' : 'Tambah Pesanan Manual'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pelanggan</label>
                    <input 
                      type="text" 
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm" 
                      placeholder="Contoh: Budi" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe Pesanan</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNewOrder({...newOrder, orderType: 'meja', address: ''})}
                        className={`flex-1 py-2 font-semibold rounded-xl text-sm border transition-colors ${newOrder.orderType === 'meja' ? 'bg-primary/10 text-primary border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        Meja
                      </button>
                      <button 
                        onClick={() => setNewOrder({...newOrder, orderType: 'bungkus', tableNumber: '', address: ''})}
                        className={`flex-1 py-2 font-semibold rounded-xl text-sm border transition-colors ${newOrder.orderType === 'bungkus' ? 'bg-primary/10 text-primary border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        Bungkus
                      </button>
                      <button 
                        onClick={() => setNewOrder({...newOrder, orderType: 'delivery', tableNumber: ''})}
                        className={`flex-1 py-2 font-semibold rounded-xl text-sm border transition-colors ${newOrder.orderType === 'delivery' ? 'bg-primary/10 text-primary border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        Delivery
                      </button>
                    </div>
                  </div>
                </div>

                {newOrder.orderType === 'meja' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Meja</label>
                    <input 
                      type="text" 
                      value={newOrder.tableNumber}
                      onChange={(e) => setNewOrder({...newOrder, tableNumber: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm" 
                      placeholder="Contoh: 4" 
                    />
                  </div>
                )}

                {newOrder.orderType === 'delivery' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Pengiriman</label>
                    <textarea 
                      value={newOrder.address}
                      onChange={(e) => setNewOrder({...newOrder, address: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm" 
                      placeholder="Masukkan alamat lengkap..." 
                      rows="2"
                    ></textarea>
                  </div>
                )}

                <div className="mb-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Item</label>
                  <div className="flex gap-2 mb-3">
                    <select 
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} - Rp {p.price.toLocaleString('id-ID')}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-center" 
                    />
                    <button 
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      Tambah
                    </button>
                  </div>

                  {/* Added Items List */}
                  {newOrder.items.length > 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-2">
                      {newOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md">{item.qty}x</span>
                            <span className="font-medium text-gray-700">{item.productName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 px-2 mt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-700">Total Harga:</span>
                        <span className="font-bold text-primary text-lg">Rp {manualOrderTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500 mb-4">
                      Belum ada item pesanan
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                    <input 
                      type="text" 
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm" 
                      placeholder="Contoh: ekstra pedas, jangan pakai daun bawang" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
                <button onClick={handleManualSubmit} className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-primary/20 flex items-center">
                  <Check size={18} className="mr-2" /> Simpan Pesanan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Hapus Pesanan?</h3>
                <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteOrderId(null)} 
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={executeDeleteOrder} 
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/20 transition-colors"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
