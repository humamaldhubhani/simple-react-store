'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ShoppingCart, LogOut, Package, CheckCircle2, Trash2, Plus, Minus, User } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
}

export default function Shop() {
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [user, setUser] = useState<{ username: string, email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [checkedOut, setCheckedOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchProducts();
        fetchUser();
        fetchOrders();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) setUser(await res.json());
        } catch (err) {
            console.error('Fetch user error:', err);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) setOrders(await res.json());
        } catch (err) {
            console.error('Fetch orders error:', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) setProducts(await res.json());
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const logClientAction = async (action: string, details: string) => {
        try {
            await fetch('/api/logs/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, details })
            });
        } catch (err) {
            console.error('Client logging failed:', err);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        logClientAction('ADD_TO_CART', `Added ${product.name} to cart`);
        setShowCart(true);
    };

    const removeFromCart = (productId: number) => {
        const item = cart.find(i => i.product.id === productId);
        setCart(prev => prev.filter(item => item.product.id !== productId));
        if (item) {
            logClientAction('REMOVE_FROM_CART', `Removed ${item.product.name} from cart`);
        }
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setError(null);

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: user?.username || 'Guest',
                    customer_email: user?.email || '',
                    items: cart.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity,
                        unit_price: item.product.price
                    }))
                })
            });

            if (res.ok) {
                setCheckedOut(true);
                setCart([]);
                setTimeout(() => {
                    setCheckedOut(false);
                    setShowCart(false);
                    fetchProducts(); // Refresh stock levels
                    fetchOrders(); // Refresh order history
                }, 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Checkout failed. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('An error occurred during checkout. Please check your connection.');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShoppingBag style={{ color: '#2563eb' }} />
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Athletic Store</h1>
                    </div>

                    <nav style={{ display: 'flex', gap: '1.5rem' }}>
                        <button
                            onClick={() => setActiveTab('products')}
                            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: activeTab === 'products' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'products' ? '2px solid #2563eb' : '2px solid transparent' }}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: activeTab === 'orders' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'orders' ? '2px solid #2563eb' : '2px solid transparent' }}
                        >
                            My Orders
                        </button>
                    </nav>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowCart(!showCart)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
                    >
                        <ShoppingCart size={24} color="#475569" />
                        {cart.length > 0 && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#2563eb', color: 'white', fontSize: '0.625rem', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {user && <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Hi, {user.username}</span>}
                        <Link href="/profile" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                            <User size={18} /> Profile
                        </Link>
                        <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {activeTab === 'products' ? (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem' }}>New Arrivals</h2>
                            <p style={{ color: '#64748b' }}>High-performance gear for your next workout.</p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading shop items...</div>
                        ) : products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                <Package size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                <p style={{ color: '#64748b' }}>The shop is being restocked. Check back later!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
                                {products.map(product => (
                                    <div key={product.id} className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                                        <div style={{ height: '240px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                                            ) : (
                                                <ShoppingBag size={64} color="#cbd5e1" />
                                            )}
                                            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.01em', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)' }}>{product.category}</span>
                                            </div>
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#fff7ed', color: '#ea580c', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #ffedd5', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)' }}>Only {product.stock} Left!</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: '#0f172a' }}>{product.name}</h3>
                                            <p style={{ fontSize: '0.925rem', color: '#475569', marginBottom: '1.5rem', flex: 1, lineHeight: '1.6' }}>{product.description}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>${product.price}</span>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className={product.stock > 0 ? "btn-primary" : "btn-outline"}
                                                    disabled={product.stock <= 0}
                                                    style={{
                                                        padding: '0.75rem 1.25rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '700',
                                                        borderRadius: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        boxShadow: product.stock > 0 ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none'
                                                    }}
                                                >
                                                    {product.stock > 0 ? (
                                                        <>
                                                            <Plus size={18} /> Add to Cart
                                                        </>
                                                    ) : 'Out of Stock'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.5rem' }}>My Orders</h2>
                            <p style={{ color: '#64748b' }}>Track your purchase status and history.</p>
                        </div>

                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                <Package size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                <p style={{ color: '#64748b' }}>You haven't placed any orders yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {orders.map(order => (
                                    <div key={order.id} className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Order #{order.id}</h3>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                backgroundColor: order.status === 'Shipped' || order.status === 'Delivered' ? '#dcfce7' : '#fef3c7',
                                                color: order.status === 'Shipped' || order.status === 'Delivered' ? '#166534' : '#92400e'
                                            }}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                            {order.items.map((item: any) => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                    <span>{item.name} <span style={{ color: '#64748b' }}>× {item.quantity}</span></span>
                                                    <span>${item.unit_price * item.quantity}</span>
                                                </div>
                                            ))}
                                            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                                <span>Total</span>
                                                <span>${order.total_amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Cart Sidebar */}
            {showCart && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={() => setShowCart(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                    <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', position: 'relative', height: '100%', boxShadow: '-4px 0 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Your Cart</h2>
                            <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Your cart is empty</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {cart.map(item => (
                                        <div key={item.product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Package size={24} color="#94a3b8" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>{item.product.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}><Minus size={12} /></button>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}><Plus size={12} /></button>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>${(item.product.price * item.quantity).toFixed(2)}</div>
                                                <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div style={{ margin: '0 1.5rem 1.5rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem', fontWeight: '500' }}>
                                {error}
                            </div>
                        )}

                        {cart.length > 0 && (
                            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.125rem' }}>
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '1rem' }}
                                    disabled={checkedOut}
                                >
                                    {checkedOut ? 'Order Placed!' : 'Complete Purchase'}
                                </button>
                            </div>
                        )}

                        {checkedOut && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
                                <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Thank You!</h3>
                                <p style={{ color: '#64748b' }}>Your order has been placed successfully.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
