// UniPOS - Universal Point of Sale
// Alpine.js Application

document.addEventListener('alpine:init', () => {
    Alpine.data('unipos', () => ({
        // ========== STATE ==========
        currentPage: 'dashboard',
        sidebarOpen: false,
        currentTime: '',

        menuItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
            { id: 'pos', label: 'Kasir', icon: 'fas fa-shopping-cart' },
            { id: 'products', label: 'Produk', icon: 'fas fa-box' },
            { id: 'transactions', label: 'Transaksi', icon: 'fas fa-receipt' },
            { id: 'reports', label: 'Laporan', icon: 'fas fa-chart-bar' },
            { id: 'settings', label: 'Pengaturan', icon: 'fas fa-cog' }
        ],

        // Data
        products: [],
        transactions: [],
        settings: { storeName: '', address: '', phone: '' },
        cart: [],

        // Search & Filter
        posSearch: '',
        productSearch: '',
        transactionSearch: '',
        transactionDateFilter: '',
        reportPeriod: 'today',

        // Modals
        productModalOpen: false,
        checkoutModalOpen: false,
        transactionDetailModalOpen: false,
        editingProduct: false,

        // Forms
        productForm: { id: null, code: '', name: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0 },
        paymentAmount: 0,
        changeAmount: 0,
        selectedTransaction: null,

        // Toast
        toasts: [],
        toastId: 0,

        // Report
        reportStats: { totalSales: 0, revenue: 0, itemsSold: 0, avgTransaction: 0 },
        reportTopProducts: [],

        // ========== COMPUTED ==========
        get filteredProducts() {
            if (!this.posSearch) return this.products.filter(p => p.stock > 0);
            const q = this.posSearch.toLowerCase();
            return this.products.filter(p => 
                (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) && p.stock > 0
            );
        },

        get filteredProductList() {
            if (!this.productSearch) return this.products;
            const q = this.productSearch.toLowerCase();
            return this.products.filter(p => 
                p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || 
                (p.category && p.category.toLowerCase().includes(q))
            );
        },

        get filteredTransactions() {
            let result = [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
            if (this.transactionSearch) {
                const q = this.transactionSearch.toLowerCase();
                result = result.filter(t => t.id.toLowerCase().includes(q));
            }
            if (this.transactionDateFilter) {
                result = result.filter(t => t.date === this.transactionDateFilter);
            }
            return result;
        },

        get cartSubtotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        },

        get cartDiscount() {
            // Simple discount: 5% if total > 100k, 10% if > 500k
            const total = this.cartSubtotal;
            if (total >= 500000) return Math.round(total * 0.10);
            if (total >= 100000) return Math.round(total * 0.05);
            return 0;
        },

        get cartTotal() {
            return this.cartSubtotal - this.cartDiscount;
        },

        get dashboardStats() {
            const today = new Date().toISOString().split('T')[0];
            const todayTx = this.transactions.filter(t => t.date === today);
            return {
                todaySales: todayTx.length,
                todayRevenue: todayTx.reduce((sum, t) => sum + t.total, 0)
            };
        },

        get topProducts() {
            const productSales = {};
            this.transactions.forEach(tx => {
                tx.items.forEach(item => {
                    if (!productSales[item.id]) {
                        productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
                    }
                    productSales[item.id].qty += item.qty;
                    productSales[item.id].revenue += item.qty * item.price;
                });
            });
            return Object.values(productSales).sort((a, b) => b.qty - a.qty);
        },

        get recentTransactions() {
            return [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
        },

        // ========== METHODS ==========
        initApp() {
            this.loadData();
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            this.generateReport();

            // Demo data if empty
            if (this.products.length === 0) {
                this.loadDemoData();
            }
        },

        updateTime() {
            const now = new Date();
            this.currentTime = now.toLocaleString('id-ID', { 
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        },

        loadData() {
            try {
                const p = localStorage.getItem('unipos_products');
                const t = localStorage.getItem('unipos_transactions');
                const s = localStorage.getItem('unipos_settings');
                if (p) this.products = JSON.parse(p);
                if (t) this.transactions = JSON.parse(t);
                if (s) this.settings = JSON.parse(s);
            } catch (e) {
                console.error('Error loading data:', e);
            }
        },

        saveData() {
            localStorage.setItem('unipos_products', JSON.stringify(this.products));
            localStorage.setItem('unipos_transactions', JSON.stringify(this.transactions));
            localStorage.setItem('unipos_settings', JSON.stringify(this.settings));
        },

        loadDemoData() {
            const demoProducts = [
                { id: this.generateId(), code: 'MKN001', name: 'Nasi Goreng Spesial', category: 'Makanan', buyPrice: 12000, sellPrice: 18000, stock: 50 },
                { id: this.generateId(), code: 'MKN002', name: 'Mie Ayam Bakso', category: 'Makanan', buyPrice: 10000, sellPrice: 15000, stock: 40 },
                { id: this.generateId(), code: 'MKN003', name: 'Sate Ayam 10 Tusuk', category: 'Makanan', buyPrice: 15000, sellPrice: 22000, stock: 30 },
                { id: this.generateId(), code: 'MNM001', name: 'Es Teh Manis', category: 'Minuman', buyPrice: 2000, sellPrice: 5000, stock: 100 },
                { id: this.generateId(), code: 'MNM002', name: 'Es Jeruk', category: 'Minuman', buyPrice: 3000, sellPrice: 7000, stock: 80 },
                { id: this.generateId(), code: 'MNM003', name: 'Kopi Susu', category: 'Minuman', buyPrice: 4000, sellPrice: 10000, stock: 60 },
                { id: this.generateId(), code: 'SNK001', name: 'Keripik Kentang', category: 'Snack', buyPrice: 5000, sellPrice: 8000, stock: 45 },
                { id: this.generateId(), code: 'SNK002', name: 'Roti Bakar', category: 'Snack', buyPrice: 4000, sellPrice: 7000, stock: 35 },
                { id: this.generateId(), code: 'RTK001', name: 'Sabun Mandi 100gr', category: 'RTK', buyPrice: 3500, sellPrice: 5500, stock: 100 },
                { id: this.generateId(), code: 'RTK002', name: 'Shampoo Sachet', category: 'RTK', buyPrice: 2000, sellPrice: 3500, stock: 200 },
                { id: this.generateId(), code: 'MKN004', name: 'Ayam Goreng Crispy', category: 'Makanan', buyPrice: 18000, sellPrice: 25000, stock: 25 },
                { id: this.generateId(), code: 'MNM004', name: 'Jus Alpukat', category: 'Minuman', buyPrice: 8000, sellPrice: 15000, stock: 20 },
            ];
            this.products = demoProducts;
            this.saveData();
            this.showToast('Data demo berhasil dimuat!', 'success');
        },

        generateId() {
            return 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
        },

        generateTxId() {
            const now = new Date();
            const date = now.toISOString().split('T')[0].replace(/-/g, '');
            const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            return 'TX' + date + random;
        },

        formatRupiah(amount) {
            return 'Rp ' + (amount || 0).toLocaleString('id-ID');
        },

        formatNumber(num) {
            return (num || 0).toLocaleString('id-ID');
        },

        // ========== PRODUCT CRUD ==========
        openProductModal() {
            this.editingProduct = false;
            this.productForm = { id: null, code: '', name: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0 };
            this.productModalOpen = true;
        },

        editProduct(product) {
            this.editingProduct = true;
            this.productForm = { ...product };
            this.productModalOpen = true;
        },

        saveProduct() {
            const f = this.productForm;
            if (!f.code || !f.name || f.buyPrice < 0 || f.sellPrice < 0 || f.stock < 0) {
                this.showToast('Semua field wajib diisi dengan benar!', 'error');
                return;
            }
            if (f.sellPrice < f.buyPrice) {
                this.showToast('Harga jual harus lebih besar dari harga beli!', 'warning');
            }
            if (this.editingProduct) {
                const idx = this.products.findIndex(p => p.id === f.id);
                if (idx >= 0) {
                    this.products[idx] = { ...f };
                    this.showToast('Produk berhasil diupdate!', 'success');
                }
            } else {
                if (this.products.find(p => p.code === f.code)) {
                    this.showToast('Kode produk sudah ada!', 'error');
                    return;
                }
                this.products.push({ ...f, id: this.generateId() });
                this.showToast('Produk berhasil ditambahkan!', 'success');
            }
            this.saveData();
            this.productModalOpen = false;
        },

        deleteProduct(id) {
            if (!confirm('Yakin ingin menghapus produk ini?')) return;
            this.products = this.products.filter(p => p.id !== id);
            this.saveData();
            this.showToast('Produk berhasil dihapus!', 'success');
        },

        // ========== CART ==========
        addToCart(product) {
            if (product.stock <= 0) {
                this.showToast('Stok produk habis!', 'error');
                return;
            }
            const existing = this.cart.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    this.showToast('Stok tidak mencukupi!', 'warning');
                    return;
                }
                existing.qty++;
            } else {
                this.cart.push({
                    id: product.id,
                    code: product.code,
                    name: product.name,
                    price: product.sellPrice,
                    qty: 1
                });
            }
            this.showToast(product.name + ' ditambahkan ke keranjang', 'success');
        },

        updateCartQty(idx, delta) {
            const item = this.cart[idx];
            const product = this.products.find(p => p.id === item.id);
            const newQty = item.qty + delta;
            if (newQty <= 0) {
                this.removeFromCart(idx);
                return;
            }
            if (product && newQty > product.stock) {
                this.showToast('Stok tidak mencukupi!', 'warning');
                return;
            }
            item.qty = newQty;
        },

        removeFromCart(idx) {
            this.cart.splice(idx, 1);
        },

        clearCart() {
            if (this.cart.length === 0) return;
            this.cart = [];
            this.showToast('Keranjang dikosongkan', 'info');
        },

        // ========== CHECKOUT ==========
        openCheckout() {
            if (this.cart.length === 0) {
                this.showToast('Keranjang masih kosong!', 'warning');
                return;
            }
            this.paymentAmount = 0;
            this.changeAmount = 0;
            this.checkoutModalOpen = true;
        },

        calculateChange() {
            this.changeAmount = Math.max(0, this.paymentAmount - this.cartTotal);
        },

        processCheckout() {
            if (this.paymentAmount < this.cartTotal) {
                this.showToast('Jumlah bayar kurang!', 'error');
                return;
            }
            const now = new Date();
            const transaction = {
                id: this.generateTxId(),
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().split(' ')[0].slice(0, 5),
                timestamp: now.getTime(),
                items: this.cart.map(item => ({ ...item })),
                subtotal: this.cartSubtotal,
                discount: this.cartDiscount,
                total: this.cartTotal,
                paid: this.paymentAmount,
                change: this.changeAmount
            };

            // Update stock
            this.cart.forEach(item => {
                const product = this.products.find(p => p.id === item.id);
                if (product) product.stock -= item.qty;
            });

            this.transactions.push(transaction);
            this.saveData();
            this.cart = [];
            this.checkoutModalOpen = false;
            this.showToast('Transaksi berhasil! ID: ' + transaction.id, 'success');
            this.generateReport();
        },

        // ========== TRANSACTIONS ==========
        showTransactionDetail(tx) {
            this.selectedTransaction = tx;
            this.transactionDetailModalOpen = true;
        },

        printReceipt() {
            window.print();
        },

        // ========== REPORTS ==========
        generateReport() {
            let filteredTx = this.transactions;
            const now = new Date();

            if (this.reportPeriod === 'today') {
                const today = now.toISOString().split('T')[0];
                filteredTx = filteredTx.filter(t => t.date === today);
            } else if (this.reportPeriod === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredTx = filteredTx.filter(t => t.timestamp >= weekAgo.getTime());
            } else if (this.reportPeriod === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredTx = filteredTx.filter(t => t.timestamp >= monthAgo.getTime());
            }

            this.reportStats = {
                totalSales: filteredTx.length,
                revenue: filteredTx.reduce((sum, t) => sum + t.total, 0),
                itemsSold: filteredTx.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0),
                avgTransaction: filteredTx.length > 0 ? Math.round(filteredTx.reduce((sum, t) => sum + t.total, 0) / filteredTx.length) : 0
            };

            // Top products for report
            const productSales = {};
            filteredTx.forEach(tx => {
                tx.items.forEach(item => {
                    if (!productSales[item.id]) {
                        productSales[item.id] = { id: item.id, name: item.name, qty: 0, revenue: 0 };
                    }
                    productSales[item.id].qty += item.qty;
                    productSales[item.id].revenue += item.qty * item.price;
                });
            });
            this.reportTopProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty);
        },

        // ========== SETTINGS ==========
        saveSettings() {
            this.saveData();
            this.showToast('Pengaturan berhasil disimpan!', 'success');
        },

        // ========== DATA MANAGEMENT ==========
        exportData() {
            const data = {
                products: this.products,
                transactions: this.transactions,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'unipos-backup-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Data berhasil diexport!', 'success');
        },

        importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.products) this.products = data.products;
                    if (data.transactions) this.transactions = data.transactions;
                    if (data.settings) this.settings = data.settings;
                    this.saveData();
                    this.generateReport();
                    this.showToast('Data berhasil diimport!', 'success');
                } catch (err) {
                    this.showToast('Format file tidak valid!', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        },

        clearAllData() {
            if (!confirm('PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?')) return;
            if (!confirm('Yakin? Data yang dihapus tidak bisa dikembalikan!')) return;
            this.products = [];
            this.transactions = [];
            this.settings = { storeName: '', address: '', phone: '' };
            this.cart = [];
            this.saveData();
            this.generateReport();
            this.showToast('Semua data telah dihapus!', 'success');
        },

        // ========== TOAST ==========
        showToast(message, type = 'info') {
            const id = ++this.toastId;
            this.toasts.push({ id, message, type, visible: true });
            setTimeout(() => {
                const t = this.toasts.find(t => t.id === id);
                if (t) t.visible = false;
                setTimeout(() => {
                    this.toasts = this.toasts.filter(t => t.id !== id);
                }, 200);
            }, 3000);
        }
    }));
});
