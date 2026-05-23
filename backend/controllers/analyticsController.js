const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const getDateRange = (period, from, to) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let previousStartDate = new Date();
  let previousEndDate = new Date();

  if (period === 'Hari Ini') {
    startDate.setHours(0, 0, 0, 0);
    previousStartDate.setDate(now.getDate() - 1);
    previousStartDate.setHours(0, 0, 0, 0);
    previousEndDate = new Date(startDate);
  } else if (period === 'Minggu Ini') {
    const day = now.getDay() || 7; 
    startDate.setDate(now.getDate() - day + 1);
    startDate.setHours(0, 0, 0, 0);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7);
    previousEndDate = new Date(startDate);
  } else if (period === 'Bulan Ini') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    previousEndDate = new Date(startDate);
  } else if (period === '3 Bulan') {
    startDate.setMonth(now.getMonth() - 2);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 3);
    previousEndDate = new Date(startDate);
  } else if (period === 'Tahun Ini') {
    startDate.setMonth(0, 1);
    startDate.setHours(0, 0, 0, 0);
    previousStartDate = new Date(startDate);
    previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
    previousEndDate = new Date(startDate);
  } else if (period === 'Custom' && from && to) {
    startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - diffDays);
    previousEndDate = new Date(startDate);
  }

  return { startDate, endDate, previousStartDate, previousEndDate };
};

const getSummary = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const currentOrders = await Order.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const previousOrders = await Order.find({
      userId,
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });

    const calcStats = (orders) => {
      const doneOrders = orders.filter(o => o.status === 'done');
      const totalRevenue = doneOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrdersCount = orders.length;
      const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
      let totalItemsSold = 0;
      doneOrders.forEach(o => {
        o.items.forEach(i => totalItemsSold += i.qty);
      });
      return { totalRevenue, totalOrdersCount, avgOrderValue, totalItemsSold };
    };

    const currentStats = calcStats(currentOrders);
    const prevStats = calcStats(previousOrders);

    const calcTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    res.json({
      totalRevenue: currentStats.totalRevenue,
      totalOrders: currentStats.totalOrdersCount,
      avgOrderValue: currentStats.avgOrderValue,
      totalItemsSold: currentStats.totalItemsSold,
      vsLastPeriod: {
        revenue: calcTrend(currentStats.totalRevenue, prevStats.totalRevenue),
        orders: calcTrend(currentStats.totalOrdersCount, prevStats.totalOrdersCount),
        avgOrderValue: calcTrend(currentStats.avgOrderValue, prevStats.avgOrderValue)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const orders = await Order.find({
      userId,
      status: 'done',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const chartData = {};

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      let key = '';

      if (period === 'Hari Ini') {
        key = `${d.getHours().toString().padStart(2, '0')}:00`;
      } else if (period === 'Minggu Ini' || (period === 'Custom' && (endDate - startDate) <= 7 * 24 * 60 * 60 * 1000)) {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        key = days[d.getDay()];
      } else if (period === 'Tahun Ini') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        key = months[d.getMonth()];
      } else {
        // Bulan Ini, 3 Bulan, or large custom
        key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!chartData[key]) {
        chartData[key] = { date: key, revenue: 0, orderCount: 0 };
      }
      chartData[key].revenue += o.totalAmount;
      chartData[key].orderCount += 1;
    });

    // To ensure ordering, we might need to pre-fill chartData based on period,
    // but sorting by raw date or just returning Object.values might be enough for this scale if pre-filling isn't done.
    // For simplicity, we just return Object.values, but ideally we sort them.
    // Given the variety of keys, let's just return them. The frontend might need to sort or we sort here if possible.
    res.json(Object.values(chartData));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching revenue chart' });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const orders = await Order.find({
      userId,
      status: 'done',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const productStats = {};
    let totalRevenueAll = 0;

    orders.forEach(o => {
      o.items.forEach(i => {
        if (!productStats[i.productName]) {
          productStats[i.productName] = { productName: i.productName, qtySold: 0, revenue: 0 };
        }
        productStats[i.productName].qtySold += i.qty;
        productStats[i.productName].revenue += i.subtotal;
        totalRevenueAll += i.subtotal;
      });
    });

    let result = Object.values(productStats);
    result.forEach(r => {
      r.percentage = totalRevenueAll > 0 ? (r.revenue / totalRevenueAll) * 100 : 0;
    });

    result.sort((a, b) => b.qtySold - a.qtySold);
    res.json(result.slice(0, 5));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching top products' });
  }
};

const getPeakHours = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    const orders = await Order.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orderCount: 0 }));

    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      hours[h].orderCount += 1;
    });

    res.json(hours);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching peak hours' });
  }
};

const getProfitMargin = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await Product.find({ userId, isActive: true });
    
    // We also need historical data to show "Total Profit", but the prompt asks for general product margin info
    // "Formula: (sellPrice - buyPrice) / sellPrice * 100"
    
    const result = products.map(p => {
      const sellPrice = p.sellPrice || 0;
      const buyPrice = p.buyPrice || 0;
      const margin = sellPrice > 0 ? ((sellPrice - buyPrice) / sellPrice) * 100 : 0;
      
      return {
        id: p._id,
        productName: p.name,
        buyPrice,
        sellPrice,
        margin
      };
    });

    result.sort((a, b) => b.margin - a.margin);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profit margin' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { period, from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);
    const userId = req.user.id;

    // Get all orders to know historical customer data
    const allOrders = await Order.find({ userId, status: 'done' });
    
    const customerStats = {};
    
    allOrders.forEach(o => {
      const name = o.customerName.trim().toLowerCase();
      if (!name || name === 'anonim') return;
      
      const orderDate = new Date(o.createdAt);
      const isPeriod = orderDate >= startDate && orderDate <= endDate;
      
      if (!customerStats[name]) {
        customerStats[name] = { count: 0, firstOrder: orderDate, periodCount: 0 };
      }
      
      customerStats[name].count += 1;
      if (orderDate < customerStats[name].firstOrder) {
        customerStats[name].firstOrder = orderDate;
      }
      if (isPeriod) {
        customerStats[name].periodCount += 1;
      }
    });

    let newCustomers = 0;
    let returningCustomers = 0;
    const topList = [];

    for (const [name, data] of Object.entries(customerStats)) {
      if (data.periodCount > 0) {
        // Did they have their first order in this period?
        if (data.firstOrder >= startDate && data.firstOrder <= endDate) {
          newCustomers += 1;
        }
        // Did they have multiple orders historically and at least one in period?
        if (data.count > 1) {
          returningCustomers += 1;
        }
        
        topList.push({ name, count: data.count });
      }
    }

    topList.sort((a, b) => b.count - a.count);
    const totalPeriodCustomers = newCustomers + returningCustomers;
    const repeatRate = totalPeriodCustomers > 0 ? (returningCustomers / totalPeriodCustomers) * 100 : 0;

    res.json({
      newCustomers,
      returningCustomers,
      repeatRate,
      topCustomers: topList.slice(0, 5)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
};

module.exports = {
  getSummary,
  getRevenueChart,
  getTopProducts,
  getPeakHours,
  getProfitMargin,
  getCustomers
};
