document.addEventListener('alpine:init', () => {
  Alpine.data('transactionsApp', () => ({
    transactions: [],
    search: '',
    dateFilter: '',
    detailOpen: false,
    selected: null,
    settings: {},

    init() {
      this.transactions = DB.get('transactions', []);
      this.settings = DB.get('settings', {});
    },

    get filtered() {
      let result = [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
      if (this.search) {
        const q = this.search.toLowerCase();
        result = result.filter(t => t.id.toLowerCase().includes(q));
      }
      if (this.dateFilter) {
        result = result.filter(t => t.date === this.dateFilter);
      }
      return result;
    },

    show(tx) {
      this.selected = tx;
      this.detailOpen = true;
    }
  }));
});
