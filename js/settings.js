document.addEventListener('alpine:init', () => {
  Alpine.data('settingsApp', () => ({
    form: { storeName: '', address: '', phone: '' },

    init() {
      const s = DB.get('settings', {});
      this.form = { storeName: s.storeName || '', address: s.address || '', phone: s.phone || '' };
    },

    save() {
      DB.set('settings', { ...this.form });
      Toast.show('Pengaturan disimpan!', 'success');
    },

    exportAll() {
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
      Toast.show('Data diexport!', 'success');
    },

    importFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.products) DB.set('products', data.products);
          if (data.transactions) DB.set('transactions', data.transactions);
          if (data.settings) DB.set('settings', data.settings);
          Toast.show('Data diimport!', 'success');
          setTimeout(() => location.reload(), 1000);
        } catch {
          Toast.show('Format tidak valid!', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },

    clearAll() {
      if (!confirm('PERINGATAN: Semua data akan dihapus! Lanjutkan?')) return;
      if (!confirm('Yakin? Data tidak bisa dikembalikan!')) return;
      ['products', 'transactions', 'settings'].forEach(k => localStorage.removeItem('unipos_' + k));
      Toast.show('Semua data dihapus!', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  }));
});
