import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Trash2, Edit, Plus, Minus, X, Store, BarChart3, ShieldCheck, Box, PackagePlus, LogIn, LogOut, Search, CreditCard } from 'lucide-react';

function App() {
  // Global App States
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('shop'); // 'shop' | 'admin'

  // Live Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  // User Session Token States
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', secretAdminCode: '' });

  // Dashboard Management Data States
  const [adminData, setAdminData] = useState({ orders: [], totalRevenue: 0, totalSalesCount: 0 });
  const [adminLoading, setAdminLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', image: '', category: 'Electronics', countInStock: '' });
  
  // Track state for item modifications
  const [editingProductId, setEditingProductId] = useState(null);

  // Clear authentication form state when switching views or toggling modals
  useEffect(() => {
    setAuthForm({ name: '', email: '', password: '', secretAdminCode: '' });
  }, [isRegisterMode, isAuthModalOpen]);

  const syncCatalog = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/products', {
        headers: {} 
      });
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch store inventory records.');
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCatalog();
  }, []);

  // Secure API Headers Request Generator Utility
  const getSecureHeaders = () => ({
    headers: { Authorization: `Bearer ${userInfo?.token}` }
  });

  // Filter products dynamically based on search string matching title or category
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authorization View Sync Gatekeeper
  const switchToAdminView = async () => {
    if (!userInfo || !userInfo.isAdmin) {
      setIsRegisterMode(false);
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView('admin');
    setAdminLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/orders', getSecureHeaders());
      setAdminData(data);
      setAdminLoading(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Access Forbidden');
      setAdminLoading(false);
      setCurrentView('shop');
    }
  };

  // Session Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = 'http://localhost:5000/api/users/login';
      let payload = { email: authForm.email, password: authForm.password };

      if (isRegisterMode) {
        url = 'http://localhost:5000/api/users';
        payload = { 
          name: authForm.name, 
          email: authForm.email, 
          password: authForm.password,
          isAdmin: authForm.secretAdminCode === 'ADMIN123' 
        };
      }

      const { data } = await axios.post(url, payload);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUserInfo(data);
      setIsAuthModalOpen(false);
      setAuthForm({ name: '', email: '', password: '', secretAdminCode: '' });
      alert(`Welcome back, ${data.name}!`);
      
      if (data.isAdmin) {
        setCurrentView('admin');
        const orderRes = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        setAdminData(orderRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    setCurrentView('shop');
    alert('Logged out securely.');
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setNewProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image || '',
      category: product.category,
      countInStock: product.countInStock
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEditMode = () => {
    setEditingProductId(null);
    setNewProduct({ name: '', price: '', description: '', image: '', category: 'Electronics', countInStock: '' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editingProductId) {
      try {
        await axios.put(`http://localhost:5000/api/products/${editingProductId}`, newProduct, getSecureHeaders());
        alert('Product mutations updated inside database records successfully.');
        cancelEditMode();
        syncCatalog();
      } catch (err) {
        alert('Update Blocked: ' + (err.response?.data?.message || err.message));
      }
    } else {
      try {
        await axios.post('http://localhost:5000/api/products', newProduct, getSecureHeaders());
        alert('Product created inside database clusters.');
        setNewProduct({ name: '', price: '', description: '', image: '', category: 'Electronics', countInStock: '' });
        syncCatalog();
      } catch (err) {
        alert('Write Blocked: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, getSecureHeaders());
      alert('Item extracted.');
      if (editingProductId === id) cancelEditMode();
      syncCatalog();
    } catch (err) {
      alert('Deletion Blocked: ' + (err.response?.data?.message || err.message));
    }
  };

  const addToCart = (product) => {
    const exist = cart.find((item) => item._id === product._id);
    if (exist) {
      if (exist.qty >= product.countInStock) return alert('Cannot exceed warehouse stock restrictions.');
      setCart(cart.map((item) => item._id === product._id ? { ...exist, qty: exist.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const decreaseQty = (product) => {
    const exist = cart.find((item) => item._id === product._id);
    if (exist.qty === 1) {
      setCart(cart.filter((item) => item._id !== product._id));
    } else {
      setCart(cart.map((item) => item._id === product._id ? { ...exist, qty: exist.qty - 1 } : item));
    }
  };

  const handleCheckout = async () => {
    try {
      const orderData = {
        orderItems: cart.map(item => ({ name: item.name, qty: item.qty, image: item.image, price: item.price, product: item._id })),
        totalPrice: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
        paymentMethod: paymentMethod 
      };
      await axios.post('http://localhost:5000/api/orders', orderData);
      alert(`Order placed successfully using ${paymentMethod}!`);
      setCart([]);
      setIsCartOpen(false);
      syncCatalog();
    } catch (err) {
      alert('Checkout Failed: ' + err.message);
    }
  };

  if (loading) return <div style={styles.centerText}>Loading store clusters...</div>;
  if (error) return <div style={{ ...styles.centerText, color: '#f87171' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{...styles.logoGroup, cursor: 'pointer'}} onClick={() => setCurrentView('shop')}>
            <Store size={26} color="#38bdf8" />
            <h1 style={styles.logoText}>Selam Digital Hub</h1>
          </div>
          
          <div style={styles.navActions}>
            {userInfo?.isAdmin && currentView === 'admin' ? (
              <button style={styles.adminToggleBtn} onClick={() => { setCurrentView('shop'); cancelEditMode(); }}>
                <Store size={18} /> View Storefront
              </button>
            ) : (
              <button style={styles.adminToggleBtn} onClick={switchToAdminView}>
                <ShieldCheck size={18} /> Admin Panel
              </button>
            )}

            {userInfo ? (
              <button style={{...styles.adminToggleBtn, backgroundColor:'#7f1d1d', borderColor:'#b91c1c'}} onClick={handleLogout}>
                <LogOut size={16} /> Logout ({userInfo.name})
              </button>
            ) : (
              <button style={{...styles.adminToggleBtn, backgroundColor:'#1e3a8a'}} onClick={() => { setIsRegisterMode(false); setIsAuthModalOpen(true); }}>
                <LogIn size={16} /> Login
              </button>
            )}

            {currentView === 'shop' && (
              <button style={styles.cartBadgeButton} onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={22} />
                <span style={styles.badgeCount}>{cart.reduce((acc, item) => acc + item.qty, 0)}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main style={styles.mainContent}>
        {currentView === 'shop' ? (
          <>
            <div style={styles.heroSection}>
              <h2 style={styles.sectionTitle}>Featured Collections</h2>
              <p style={styles.sectionSubtitle}>Discover elite gadgets and lifestyle hardware curated just for you.</p>
              
              <div style={styles.searchContainer}>
                <Search size={18} color="#64748b" style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search via product title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>
                No match parameter found inside catalog clusters.
              </div>
            ) : (
              <div style={styles.grid}>
                {filteredProducts.map((product) => (
                  <div key={product._id} style={styles.card}>
                    <div style={styles.imageContainer}>
                      <img src={product.image} alt={product.name} style={styles.image} />
                      <span style={styles.floatingCategory}>{product.category}</span>
                    </div>
                    <div style={styles.cardBody}>
                      <h3 style={styles.prodName}>{product.name}</h3>
                      <p style={styles.prodDesc}>{product.description}</p>
                      <div style={styles.priceRow}>
                        <span style={styles.prodPrice}>${product.price.toFixed(2)}</span>
                        <span style={product.countInStock > 0 ? styles.stockTag : styles.outTag}>
                          {product.countInStock > 0 ? `${product.countInStock} Left` : 'Out of Stock'}
                        </span>
                      </div>
                      <button style={{...styles.addBtn, opacity: product.countInStock === 0 ? 0.5 : 1}} disabled={product.countInStock === 0} onClick={() => addToCart(product)}>
                        {product.countInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={styles.adminContainer}>
            <div style={styles.adminHeader}>
              <BarChart3 size={32} color="#818cf8" />
              <div>
                <h2 style={styles.adminTitle}>Executive Order Ledger</h2>
                <p style={styles.adminSubtitle}>Real-time system monitoring of checkout activity and fiscal metrics.</p>
              </div>
            </div>

            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Gross Total Revenue</span>
                <span style={{...styles.metricValue, color: '#10b981'}}>${adminData.totalRevenue.toFixed(2)}</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Total Invoices Processed</span>
                <span style={styles.metricValue}>{adminData.totalSalesCount} Orders</span>
              </div>
            </div>

            <div style={{...styles.formSection, borderColor: editingProductId ? '#38bdf8' : '#1f2937'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <PackagePlus size={22} color={editingProductId ? "#38bdf8" : "#818cf8"} />
                  <h3 style={{margin:0, fontSize:'1.2rem'}}>
                    {editingProductId ? `Modify Product Profile (ID: ${editingProductId.substring(0,6)}...)` : 'Add New Product to Catalog'}
                  </h3>
                </div>
                {editingProductId && (
                  <button type="button" onClick={cancelEditMode} style={styles.cancelBtn}>Cancel Alteration</button>
                )}
              </div>
              <form onSubmit={handleFormSubmit} style={styles.formGrid}>
                <input type="text" placeholder="Product Name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={styles.input}/>
                <input type="number" step="0.01" placeholder="Price ($)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} style={styles.input}/>
                <input type="text" placeholder="Image URL (Optional)" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} style={styles.input}/>
                <input type="number" placeholder="Stock Quantity" required value={newProduct.countInStock} onChange={e => setNewProduct({...newProduct, countInStock: Number(e.target.value)})} style={styles.input}/>
                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={styles.input}>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Office">Office</option>
                </select>
                <input type="text" placeholder="Brief Description" required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={styles.input}/>
                <button type="submit" style={{...styles.submitBtn, backgroundColor: editingProductId ? '#10b981' : '#38bdf8'}}>
                  {editingProductId ? 'Save Product Variations' : 'Add Item to Stock'}
                </button>
              </form>
            </div>

            <h3 style={styles.tableSectionTitle}>Active Catalog Inventory ({products.length})</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Item Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Stock Available</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: '500'}}>{product.name}</td>
                      <td style={styles.td}><span style={{color: '#38bdf8'}}>{product.category}</span></td>
                      <td style={{...styles.td, color: '#10b981'}}>${product.price.toFixed(2)}</td>
                      <td style={styles.td}>{product.countInStock} units</td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button style={styles.editActionBtn} onClick={() => startEditProduct(product)}>
                            <Edit size={14} /> Edit
                          </button>
                          <button style={styles.deleteActionBtn} onClick={() => handleDeleteProduct(product._id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {isAuthModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBody}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0}}>{isRegisterMode ? 'Create Security Access Account' : 'Gateway Verification'}</h3>
              <X size={20} onClick={() => setIsAuthModalOpen(false)} style={{cursor:'pointer'}}/>
            </div>
            <form onSubmit={handleAuthSubmit} autoComplete="off" style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1rem'}}>
              {isRegisterMode && <input type="text" placeholder="Full Name" required style={styles.input} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})}/>}
              
              <input type="email" placeholder="Email Address" required autoComplete="new-email" style={styles.input} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}/>
              <input type="password" placeholder="Password" required autoComplete="new-password" style={styles.input} value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}/>
              
              {isRegisterMode && <input type="password" placeholder="Secret Admin Key" autoComplete="new-password" style={styles.input} value={authForm.secretAdminCode} onChange={e => setAuthForm({...authForm, secretAdminCode: e.target.value})}/>}
              
              <button type="submit" style={styles.submitBtn}>{isRegisterMode ? 'Register Account' : 'Authenticate Credentials'}</button>
              <span onClick={() => setIsRegisterMode(!isRegisterMode)} style={{fontSize:'0.8rem', textAlign:'center', color:'#38bdf8', cursor:'pointer'}}>
                {isRegisterMode ? 'Have an account? Login here' : 'Need an executive profile? Register here'}
              </span>
            </form>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div style={styles.cartOverlay}>
          <div style={styles.cartSidebar}>
            <div style={styles.cartHeader}>
              <h3 style={styles.cartTitle}>Your Shopping Cart</h3>
              <button style={styles.closeBtn} onClick={() => setIsCartOpen(false)}><X size={24} /></button>
            </div>
            <div style={styles.cartItemsList}>
              {cart.length === 0 ? <div style={styles.emptyCartMessage}>Cart is empty.</div> : 
                cart.map((item) => (
                  <div key={item._id} style={styles.cartItemRow}>
                    <img src={item.image} alt={item.name} style={styles.cartItemThumb} />
                    <div style={styles.cartItemDetails}>
                      <h4 style={styles.cartItemName}>{item.name}</h4>
                      <span style={styles.cartItemPrice}>${item.price.toFixed(2)}</span>
                      <div style={styles.quantityControls}>
                        <button style={styles.qtyAction} onClick={() => decreaseQty(item)}><Minus size={14} /></button>
                        <span style={styles.qtyNum}>{item.qty}</span>
                        <button style={styles.qtyAction} onClick={() => addToCart(item)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              }

              {cart.length > 0 && (
                <div style={styles.paymentSection}>
                  <div style={styles.paymentTitleRow}>
                    <CreditCard size={16} color="#38bdf8" />
                    <span style={styles.paymentLabel}>Payment Gateway Method</span>
                  </div>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={styles.paymentSelect}
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Telebirr">Telebirr Wallet</option>
                    <option value="CBE Birr">CBE Birr</option>
                  </select>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div style={styles.cartFooter}>
                <button style={styles.checkoutBtn} onClick={handleCheckout}>Proceed to Secure Checkout</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f1f5f9', fontFamily: '"Inter", sans-serif' },
  navbar: { position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b' },
  navContent: { maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  logoText: { fontSize: '1.35rem', fontWeight: '700', margin: 0, background: 'linear-gradient(to right, #38bdf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navActions: { display: 'flex', alignItems: 'center', gap: '1rem' },
  adminToggleBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  cartBadgeButton: { position: 'relative', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  badgeCount: { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.7rem', fontWeight: '700', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  mainContent: { maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' },
  heroSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '3.5rem' },
  sectionTitle: { fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem' },
  sectionSubtitle: { color: '#94a3b8', fontSize: '1.05rem', marginBottom: '1.5rem' },
  searchContainer: { position: 'relative', width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '1rem' },
  searchInput: { width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', color: '#f1f5f9', outline: 'none', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' },
  card: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  imageContainer: { position: 'relative', height: '220px', width: '100%' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  floatingCategory: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', color: '#38bdf8' },
  cardBody: { padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.85rem' },
  prodName: { fontSize: '1.15rem', fontWeight: '600', margin: 0 },
  prodDesc: { color: '#94a3b8', fontSize: '0.875rem' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prodPrice: { fontSize: '1.35rem', fontWeight: '700', color: '#10b981' },
  stockTag: { fontSize: '0.75rem', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' },
  outTag: { fontSize: '0.75rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' },
  addBtn: { width: '100%', border: 'none', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer' },
  adminContainer: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  adminHeader: { display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' },
  adminTitle: { fontSize: '1.75rem', fontWeight: '800', margin: 0 },
  adminSubtitle: { color: '#94a3b8', fontSize: '0.95rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  metricCard: { backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column' },
  metricLabel: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' },
  metricValue: { fontSize: '2rem', fontWeight: '800' },
  formSection: { backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '12px', transition: 'border-color 0.2s ease-in-out' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  input: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', padding: '0.65rem', borderRadius: '6px' },
  submitBtn: { border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '700', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' },
  cancelBtn: { border: '1px solid #475569', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer' },
  tableSectionTitle: { fontSize: '1.25rem', fontWeight: '700', margin: '1rem 0 0 0' },
  tableWrapper: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#1f2937' },
  th: { padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #1f2937' },
  td: { padding: '1rem', fontSize: '0.9rem' },
  editActionBtn: { border: '1px solid #1e3a8a', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  deleteActionBtn: { border: '1px solid #7f1d1d', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  modalBody: { backgroundColor: '#111827', border: '1px solid #1f2937', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cartOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' },
  cartSidebar: { width: '420px', backgroundColor: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column' },
  cartHeader: { padding: '1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' },
  cartItemsList: { flexGrow: 1, padding: '1.5rem', overflowY: 'auto' },
  cartItemRow: { display: 'flex', gap: '1rem', backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' },
  cartItemThumb: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' },
  cartItemDetails: { flexGrow: 1 },
  quantityControls: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' },
  qtyAction: { backgroundColor: '#334155', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' },
  paymentSection: { borderTop: '1px solid #1e293b', paddingTop: '1.5rem', marginTop: '1rem' },
  paymentTitleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  paymentLabel: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' },
  paymentSelect: { width: '100%', padding: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9' },
  cartFooter: { padding: '1.5rem', borderTop: '1px solid #1e293b' },
  checkoutBtn: { width: '100%', padding: '0.75rem', backgroundColor: '#10b981', border: 'none', color: 'white', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' },
  centerText: { minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  emptyCartMessage: { textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }
};

export default App;