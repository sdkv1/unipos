document.addEventListener('alpine:init', () => {
  Alpine.data('posApp', () => ({
    products: [],
    search: '',
    cart: [],
    payOpen: false,
    paid: 0,
    change: 0,

    init() {
      this.products = DB.get('products', []);
    },

    get filtered() {
      if (!this.search) return this.products.filter(p => p.stock > 0);
      const q = this.search.toLowerCase();
      return this.products.filter(p => (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) && p.stock > 0);
    },

    get subtotal() { return this.cart.reduce((s, i) => s + i.price * i.qty, 0); },
    get discount() {
      const t = this.subtotal;
      if (t >= 500000) return Math.round(t * 0.10);
      if (t >= 100000) return Math.round(t * 0.05);
      return 0;
    },
    get total() { return this.subtotal - this.discount; },

    add(p) {
      if (p.stock <= 0) { Toast.show('Stok habis!', 'error'); return; }
      const ex = this.cart.find(c => c.id === p.id);
      if (ex) {
        if (ex.qty >= p.stock) { Toast.show('Stok tidak cukup!', 'warning'); return; }
        ex.qty++;
      } else {
        this.cart.push({ id: p.id, code: p.code, name: p.name, price: p.sellPrice, qty: 1 });
      }
      Toast.show(p.name + ' ditambahkan', 'success');
    },

    qty(i, d) {
      const item = this.cart[i];
      const prod = this.products.find(p => p.id === item.id);
      const nq = item.qty + d;
      if (nq <= 0) { this.remove(i); return; }
      if (prod && nq > prod.stock) { Toast.show('Stok tidak cukup!', 'warning'); return; }
      item.qty = nq;
    },

    remove(i) { this.cart.splice(i, 1); },
    clear() { if (this.cart.length) { this.cart = []; Toast.show('Keranjang dikosongkan', 'info'); } },

    openPay() {
      if (!this.cart.length) { Toast.show('Keranjang kosong!', 'warning'); return; }
      this.paid = 0; this.change = 0; this.payOpen = true;
    },

    calcChange() { this.change = Math.max(0, this.paid - this.total); },

    process() {
      if (this.paid < this.total) { Toast.show('Bayar kurang!', 'error'); return; }
      const now = new Date();
      const tx = {
        id: uid.tx(), date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5),
        timestamp: now.getTime(), items: this.cart.map(c => ({...c})),
        subtotal: this.subtotal, discount: this.discount, total: this.total,
        paid: this.paid, change: this.change
      };
      this.cart.forEach(c => {
        const p = this.products.find(pr => pr.id === c.id);
        if (p) p.stock -= c.qty;
      });
      const txs = DB.get('transactions', []);
      txs.push(tx);
      DB.set('transactions', txs);
      DB.set('products', this.products);
      this.cart = []; this.payOpen = false;
      Toast.show('Transaksi berhasil! ID: ' + tx.id, 'success');
    }
  }));
});
