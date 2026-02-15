'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const success = searchParams.get('success');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', backgroundColor: '#f8fafc' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>Sign In</h1>
                <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem' }}>Enter your credentials to manage your store.</p>

                {success === 'registration' && (
                    <div style={{ color: '#10b981', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Registration successful! Please sign in to continue.
                    </div>
                )}

                {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #fee2e2' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="manager@store.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                    Don&apos;t have an account? <Link href="/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Create one</Link>
                </p>
            </div>
        </div>
    );
}
