'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Shield, ArrowLeft, Save, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    // Profile Form
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    // Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length === 0) return { score: 0, label: '', color: 'transparent' };
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[@$!%*?&]/.test(pass)) score++;

        if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
        if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
        if (score <= 4) return { score, label: 'Good', color: '#10b981' };
        return { score, label: 'Strong', color: '#34d399' };
    };

    const strength = getPasswordStrength(newPassword);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setUsername(data.username);
                setEmail(data.email);
            } else if (res.status === 401) {
                router.push('/login');
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Password change failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>Loading...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <Link href={user?.role === 'admin' ? '/dashboard' : '/shop'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
                        <ArrowLeft size={20} />
                        <span>Back to {user?.role === 'admin' ? 'Dashboard' : 'Shop'}</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield style={{ color: '#38bdf8' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Account Settings</h1>
                    </div>
                </div>

                {message && (
                    <div className="animate-fade-in" style={{ backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: message.type === 'success' ? '#34d399' : '#f87171' }}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span style={{ fontSize: '0.925rem', fontWeight: '500' }}>{message.text}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {/* Profile Section */}
                    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(16px)', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '1rem', backgroundColor: '#38bdf8', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0f172a' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Personal Information</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Update your account identifiers.</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateProfile} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(16px)', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '1rem', backgroundColor: '#818cf8', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0f172a' }}>
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Security</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Update your password to keep your account safe.</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleChangePassword} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                    {newPassword && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8' }}>Password Strength: <span style={{ color: strength.color }}>{strength.label}</span></span>
                                            </div>
                                            <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                {[
                                                    { label: '8+ Characters', met: newPassword.length >= 8 },
                                                    { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
                                                    { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
                                                    { label: 'Number', met: /[0-9]/.test(newPassword) },
                                                    { label: 'Special Char (@$!%*?&)', met: /[@$!%*?&]/.test(newPassword) }
                                                ].map((req, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: req.met ? '#34d399' : '#64748b' }}>
                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: req.met ? '#34d399' : '#475569' }} />
                                                        {req.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1' }}>Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving || strength.score < 5}
                                style={{
                                    alignSelf: 'flex-start',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: strength.score < 5 ? '#475569' : '#818cf8',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: '700',
                                    cursor: strength.score < 5 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: strength.score < 5 ? 0.6 : 1
                                }}
                            >
                                <Lock size={18} />
                                {saving ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
