document.addEventListener('alpine:init', () => {
  Alpine.data('reportsApp', () => ({
    transactions: [],
    period: 'today',
    stats: { sales: 0, revenue: 0, items: 0, avg: 0 },
    topProducts: [],

    init() {
      this.transactions = DB.get('transactions', []);
      this.generate();
    },

    generate() {
      let filtered = this.transactions;
      const now = new Date();
      if (this.period === 'today') {
        const today = now.toISOString().slice(0, 10);
        filtered = filtered.filter(t => t.date === today);
      } else if (this.period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => t.timestamp >= weekAgo.getTime());
      } else if (this.period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => t.timestamp >= monthAgo.getTime());
      }

      this.stats = {
        sales: filtered.length,
        revenue: filtered.reduce((s, t) => s + t.total, 0),
        items: filtered.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0),
        avg: filtered.length ? Math.round(filtered.reduce((s, t) => s + t.total, 0) / filtered.length) : 0
      };

      const sales = {};
      filtered.forEach(tx => {
        tx.items.forEach(it => {
          if (!sales[it.id]) sales[it.id] = { id: it.id, name: it.name, qty: 0, revenue: 0 };
          sales[it.id].qty += it.qty;
          sales[it.id].revenue += it.qty * it.price;
        });
      });
      this.topProducts = Object.values(sales).sort((a, b) => b.qty - a.qty);
    }
  }));
});
