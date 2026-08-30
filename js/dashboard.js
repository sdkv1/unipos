document.addEventListener('alpine:init', () => {
  Alpine.data('dashboardApp', () => ({
    stats: { todaySales: 0, todayRevenue: 0, totalProducts: 0, totalTransactions: 0 },
    topProducts: [],
    recentTx: [],
    settings: {},
    detailOpen: false,
    selectedTx: null,

    init() {
      this.settings = DB.get('settings', {});
      const products = DB.get('products', []);
      const transactions = DB.get('transactions', []);
      const today = new Date().toISOString().slice(0, 10);
      const todayTx = transactions.filter(t => t.date === today);

      this.stats = {
        todaySales: todayTx.length,
        todayRevenue: todayTx.reduce((s, t) => s + t.total, 0),
        totalProducts: products.length,
        totalTransactions: transactions.length
      };

      // Top products
      const sales = {};
      transactions.forEach(tx => {
        tx.items.forEach(it => {
          if (!sales[it.id]) sales[it.id] = { name: it.name, qty: 0, revenue: 0 };
          sales[it.id].qty += it.qty;
          sales[it.id].revenue += it.qty * it.price;
        });
      });
      this.topProducts = Object.values(sales).sort((a, b) => b.qty - a.qty);

      this.recentTx = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
    },

    showDetail(tx) {
      this.selectedTx = tx;
      this.detailOpen = true;
    }
  }));
});
