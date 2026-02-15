'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, Plus, Edit2, LogOut, Users, Trash2, CheckCircle2, Truck, Clock, AlertCircle, Terminal, User } from 'lucide-react';

interface Product {
    id: number;
    user_id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
}

interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
}

interface Order {
    id: number;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: OrderItem[];
}

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

interface ActivityLog {
    id: number;
    user_id: number;
    action: string;
    details: string;
    ip_address: string;
    mac_address: string;
    user_agent: string;
    created_at: string;
    username: string;
    email: string;
}

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'users' | 'logs'>('inventory');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'Training',
        image: ''
    });

    // Filtering & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [orderUserFilter, setOrderUserFilter] = useState('');
    const [orderItemFilter, setOrderItemFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('All');
    const [userStatusFilter, setUserStatusFilter] = useState('All');
    const [logActionFilter, setLogActionFilter] = useState('All');
    const [logUserFilter, setLogUserFilter] = useState('');
    const [logDateStart, setLogDateStart] = useState('');
    const [logDateEnd, setLogDateEnd] = useState('');
    const [logDeviceFilter, setLogDeviceFilter] = useState('');
    const [showAllLogs, setShowAllLogs] = useState(false);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const router = useRouter();

    useEffect(() => {
        setSearchQuery('');
        setShowAllLogs(false);
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'inventory') {
                const res = await fetch('/api/products');
                if (res.ok) setProducts(await res.json());
                else if (res.status === 401) router.push('/login');
            } else if (activeTab === 'orders') {
                const res = await fetch('/api/orders');
                if (res.ok) setOrders(await res.json());
                else if (res.status === 401) router.push('/login');

                // Also fetch products for the Item filter dropdown
                const pRes = await fetch('/api/products');
                if (pRes.ok) setProducts(await pRes.json());
            } else if (activeTab === 'users') {
                const res = await fetch('/api/users');
                if (res.ok) setUsers(await res.json());
                else if (res.status === 401) router.push('/login');
            } else if (activeTab === 'logs') {
                const res = await fetch('/api/logs');
                if (res.ok) setLogs(await res.json());
                else if (res.status === 401) router.push('/login');
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtered Data Logic
    const filteredOrders = orders.filter(order => {
        const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
        const matchesUser = !orderUserFilter ||
            order.customer_name.toLowerCase().includes(orderUserFilter.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(orderUserFilter.toLowerCase());
        const matchesItem = !orderItemFilter ||
            order.items.some(item => (item.name || 'Deleted Product').toLowerCase().includes(orderItemFilter.toLowerCase()));

        const matchesSearch = !searchQuery ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toString().includes(searchQuery);

        return matchesStatus && matchesUser && matchesItem && matchesSearch;
    });

    const filteredUsers = users.filter(user => {
        const mappedRole = userRoleFilter === 'Customer' ? 'user' : userRoleFilter.toLowerCase();
        const matchesRole = userRoleFilter === 'All' || user.role === mappedRole;
        const matchesStatus = userStatusFilter === 'All' || user.status === userStatusFilter.toLowerCase();

        const matchesSearch = !searchQuery ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesRole && matchesStatus && matchesSearch;
    });

    const filteredLogs = logs.filter(log => {
        const matchesAction = logActionFilter === 'All' || log.action === logActionFilter;

        const matchesUser = !logUserFilter ||
            (log.username && log.username.toLowerCase().includes(logUserFilter.toLowerCase())) ||
            (log.email && log.email.toLowerCase().includes(logUserFilter.toLowerCase()));

        const logDate = new Date(log.created_at);
        const matchesDate = (!logDateStart || logDate >= new Date(logDateStart)) &&
            (!logDateEnd || logDate <= new Date(logDateEnd + 'T23:59:59'));

        const matchesDevice = !logDeviceFilter ||
            log.ip_address.includes(logDeviceFilter) ||
            (log.mac_address && log.mac_address.toLowerCase().includes(logDeviceFilter.toLowerCase())) ||
            (log.user_agent && log.user_agent.toLowerCase().includes(logDeviceFilter.toLowerCase()));

        const matchesSearch = !searchQuery ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.username && log.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            log.ip_address.includes(searchQuery);

        return matchesAction && matchesUser && matchesDate && matchesDevice && matchesSearch;
    });

    const displayedLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 10);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductForm({ ...productForm, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productForm),
            });

            if (res.ok) {
                fetchData();
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({ name: '', description: '', price: 0, stock: 0, category: 'Training', image: '' } as any);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save product');
            }
        } catch (err) {
            console.error('Product submit error:', err);
            alert('An error occurred while saving the product');
        }
    };

    const deleteProduct = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to remove this product from the catalog? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        fetchData();
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Failed to delete product');
                    }
                } catch (err) {
                    console.error('Delete product error:', err);
                }
            }
        });
    };

    const updateOrderStatus = (orderId: number, newStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Update Order Status',
            message: `Are you sure you want to change the status of Order #${orderId} to ${newStatus}?`,
            type: 'info',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/orders/${orderId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    if (res.ok) {
                        fetchData();
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Failed to update order status');
                        fetchData(); // Refresh to original status
                    }
                } catch (err) {
                    console.error('Update order status error:', err);
                    alert('An error occurred while updating the order');
                    fetchData();
                }
            }
        });
    };

    const deleteOrder = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Order',
            message: `Are you sure you want to permanently delete Order #${id}? This will remove all associated records.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        fetchData();
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Failed to delete order');
                    }
                } catch (err) {
                    console.error('Delete order error:', err);
                }
            }
        });
    };

    const toggleUserStatus = (user: User) => {
        const newStatus = user.status === 'active' ? 'deactivated' : 'active';
        setConfirmModal({
            isOpen: true,
            title: newStatus === 'deactivated' ? 'Deactivate Account' : 'Activate Account',
            message: `Are you sure you want to ${newStatus} the account for ${user.username}?`,
            type: newStatus === 'deactivated' ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/users`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: user.id, status: newStatus }),
                    });
                    if (res.ok) {
                        fetchData();
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Failed to update user status');
                    }
                } catch (err) {
                    console.error('Toggle user status error:', err);
                }
            }
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return { bg: '#fef3c7', text: '#92400e' };
            case 'Processing': return { bg: '#e0e7ff', text: '#3730a3' };
            case 'Shipped': return { bg: '#dcfce7', text: '#166534' };
            case 'Delivered': return { bg: '#f0fdf4', text: '#15803d' };
            case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', color: '#0f172a' }}>Store Administration</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage products, analyze sales, and control users.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                    >
                        <Plus size={18} /> New Product
                    </button>
                    <Link href="/profile" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                        <User size={18} /> Profile
                    </Link>
                    <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('inventory')}
                    style={{
                        padding: '0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: activeTab === 'inventory' ? '#2563eb' : '#64748b',
                        borderBottom: activeTab === 'inventory' ? '2px solid #2563eb' : '2px solid transparent'
                    }}
                >
                    <Package size={18} /> Inventory
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: activeTab === 'orders' ? '#2563eb' : '#64748b',
                        borderBottom: activeTab === 'orders' ? '2px solid #2563eb' : '2px solid transparent'
                    }}
                >
                    <ShoppingCart size={18} /> Orders
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: activeTab === 'users' ? '#2563eb' : '#64748b',
                        borderBottom: activeTab === 'users' ? '2px solid #2563eb' : '2px solid transparent'
                    }}
                >
                    <Users size={18} /> Users
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: activeTab === 'logs' ? '#2563eb' : '#64748b',
                        borderBottom: activeTab === 'logs' ? '2px solid #2563eb' : '2px solid transparent'
                    }}
                >
                    <Terminal size={18} /> Logs
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'inventory' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>Loading Inventory...</div>
                    ) : products.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
                            <Package size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                            <p style={{ color: '#64748b' }}>No products in your catalog yet.</p>
                        </div>
                    ) : products.map(product => (
                        <div key={product.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                            <div style={{ height: '180px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Package size={48} color="#cbd5e1" />
                                )}
                                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.9)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#1e293b', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>{product.category}</span>
                                </div>
                                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductModal(true); }} style={{ backgroundColor: 'white', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '0.4rem', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><Edit2 size={14} /></button>
                                    <button onClick={() => deleteProduct(product.id)} style={{ backgroundColor: 'white', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.4rem', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', flex: 1 }}>{product.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>${product.price}</span></div>
                                    <div style={{ textAlign: 'right' }}><span style={{ fontSize: '0.75rem', color: product.stock > 10 ? '#10b981' : '#f59e0b', fontWeight: '600' }}>{product.stock} in stock</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'orders' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: '160px', padding: '0.4rem' }}
                                value={orderStatusFilter}
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Customer</label>
                            <input
                                type="text"
                                placeholder="Filter by user..."
                                className="input-field"
                                style={{ maxWidth: '160px', padding: '0.4rem' }}
                                value={orderUserFilter}
                                onChange={(e) => setOrderUserFilter(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Item</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: '160px', padding: '0.4rem' }}
                                value={orderItemFilter}
                                onChange={(e) => setOrderItemFilter(e.target.value)}
                            >
                                <option value="All">All Items</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                                <option value="Deleted Product">Deleted Product</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Global Search..."
                                className="input-field"
                                style={{ padding: '0.4rem' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Order ID</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Customer</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Items</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Total</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading Orders...</td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No orders found.</td></tr>
                                ) : filteredOrders.map(order => {
                                    const style = getStatusStyle(order.status);
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>#{order.id}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{order.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.customer_email}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {order.items.map(item => `${item.name || 'Deleted Product'} (x${item.quantity})`).join(', ')}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>${order.total_amount}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', backgroundColor: style.bg, color: style.text, padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>{order.status}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', marginRight: '0.5rem' }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    onClick={() => deleteOrder(order.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        verticalAlign: 'middle'
                                                    }}
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'users' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Role</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: '160px', padding: '0.4rem' }}
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                            >
                                <option value="All">All Roles</option>
                                <option value="Admin">Admin</option>
                                <option value="Customer">Customer</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: '160px', padding: '0.4rem' }}
                                value={userStatusFilter}
                                onChange={(e) => setUserStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Deactivated">Deactivated</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="input-field"
                                style={{ padding: '0.4rem' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Username</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Email</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Role</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Created At</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading Users...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No users found.</td></tr>
                                ) : filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>{user.username}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', backgroundColor: user.role === 'admin' ? '#dcfce7' : '#f1f5f9', color: user.role === 'admin' ? '#166534' : '#475569', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: '600' }}>{user.role}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                backgroundColor: user.status === 'active' ? '#dcfce7' : '#fee2e2',
                                                color: user.status === 'active' ? '#166534' : '#991b1b',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => toggleUserStatus(user)}
                                                style={{
                                                    backgroundColor: user.status === 'active' ? '#f0fdf4' : '#fff1f2',
                                                    color: user.status === 'active' ? '#16a34a' : '#e11d48',
                                                    border: '1px solid currentColor',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                }}
                                                onMouseEnter={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = user.status === 'active' ? '#dcfce7' : '#ffe4e6';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = user.status === 'active' ? '#f0fdf4' : '#fff1f2';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {user.status === 'active' ? (
                                                    <><CheckCircle2 size={14} /> Active</>
                                                ) : (
                                                    <><Clock size={14} /> Deactivated</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Action Type</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: '150px', padding: '0.4rem' }}
                                value={logActionFilter}
                                onChange={(e) => setLogActionFilter(e.target.value)}
                            >
                                <option value="All">All Actions</option>
                                <option value="LOGIN">Login</option>
                                <option value="CREATE_PRODUCT">Create Product</option>
                                <option value="UPDATE_PRODUCT">Update Product</option>
                                <option value="DELETE_PRODUCT">Delete Product</option>
                                <option value="ACTIVATE_USER">Activate User</option>
                                <option value="DEACTIVATE_USER">Deactivate User</option>
                                <option value="DELETE_ORDER">Delete Order</option>
                                <option value="LOGIN_DEACTIVATED">Blocked Login</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>User</label>
                            <input
                                type="text"
                                placeholder="Email/Username..."
                                className="input-field"
                                style={{ maxWidth: '150px', padding: '0.4rem' }}
                                value={logUserFilter}
                                onChange={(e) => setLogUserFilter(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Start Date</label>
                            <input
                                type="date"
                                className="input-field"
                                style={{ maxWidth: '140px', padding: '0.4rem' }}
                                value={logDateStart}
                                onChange={(e) => setLogDateStart(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>End Date</label>
                            <input
                                type="date"
                                className="input-field"
                                style={{ maxWidth: '140px', padding: '0.4rem' }}
                                value={logDateEnd}
                                onChange={(e) => setLogDateEnd(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Device Info / Search</label>
                            <input
                                type="text"
                                placeholder="IP/MAC/UA or details..."
                                className="input-field"
                                style={{ padding: '0.4rem' }}
                                value={logDeviceFilter}
                                onChange={(e) => setLogDeviceFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Time</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>User</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Action</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Details</th>
                                    <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Device Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading Logs...</td></tr>
                                ) : displayedLogs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>No activity logs yet.</td></tr>
                                ) : displayedLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{log.username || 'Guest'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.email || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                color: log.action.includes('FAIL') || log.action.includes('DELETE') ? '#ef4444' : '#2563eb'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{log.details}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>IP: {log.ip_address}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb' }}>MAC: {log.mac_address}</div>
                                            <div style={{ fontSize: '0.625rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_agent}>
                                                {log.user_agent}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!showAllLogs && filteredLogs.length > 10 && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                onClick={() => setShowAllLogs(true)}
                                className="btn-outline"
                                style={{ fontSize: '0.875rem' }}
                            >
                                Show All {filteredLogs.length} Logs
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Product Name</label>
                                <input className="input-field" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Description</label>
                                <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Price ($)</label>
                                    <input type="number" step="0.01" className="input-field" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Stock</label>
                                    <input type="number" className="input-field" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Product Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', border: '2px dashed #e2e8f0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                                        {productForm.image ? (
                                            <img src={productForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Plus size={24} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ fontSize: '0.875rem' }}
                                        />
                                        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>JPG, PNG or GIF. Max 5MB.</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowProductModal(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingProduct ? 'Save Changes' : 'Add Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="card animate-scale-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: confirmModal.type === 'danger' ? '#fee2e2' : confirmModal.type === 'warning' ? '#fef3c7' : '#e0e7ff',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '0 auto 1.5rem',
                            color: confirmModal.type === 'danger' ? '#ef4444' : confirmModal.type === 'warning' ? '#f59e0b' : '#2563eb'
                        }}>
                            {confirmModal.type === 'danger' ? <Trash2 size={24} /> : confirmModal.type === 'warning' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: '#0f172a' }}>{confirmModal.title}</h2>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '2rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="btn-outline"
                                style={{ flex: 1, padding: '0.75rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: confirmModal.type === 'danger' ? '#ef4444' : confirmModal.type === 'warning' ? '#f59e0b' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
