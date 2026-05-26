import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  Package,
  Plus,
  Sparkles,
  ArrowRight,
  Search,
  List,
  Grid,
  GripVertical,
  Loader2,
  X,
  Check,
  Trash2,
  Edit2,
  AlertTriangle,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Smartphone,
  Store,
  MessageCircle,
  ShoppingCart,
  UserCheck,
  CalendarCheck,
  Home,
  ClipboardList,
  Sparkles as SparklesIcon,
  Truck,
  Globe,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import useAuthStore from "../store/useAuthStore";
import { ORDER_CONFIG } from "../config/orderConfig";

const iconMap = {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Smartphone,
  Store,
  MessageCircle,
  ShoppingCart,
  Instagram: ShoppingCart,
  UserCheck,
  CalendarCheck,
  Home,
  ClipboardList,
  Sparkles: SparklesIcon,
  Truck,
  Globe,
};

const Orders = () => {
  const { user } = useAuthStore();
  const businessType = user?.businessType || "other";
  const config = ORDER_CONFIG[businessType] || ORDER_CONFIG["other"];

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' or 'table'

  // AI State
  const [aiInput, setAiInput] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiParsedResult, setAiParsedResult] = useState(null);

  // Manual Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const initialOrderState = {
    customerName: "",
    orderType: config.orderTypes[0].value,
    tableNumber: "",
    address: "",
    items: [],
    notes: "",
    deliveryAddress: "",
    shippingAddress: "",
    courierService: "",
    trackingNumber: "",
    platformOrderId: "",
    appointmentDate: "",
    appointmentTime: "",
    technicianName: "",
    customDetails: "",
    dueDate: "",
    downPayment: 0,
    paymentMethod: "",
    size: "",
    color: "",
    customerPhone: "",
  };

  const [newOrder, setNewOrder] = useState(initialOrderState);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [stockErrorModal, setStockErrorModal] = useState({
    isOpen: false,
    errorData: null,
    orderId: null,
    newStatus: null,
    orderIndex: null,
    oldStatus: null,
  });
  const [confirmDoneModal, setConfirmDoneModal] = useState({
    isOpen: false,
    orderId: null,
  });

  const [filter, setFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [filter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const filterParam =
        filter === "Hari Ini"
          ? "today"
          : filter === "Minggu Ini"
            ? "week"
            : "all";
      const { data } = await axios.get(`/orders?filter=${filterParam}`);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/products");
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsAiProcessing(true);
    try {
      const { data } = await axios.post("/orders/ai-parse", { text: aiInput });
      setAiParsedResult(data);
    } catch (error) {
      console.error("AI Parse error:", error);
      toast.error("Gagal memproses pesanan dengan AI. Silakan coba lagi.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiConfirm = async () => {
    try {
      const { data } = await axios.post("/orders", aiParsedResult);
      setOrders([data, ...orders]);
      setAiParsedResult(null);
      setAiInput("");
      toast.success("Pesanan berhasil ditambahkan!");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Gagal menyimpan pesanan.");
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || selectedQty < 1) return;
    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;

    const newItem = {
      productId: product._id,
      productName: product.name,
      qty: parseInt(selectedQty, 10),
      price: product.sellPrice,
      subtotal: product.sellPrice * selectedQty,
    };

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem],
    });
    setSelectedProductId("");
    setSelectedQty(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...newOrder.items];
    newItems.splice(index, 1);
    setNewOrder({ ...newOrder, items: newItems });
  };

  const openAddModal = () => {
    setEditingOrderId(null);
    setNewOrder(initialOrderState);
    setSelectedProductId("");
    setSelectedQty(1);
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrderId(order._id);
    setNewOrder({
      ...initialOrderState,
      ...order,
      orderType: order.orderType || config.orderTypes[0].value,
    });
    setSelectedProductId("");
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
      setOrders(orders.filter((o) => o._id !== deleteOrderId));
      toast.success("Pesanan berhasil dihapus");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Gagal menghapus pesanan");
    } finally {
      setDeleteOrderId(null);
    }
  };

  const handleManualSubmit = async () => {
    if (!newOrder.customerName) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    if (newOrder.items.length === 0) {
      toast.error("Tambahkan minimal 1 item pesanan");
      return;
    }
    if (newOrder.orderType === "meja" && !newOrder.tableNumber) {
      toast.error("Nomor meja wajib diisi untuk pesanan Meja");
      return;
    }
    if (newOrder.orderType === "delivery" && !newOrder.address) {
      toast.error("Alamat wajib diisi untuk pesanan Delivery");
      return;
    }

    try {
      if (editingOrderId) {
        const { data } = await axios.put(`/orders/${editingOrderId}`, newOrder);
        setOrders(orders.map((o) => (o._id === editingOrderId ? data : o)));
        toast.success("Pesanan berhasil diperbarui!");
      } else {
        const { data } = await axios.post("/orders", newOrder);
        setOrders([data, ...orders]);
        toast.success("Pesanan berhasil ditambahkan!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Gagal menyimpan pesanan.");
    }
  };

  const processStatusChange = async (orderId, newStatus) => {
    const newOrders = Array.from(orders);
    const orderIndex = newOrders.findIndex((o) => o._id === orderId);
    const oldStatus = newOrders[orderIndex].status;
    newOrders[orderIndex].status = newStatus;
    setOrders(newOrders);

    try {
      const { data } = await axios.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (data.stockAlerts && data.stockAlerts.length > 0) {
        toast.error(`⚠️ Stok ${data.stockAlerts.join(", ")} sekarang kritis!`, {
          duration: 5000,
          icon: "⚠️",
        });
      }
    } catch (error) {
      // Revert if error
      const revertOrders = Array.from(orders);
      revertOrders[orderIndex].status = oldStatus;
      setOrders(revertOrders);

      if (error.response?.data?.error === "INSUFFICIENT_STOCK") {
        setStockErrorModal({
          isOpen: true,
          errorData: error.response.data,
          orderId,
          newStatus,
          orderIndex,
          oldStatus,
        });
      } else {
        console.error("Error updating status:", error);
        toast.error("Gagal mengupdate status pesanan.");
      }
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Cegah order yang sudah selesai dipindah lagi
    if (source.droppableId === "done") {
      toast.error("Pesanan yang sudah selesai tidak dapat diubah statusnya!");
      return;
    }

    const newStatus = destination.droppableId;

    // Minta konfirmasi jika dipindah ke selesai
    if (newStatus === "done") {
      setConfirmDoneModal({ isOpen: true, orderId: draggableId });
      return;
    }

    await processStatusChange(draggableId, newStatus);
  };

  const executeConfirmDone = async () => {
    if (confirmDoneModal.orderId) {
      await processStatusChange(confirmDoneModal.orderId, "done");
    }
    setConfirmDoneModal({ isOpen: false, orderId: null });
  };

  const forceUpdateStatus = async () => {
    const { orderId, newStatus, orderIndex, oldStatus } = stockErrorModal;
    setStockErrorModal({ ...stockErrorModal, isOpen: false });

    const newOrders = Array.from(orders);
    newOrders[orderIndex].status = newStatus;
    setOrders(newOrders);

    try {
      const { data } = await axios.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        force: true,
      });
      if (data.stockAlerts && data.stockAlerts.length > 0) {
        toast.error(`⚠️ Stok ${data.stockAlerts.join(", ")} sekarang kritis!`);
      }
      toast.success("Status dipaksa update meskipun stok kurang");
    } catch (error) {
      const revertOrders = Array.from(orders);
      revertOrders[orderIndex].status = oldStatus;
      setOrders(revertOrders);
      toast.error("Tetap gagal mengupdate status pesanan.");
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderKanbanColumn = (column, items) => {
    const { key, label, color } = column;

    // Convert text colors dynamically using predefined Tailwind colors
    const colorMap = {
      orange: { bg: "bg-orange-100", header: "bg-orange-500" },
      yellow: { bg: "bg-yellow-100", header: "bg-yellow-500" },
      blue: { bg: "bg-blue-100", header: "bg-blue-500" },
      green: { bg: "bg-green-100", header: "bg-green-500" },
      gold: { bg: "bg-amber-100", header: "bg-amber-500" },
    };
    const c = colorMap[color] || colorMap.orange;

    return (
      <div key={key} className="flex-1 min-w-[280px] flex flex-col h-full">
        <div
          className={`flex items-center justify-between p-3 rounded-t-xl ${c.header} text-white`}
        >
          <h3 className="font-bold">{label}</h3>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {items.length}
          </span>
        </div>

        <Droppable droppableId={key}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-3 rounded-b-xl border border-t-0 border-gray-100 min-h-[500px] transition-colors
              ${snapshot.isDraggingOver ? "bg-gray-100 border-gray-200 border-dashed" : c.bg}`}
            >
              {items.map((order, index) => (
                <Draggable
                  key={order._id}
                  draggableId={order._id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 group relative
                      ${snapshot.isDragging ? "rotate-3 shadow-xl opacity-90 scale-[1.02] cursor-grabbing border-primary" : "hover:shadow-md hover:scale-[1.01] transition-all cursor-grab"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-primary text-xs font-bold">
                            {order.orderNumber}
                          </span>
                          <span className="text-gray-400 text-[10px] font-medium">
                            {new Date(order.createdAt).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {key === config.kanbanColumns[0].key && (
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
                          <GripVertical
                            size={16}
                            className={`text-gray-300 group-hover:text-gray-400 transition-colors ${key === config.kanbanColumns[0].key && "ml-1"}`}
                          />
                        </div>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm mb-2">
                        {order.customerName}{" "}
                        <span className="text-gray-500 font-normal">
                          ({order.orderType})
                        </span>
                      </h4>

                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs text-gray-600"
                          >
                            <span>
                              {item.qty}x {item.productName}
                            </span>
                            <span>
                              Rp {item.subtotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.header} text-white`}
                        >
                          {label}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                          Rp {order.totalAmount?.toLocaleString("id-ID")}
                        </span>
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
  };

  const manualOrderTotal = newOrder.items.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0,
  );

  const renderModal = (content) =>
    typeof document !== "undefined"
      ? createPortal(content, document.body)
      : content;

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
              <h1 className="text-2xl font-bold text-gray-900">
                Kelola Pesanan
              </h1>
              <p className="text-gray-500 text-sm">
                Manajemen pesanan pelanggan secara real-time
              </p>
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
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-3 relative group">
            <form
              onSubmit={handleAiSubmit}
              className="flex items-center gap-2 md:gap-3"
            >
              <div className="flex-shrink-0 pl-1 md:pl-2">
                <Sparkles
                  size={20}
                  className="text-primary animate-pulse md:w-6 md:h-6"
                />
              </div>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={config.aiParserHint || "Ketik pesanan..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 text-sm md:text-base placeholder-gray-400 py-2 w-full min-w-0"
                disabled={isAiProcessing || aiParsedResult}
              />
              <button
                type="submit"
                disabled={!aiInput || isAiProcessing || aiParsedResult}
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all shrink-0
                  ${aiInput && !isAiProcessing && !aiParsedResult ? "bg-primary hover:bg-orange-600 text-white shadow-md" : "bg-gray-100 text-gray-400"}`}
              >
                {isAiProcessing ? (
                  <Loader2 size={18} className="animate-spin md:w-5 md:h-5" />
                ) : (
                  <ArrowRight size={18} className="md:w-5 md:h-5" />
                )}
              </button>
            </form>

            <div className="absolute inset-0 rounded-2xl border-1.5 border-transparent pointer-events-none transition-colors group-focus-within:border-primary group-focus-within:shadow-[0_0_15px_rgba(249,115,22,0.15)]"></div>
          </div>

          <div className="mt-2 ml-2 md:ml-4 text-[10px] md:text-xs text-gray-400 font-medium flex items-center">
            <Sparkles size={12} className="mr-1 opacity-70 shrink-0" />
            <span>AI otomatis mencatat pesanan dari teks Anda</span>
          </div>
        </div>

        {/* AI Parse Result Preview */}
        {aiParsedResult &&
          (!aiParsedResult.notFound ||
            aiParsedResult.notFound.length === 0) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 shadow-sm animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Check size={18} className="text-green-500 mr-2" />
                  Preview Pesanan dari AI{" "}
                  <span className="text-red-500 ml-2">
                    (Cek Lagi Apakah Sudah Benar!)
                  </span>
                </h3>
                <button
                  onClick={() => setAiParsedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* AI Warnings */}
              {aiParsedResult.confidence < 0.7 && (
                <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-xl mb-4 border border-yellow-200 flex items-center">
                  <AlertTriangle size={16} className="mr-2 shrink-0" />
                  AI kurang yakin dengan pesanan ini. Mohon periksa kembali.
                </div>
              )}

              {aiParsedResult.insufficientStock &&
                aiParsedResult.insufficientStock.length > 0 && (
                  <div className="bg-orange-50 text-orange-800 text-sm p-3 rounded-xl mb-4 border border-orange-200">
                    <div className="flex items-center font-bold mb-1">
                      <AlertTriangle size={16} className="mr-2" /> Stok tidak
                      cukup:
                    </div>
                    <ul className="list-disc pl-8">
                      {aiParsedResult.insufficientStock.map((item, i) => (
                        <li key={i}>
                          {item.name}: diminta {item.requested}, tersedia{" "}
                          {item.available}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Pelanggan</p>
                  <p className="font-bold">{aiParsedResult.customerName}</p>
                  <p className="text-sm text-gray-600 mt-2 capitalize">
                    {aiParsedResult.orderType}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    Item Pesanan ({aiParsedResult.items?.length})
                  </p>
                  {aiParsedResult.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {item.qty}x {item.productName}
                      </span>
                      <span className="text-gray-600">
                        Rp {item.subtotal?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                  {aiParsedResult.notes && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                      Catatan: {aiParsedResult.notes}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary">
                      Rp {aiParsedResult.totalAmount?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setAiParsedResult(null)}
                  className="px-5 py-2 text-gray-500 hover:bg-gray-100 font-semibold rounded-xl transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    // Pre-fill the edit modal with AI result
                    setEditingOrderId(null);
                    setNewOrder({
                      ...initialOrderState,
                      ...aiParsedResult,
                      orderType:
                        aiParsedResult.orderType || config.orderTypes[0].value,
                    });
                    setAiParsedResult(null);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-2 border border-primary text-primary hover:bg-orange-50 font-bold rounded-xl transition-colors text-sm"
                >
                  Edit Manual
                </button>
                <button
                  onClick={handleAiConfirm}
                  disabled={
                    aiParsedResult.insufficientStock?.length > 0 ||
                    aiParsedResult.notFound?.length > 0
                  }
                  className="px-5 py-2 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-colors text-sm flex items-center"
                >
                  <Check size={16} className="mr-2" /> Konfirmasi Tambah
                </button>
              </div>
            </div>
          )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex bg-gray-100/80 p-1 rounded-xl w-full md:w-auto">
            {["Semua", "Hari Ini", "Minggu Ini"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "kanban" ? "bg-orange-50 text-primary" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-orange-50 text-primary" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {config.emptyStateMessage ||
                "Gunakan input AI di atas atau tombol '+ Tambah Pesanan' untuk mulai menambahkan transaksi."}
            </p>
          </div>
        )}

        {/* Content Area */}
        {orders.length > 0 && viewMode === "kanban" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 hide-scrollbar">
              {config.kanbanColumns.map((col) =>
                renderKanbanColumn(
                  col,
                  filteredOrders.filter((o) => o.status === col.key),
                ),
              )}
            </div>
          </DragDropContext>
        )}

        {orders.length > 0 && viewMode === "table" && (
          <RecentOrdersTable orders={filteredOrders} />
        )}

        {/* Manual Add/Edit Order Modal */}
        {isModalOpen &&
          renderModal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] my-auto">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingOrderId ? "Edit Pesanan" : "Tambah Pesanan Manual"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {/* Row 1: Nama + Tipe */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Nama Pelanggan
                      </label>
                      <input
                        type="text"
                        value={newOrder.customerName}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                        placeholder="Contoh: Budi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Tipe Pesanan
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {config.orderTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setNewOrder({
                                ...newOrder,
                                orderType: type.value,
                              })
                            }
                            className={`w-full py-2.5 font-semibold rounded-xl text-sm border transition-colors ${newOrder.orderType === type.value ? "bg-primary/10 text-primary border-primary" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields Based on orderType */}
                  {(() => {
                    const activeFields =
                      config.orderTypes.find(
                        (t) => t.value === newOrder.orderType,
                      )?.fields || [];
                    if (activeFields.length === 0) return null;

                    const inlineFields = activeFields.filter(
                      (f) =>
                        ![
                          "deliveryAddress",
                          "shippingAddress",
                          "serviceAddress",
                          "customDetails",
                        ].includes(f),
                    );
                    const textareaFields = activeFields.filter((f) =>
                      [
                        "deliveryAddress",
                        "shippingAddress",
                        "serviceAddress",
                        "customDetails",
                      ].includes(f),
                    );

                    return (
                      <>
                        {inlineFields.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {inlineFields.includes("tableNumber") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Nomor Meja
                                </label>
                                <input
                                  type="text"
                                  value={newOrder.tableNumber}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      tableNumber: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                                  placeholder="Contoh: 4"
                                />
                              </div>
                            )}
                            {inlineFields.includes("customerPhone") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Nomor WhatsApp
                                </label>
                                <input
                                  type="tel"
                                  value={newOrder.customerPhone}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      customerPhone: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                                  placeholder="08..."
                                />
                              </div>
                            )}
                            {inlineFields.includes("platformOrderId") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  ID Pesanan (Platform)
                                </label>
                                <input
                                  type="text"
                                  value={newOrder.platformOrderId}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      platformOrderId: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                                  placeholder="Contoh: ORD-123"
                                />
                              </div>
                            )}
                            {inlineFields.includes("appointmentDate") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Tanggal
                                </label>
                                <input
                                  type="date"
                                  value={newOrder.appointmentDate}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      appointmentDate: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                                />
                              </div>
                            )}
                            {inlineFields.includes("appointmentTime") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Waktu
                                </label>
                                <input
                                  type="time"
                                  value={newOrder.appointmentTime}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      appointmentTime: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                                />
                              </div>
                            )}
                            {inlineFields.includes("dueDate") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Tenggat / Tanggal Ambil
                                </label>
                                <input
                                  type="date"
                                  value={newOrder.dueDate}
                                  onChange={(e) =>
                                    setNewOrder({
                                      ...newOrder,
                                      dueDate: e.target.value,
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                                />
                              </div>
                            )}
                            {inlineFields.includes("downPayment") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  DP (Uang Muka)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    value={
                                      newOrder.downPayment
                                        ? Number(
                                            newOrder.downPayment,
                                          ).toLocaleString("id-ID")
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setNewOrder({
                                        ...newOrder,
                                        downPayment: Number(
                                          e.target.value.replace(/\D/g, ""),
                                        ),
                                      })
                                    }
                                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            )}
                            {inlineFields.includes("courierService") && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                  Ekspedisi
                                </label>
                                <div className="relative">
                                  <select
                                    value={newOrder.courierService}
                                    onChange={(e) =>
                                      setNewOrder({
                                        ...newOrder,
                                        courierService: e.target.value,
                                      })
                                    }
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white appearance-none cursor-pointer"
                                  >
                                    <option value="">Pilih Ekspedisi...</option>
                                    {config.extraFields?.courierService?.options?.map(
                                      (opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="m6 9 6 6 6-6" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {textareaFields.map((field) => {
                          const labelMap = {
                            deliveryAddress: "Alamat Pengiriman",
                            shippingAddress: "Alamat Pengiriman (Resi)",
                            serviceAddress: "Alamat Servis / Panggilan",
                            customDetails: "Detail Custom",
                          };
                          const placeholderMap = {
                            deliveryAddress: "Masukkan alamat lengkap...",
                            shippingAddress: "Masukkan alamat lengkap...",
                            serviceAddress: "Masukkan alamat...",
                            customDetails:
                              config.extraFields?.customDetails?.placeholder ||
                              "Detail pesanan...",
                          };
                          return (
                            <div key={field}>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                {labelMap[field]}
                              </label>
                              <textarea
                                value={newOrder[field] || ""}
                                onChange={(e) =>
                                  setNewOrder({
                                    ...newOrder,
                                    [field]: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm resize-none"
                                placeholder={placeholderMap[field]}
                                rows="2"
                              ></textarea>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Item Picker */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pilih Item
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <div className="relative flex-1">
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm bg-white appearance-none cursor-pointer"
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} — Rp{" "}
                              {p.sellPrice?.toLocaleString("id-ID")}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                          className="flex-1 sm:flex-none bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>

                    {/* Added Items List */}
                    {newOrder.items.length > 0 ? (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-2">
                        {newOrder.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md text-xs">
                                {item.qty}x
                              </span>
                              <span className="font-medium text-gray-700">
                                {item.productName}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-gray-900">
                                Rp {item.subtotal?.toLocaleString("id-ID")}
                              </span>
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 px-2 mt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-700">
                            Total Harga:
                          </span>
                          <span className="font-bold text-primary text-lg">
                            Rp {manualOrderTotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500 mb-4">
                        Belum ada item pesanan
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={newOrder.notes}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, notes: e.target.value })
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                        
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    className="px-6 py-2.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-primary/20 flex items-center"
                  >
                    <Check size={18} className="mr-2" /> Simpan Pesanan
                  </button>
                </div>
              </div>
            </div>,
          )}

        {/* Delete Confirmation Modal */}
        {deleteOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Hapus Pesanan?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak
                  dapat dibatalkan.
                </p>
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
      {stockErrorModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up border-t-4 border-red-500">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Stok Tidak Cukup!
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Stok{" "}
                <span className="font-bold">
                  {stockErrorModal.errorData?.product}
                </span>{" "}
                tidak mencukupi untuk pesanan ini.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 flex justify-around mb-6 border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Tersedia</p>
                  <p className="font-bold text-lg text-gray-900">
                    {stockErrorModal.errorData?.available}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dibutuhkan</p>
                  <p className="font-bold text-lg text-red-500">
                    {stockErrorModal.errorData?.requested}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic mb-6">
                Apakah Anda ingin tetap melanjutkan proses pesanan ini meskipun
                stok tercatat kurang?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setStockErrorModal({ ...stockErrorModal, isOpen: false })
                  }
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={forceUpdateStatus}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 transition-colors"
                >
                  Lanjutkan Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Not Found Modal */}
      {aiParsedResult?.notFound && aiParsedResult.notFound.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border-t-4 border-red-500">
            <div className="p-6">
              <div className="flex items-center text-red-500 mb-4">
                <AlertTriangle size={24} className="mr-3" />
                <h3 className="text-lg font-bold text-gray-900">
                  Menu tidak tersedia!
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Menu berikut tidak dapat ditemukan di inventori saat ini:
              </p>
              <ul className="list-disc pl-5 mb-5 text-red-600 font-semibold text-sm">
                {aiParsedResult.notFound.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-48 overflow-y-auto mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Daftar Menu Tersedia
                </p>
                <div className="space-y-2">
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <div
                        key={p._id}
                        className="flex justify-between items-center text-sm border-b border-gray-200 pb-1 last:border-0"
                      >
                        <span className="font-medium text-gray-800">
                          {p.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          Rp {p.sellPrice?.toLocaleString("id-ID")} ({p.stock}{" "}
                          {p.unit})
                        </span>
                      </div>
                    ))}
                  {products.filter((p) => p.stock > 0).length === 0 && (
                    <p className="text-sm text-gray-400">
                      Tidak ada produk tersedia (stok habis).
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAiParsedResult(null)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors w-full"
                >
                  Tutup & Edit Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Done Modal */}
      {confirmDoneModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Selesaikan Pesanan?
              </h3>
              <p className="text-gray-500 mb-6">
                Apakah Anda yakin pesanan ini sudah selesai? Pesanan yang sudah
                berstatus Selesai{" "}
                <span className="font-bold text-red-500">
                  tidak dapat dikembalikan
                </span>{" "}
                ke status sebelumnya.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmDoneModal({ isOpen: false, orderId: null })
                  }
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={executeConfirmDone}
                  className="flex-1 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30"
                >
                  Ya, Selesaikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Orders;
