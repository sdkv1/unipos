// UniPOS Shared - Utilities, Storage, Formatters, Toast

const DB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('unipos_' + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem('unipos_' + key, JSON.stringify(value));
  }
};

const fmt = {
  rupiah(n) {
    return 'Rp ' + (n || 0).toLocaleString('id-ID');
  },
  number(n) {
    return (n || 0).toLocaleString('id-ID');
  },
  date(d) {
    return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  },
  time(d) {
    return new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  },
  datetime(d) {
    return new Date(d).toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
};

const uid = {
  product() {
    return 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
  },
  tx() {
    const now = new Date();
    const d = now.toISOString().slice(0, 10).replace(/-/g, '');
    const r = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return 'TX' + d + r;
  }
};

// Toast system
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-[9999] space-y-2';
    document.body.appendChild(this.container);
  },
  show(msg, type = 'info') {
    if (!this.container) this.init();
    const el = document.createElement('div');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const colors = { success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-indigo-500' };
    el.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white min-w-[280px] toast-in ${colors[type]}`;
    el.innerHTML = `<i class="fas ${icons[type]}"></i><span class="font-medium text-sm">${msg}</span>`;
    this.container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = 'all 0.3s'; }, 3000);
    setTimeout(() => el.remove(), 3300);
  }
};

// Demo data
function loadDemoData() {
  const demo = [
    { id: uid.product(), code: 'MKN001', name: 'Nasi Goreng Spesial', category: 'Makanan', buyPrice: 12000, sellPrice: 18000, stock: 50 },
    { id: uid.product(), code: 'MKN002', name: 'Mie Ayam Bakso', category: 'Makanan', buyPrice: 10000, sellPrice: 15000, stock: 40 },
    { id: uid.product(), code: 'MKN003', name: 'Sate Ayam 10 Tusuk', category: 'Makanan', buyPrice: 15000, sellPrice: 22000, stock: 30 },
    { id: uid.product(), code: 'MNM001', name: 'Es Teh Manis', category: 'Minuman', buyPrice: 2000, sellPrice: 5000, stock: 100 },
    { id: uid.product(), code: 'MNM002', name: 'Es Jeruk', category: 'Minuman', buyPrice: 3000, sellPrice: 7000, stock: 80 },
    { id: uid.product(), code: 'MNM003', name: 'Kopi Susu', category: 'Minuman', buyPrice: 4000, sellPrice: 10000, stock: 60 },
    { id: uid.product(), code: 'SNK001', name: 'Keripik Kentang', category: 'Snack', buyPrice: 5000, sellPrice: 8000, stock: 45 },
    { id: uid.product(), code: 'SNK002', name: 'Roti Bakar', category: 'Snack', buyPrice: 4000, sellPrice: 7000, stock: 35 },
    { id: uid.product(), code: 'RTK001', name: 'Sabun Mandi 100gr', category: 'RTK', buyPrice: 3500, sellPrice: 5500, stock: 100 },
    { id: uid.product(), code: 'RTK002', name: 'Shampoo Sachet', category: 'RTK', buyPrice: 2000, sellPrice: 3500, stock: 200 },
    { id: uid.product(), code: 'MKN004', name: 'Ayam Goreng Crispy', category: 'Makanan', buyPrice: 18000, sellPrice: 25000, stock: 25 },
    { id: uid.product(), code: 'MNM004', name: 'Jus Alpukat', category: 'Minuman', buyPrice: 8000, sellPrice: 15000, stock: 20 },
  ];
  DB.set('products', demo);
  Toast.show('Data demo berhasil dimuat!', 'success');
  return demo;
}

// Init data
function initData() {
  let products = DB.get('products', []);
  if (!products.length) products = loadDemoData();
  if (!DB.get('transactions', null)) DB.set('transactions', []);
  if (!DB.get('settings', null)) DB.set('settings', { storeName: 'Toko Saya', address: '', phone: '' });
  return { products, transactions: DB.get('transactions', []), settings: DB.get('settings', {}) };
}

// Export / Import
function exportAll() {
  const data = {
    products: DB.get('products', []),
    transactions: DB.get('transactions', []),
    settings: DB.get('settings', {}),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'unipos-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  Toast.show('Data berhasil diexport!', 'success');
}

function importAll(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.products) DB.set('products', data.products);
      if (data.transactions) DB.set('transactions', data.transactions);
      if (data.settings) DB.set('settings', data.settings);
      Toast.show('Data berhasil diimport!', 'success');
      if (callback) callback();
    } catch {
      Toast.show('Format file tidak valid!', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  ['products', 'transactions', 'settings'].forEach(k => localStorage.removeItem('unipos_' + k));
  Toast.show('Semua data telah dihapus!', 'success');
}
