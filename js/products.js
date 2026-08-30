document.addEventListener('alpine:init', () => {
  Alpine.data('productsApp', () => ({
    products: [],
    search: '',
    modalOpen: false,
    editing: false,
    form: { id: null, code: '', name: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0 },

    init() { this.products = DB.get('products', []); },

    get filtered() {
      if (!this.search) return this.products;
      const q = this.search.toLowerCase();
      return this.products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
    },

    openModal() {
      this.editing = false;
      this.form = { id: null, code: '', name: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0 };
      this.modalOpen = true;
    },

    edit(p) {
      this.editing = true;
      this.form = { ...p };
      this.modalOpen = true;
    },

    save() {
      const f = this.form;
      if (!f.code || !f.name || f.buyPrice < 0 || f.sellPrice < 0 || f.stock < 0) {
        Toast.show('Semua field wajib diisi!', 'error'); return;
      }
      if (this.editing) {
        const i = this.products.findIndex(p => p.id === f.id);
        if (i >= 0) { this.products[i] = { ...f }; Toast.show('Produk diupdate!', 'success'); }
      } else {
        if (this.products.find(p => p.code === f.code)) { Toast.show('Kode sudah ada!', 'error'); return; }
        this.products.push({ ...f, id: uid.product() });
        Toast.show('Produk ditambahkan!', 'success');
      }
      DB.set('products', this.products);
      this.modalOpen = false;
    },

    del(id) {
      if (!confirm('Hapus produk ini?')) return;
      this.products = this.products.filter(p => p.id !== id);
      DB.set('products', this.products);
      Toast.show('Produk dihapus!', 'success');
    }
  }));
});
