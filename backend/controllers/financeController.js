const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Expense = require('../models/Expense');
const Business = require('../models/Business');
const ExcelJS = require('exceljs');

const getDateRange = (period, from, to) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'Hari Ini') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'Minggu Ini') {
    const day = now.getDay() || 7; 
    startDate.setDate(now.getDate() - day + 1);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'Bulan Ini') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === '3 Bulan') {
    startDate.setMonth(now.getMonth() - 2);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'Tahun Ini') {
    startDate.setMonth(0, 1);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'Custom' && from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

const getSummary = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    // Pemasukan (Orders status done)
    const orders = await Order.find({ userId, status: 'done', createdAt: { $gte: startDate, $lte: endDate } });
    const totalPemasukan = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const transaksiBerhasil = orders.length;

    // Pengeluaran Modal (StockMovement type 'in') - We need product buyPrice to calculate cost
    const movements = await StockMovement.find({ 
      businessId: req.user.businessId, 
      type: 'in', 
      createdAt: { $gte: startDate, $lte: endDate } 
    }).populate('productId');

    let pengeluaranStok = 0;
    movements.forEach(m => {
      if (m.productId && m.productId.buyPrice) {
        pengeluaranStok += (m.quantity * m.productId.buyPrice);
      }
    });

    // Pengeluaran Manual (Expense)
    const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } });
    const pengeluaranManual = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalPengeluaran = pengeluaranStok + pengeluaranManual;
    const labaBersih = totalPemasukan - totalPengeluaran;
    const margin = totalPemasukan > 0 ? ((labaBersih / totalPemasukan) * 100).toFixed(1) : 0;

    res.json({
      totalPemasukan,
      transaksiBerhasil,
      totalPengeluaran,
      restockCount: movements.length,
      labaBersih,
      margin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching finance summary' });
  }
};

const getCashflow = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const orders = await Order.find({ userId, status: 'done', createdAt: { $gte: startDate, $lte: endDate } });
    const movements = await StockMovement.find({ businessId: req.user.businessId, type: 'in', createdAt: { $gte: startDate, $lte: endDate } }).populate('productId');
    const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } });

    const chartData = {};

    const getKey = (d) => {
      const date = new Date(d);
      if (period === 'Hari Ini') return `${date.getHours().toString().padStart(2, '0')}:00`;
      if (period === 'Minggu Ini' || (period === 'Custom' && (endDate - startDate) <= 7 * 24 * 60 * 60 * 1000)) {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return days[date.getDay()];
      }
      if (period === 'Tahun Ini') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return months[date.getMonth()];
      }
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    orders.forEach(o => {
      const key = getKey(o.createdAt);
      if (!chartData[key]) chartData[key] = { date: key, pemasukan: 0, pengeluaran: 0 };
      chartData[key].pemasukan += o.totalAmount;
    });

    movements.forEach(m => {
      if (m.productId && m.productId.buyPrice) {
        const key = getKey(m.createdAt);
        if (!chartData[key]) chartData[key] = { date: key, pemasukan: 0, pengeluaran: 0 };
        chartData[key].pengeluaran += (m.quantity * m.productId.buyPrice);
      }
    });

    expenses.forEach(e => {
      const key = getKey(e.date);
      if (!chartData[key]) chartData[key] = { date: key, pemasukan: 0, pengeluaran: 0 };
      chartData[key].pengeluaran += e.amount;
    });

    const result = Object.values(chartData).map(d => ({
      ...d,
      labaBersih: d.pemasukan - d.pengeluaran
    }));

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cashflow' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { period, from, to, type = 'all', page = 1, limit = 10 } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    let transactions = [];

    if (type === 'all' || type === 'pemasukan') {
      const orders = await Order.find({ userId, status: 'done', createdAt: { $gte: startDate, $lte: endDate } });
      orders.forEach(o => {
        transactions.push({
          id: o._id,
          tanggal: o.createdAt,
          keterangan: `Pesanan ${o.orderNumber} - ${o.customerName}`,
          kategori: 'Penjualan',
          jumlah: o.totalAmount,
          tipe: 'pemasukan'
        });
      });
    }

    if (type === 'all' || type === 'pengeluaran') {
      const movements = await StockMovement.find({ businessId: req.user.businessId, type: 'in', createdAt: { $gte: startDate, $lte: endDate } }).populate('productId');
      movements.forEach(m => {
        if (m.productId && m.productId.buyPrice) {
          transactions.push({
            id: m._id,
            tanggal: m.createdAt,
            keterangan: `Restock ${m.productName} (${m.quantity} ${m.productId.unit})`,
            kategori: 'Pembelian Stok',
            jumlah: m.quantity * m.productId.buyPrice,
            tipe: 'pengeluaran'
          });
        }
      });

      const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } });
      expenses.forEach(e => {
        transactions.push({
          id: e._id,
          tanggal: e.date,
          keterangan: e.description,
          kategori: e.category.charAt(0).toUpperCase() + e.category.slice(1),
          jumlah: e.amount,
          tipe: 'pengeluaran'
        });
      });
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = transactions.slice(startIndex, endIndex);

    res.json({
      data: paginated,
      total: transactions.length,
      totalPages: Math.ceil(transactions.length / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

const getProductBreakdown = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const orders = await Order.find({ userId, status: 'done', createdAt: { $gte: startDate, $lte: endDate } });
    const products = await Product.find({ userId });
    
    const productMap = {};
    products.forEach(p => {
      productMap[p.name] = { 
        name: p.name, 
        qty: 0, 
        revenue: 0, 
        buyPrice: p.buyPrice || 0,
        sellPrice: p.sellPrice || 0
      };
    });

    orders.forEach(o => {
      o.items.forEach(i => {
        if (productMap[i.productName]) {
          productMap[i.productName].qty += i.qty;
          productMap[i.productName].revenue += i.subtotal;
        }
      });
    });

    const result = Object.values(productMap).map(p => {
      const cogs = p.qty * p.buyPrice;
      const profit = p.revenue - cogs;
      const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
      return {
        productName: p.name,
        terjual: p.qty,
        revenue: p.revenue,
        modal: cogs,
        profit,
        margin
      };
    }).filter(p => p.qty > 0);

    result.sort((a, b) => b.revenue - a.revenue);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product breakdown' });
  }
};

const addExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const business = await Business.findOne({ userId });
    
    const { description, category, amount, date } = req.body;

    const expense = await Expense.create({
      userId,
      businessId: business._id,
      description,
      category,
      amount,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding expense' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;
    const business = await Business.findOne({ userId });

    const workbook = new ExcelJS.Workbook();
    
    // SHEET 1: Ringkasan
    const summarySheet = workbook.addWorksheet('Ringkasan');
    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Nilai', key: 'value', width: 30 }
    ];
    
    // Get Data
    const orders = await Order.find({ userId, status: 'done', createdAt: { $gte: startDate, $lte: endDate } });
    const totalPemasukan = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const movements = await StockMovement.find({ businessId: business._id, type: 'in', createdAt: { $gte: startDate, $lte: endDate } }).populate('productId');
    let pengeluaranStok = 0;
    movements.forEach(m => {
      if (m.productId && m.productId.buyPrice) pengeluaranStok += (m.quantity * m.productId.buyPrice);
    });

    const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } });
    const pengeluaranManual = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalPengeluaran = pengeluaranStok + pengeluaranManual;
    const labaBersih = totalPemasukan - totalPengeluaran;

    summarySheet.addRows([
      { metric: 'Periode', value: period === 'Custom' ? `${from} - ${to}` : period },
      { metric: 'Total Pemasukan', value: totalPemasukan },
      { metric: 'Total Pengeluaran', value: totalPengeluaran },
      { metric: 'Laba Bersih', value: labaBersih }
    ]);

    // SHEET 2: Transaksi
    const txSheet = workbook.addWorksheet('Transaksi');
    txSheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'Keterangan', key: 'keterangan', width: 40 },
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Tipe', key: 'tipe', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 20 }
    ];

    let allTx = [];
    orders.forEach(o => allTx.push({
      tanggal: o.createdAt, keterangan: `Pesanan ${o.orderNumber} - ${o.customerName}`,
      kategori: 'Penjualan', tipe: 'Pemasukan', jumlah: o.totalAmount
    }));
    movements.forEach(m => {
      if (m.productId && m.productId.buyPrice) {
        allTx.push({
          tanggal: m.createdAt, keterangan: `Restock ${m.productName}`,
          kategori: 'Pembelian Stok', tipe: 'Pengeluaran', jumlah: m.quantity * m.productId.buyPrice
        });
      }
    });
    expenses.forEach(e => allTx.push({
      tanggal: e.date, keterangan: e.description,
      kategori: e.category, tipe: 'Pengeluaran', jumlah: e.amount
    }));

    allTx.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    allTx.forEach(tx => {
      txSheet.addRow({
        tanggal: new Date(tx.tanggal).toLocaleString('id-ID'),
        keterangan: tx.keterangan,
        kategori: tx.kategori,
        tipe: tx.tipe,
        jumlah: tx.jumlah
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-Keuangan-${period.replace(/\s+/g, '-')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating excel export' });
  }
};

module.exports = {
  getSummary,
  getCashflow,
  getTransactions,
  getProductBreakdown,
  addExpense,
  exportExcel
};
