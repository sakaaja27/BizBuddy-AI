import React from 'react';

const RecentOrdersTable = ({ orders }) => {
  if (!orders || orders.length === 0) return null;

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">Pending</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">Processing</span>;
      case 'done':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">Done</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">{status}</span>;
    }
  };

  const formatItems = (items) => {
    if (typeof items === 'string') return items; // Fallback for old data
    if (Array.isArray(items)) {
      return items.map(item => `${item.qty}x ${item.productName}`).join(', ');
    }
    return '-';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Pesanan Terbaru</h3>
        <a href="#" className="text-primary text-sm font-semibold hover:text-orange-600 transition-colors">Lihat Semua</a>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">ID Pesanan</th>
              <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">Pelanggan</th>
              <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">Item</th>
              <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">Total</th>
              <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.orderNumber || order.orderId || index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 group">
                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap">{order.orderNumber || order.orderId}</td>
                <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{order.customerName}</td>
                <td className="py-4 px-6 text-sm text-gray-600 max-w-[200px] truncate">{formatItems(order.items)}</td>
                <td className="py-4 px-6 text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Rp {order.totalAmount?.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;
