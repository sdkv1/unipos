// UniPOS Shared - Utilities, Storage, Formatters, Toast
const APP_VERSION = '1.0.4';

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

// Export data (dipakai tombol export di header semua halaman)
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
