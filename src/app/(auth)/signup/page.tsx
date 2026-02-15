'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PASSWORD_REGEX } from '@/lib/security';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (strength.score < 5) {
            setError('Please use a stronger password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, confirmPassword }),
            });

            if (res.ok) {
                router.push('/login?success=registration');
            } else {
                const data = await res.json();
                setError(data.message || 'Signup failed');
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
                <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>Create Account</h1>
                <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem' }}>Join the athletic store network.</p>

                {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #fee2e2' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="johndoe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="john@example.com"
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
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            required
                        />
                        {password && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Strength: <span style={{ color: strength.color }}>{strength.label}</span></span>
                                </div>
                                <div style={{ height: '4px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.75rem' }}>
                                    {[
                                        { label: '8+ Characters', met: password.length >= 8 },
                                        { label: 'Uppercase', met: /[A-Z]/.test(password) },
                                        { label: 'Lowercase', met: /[a-z]/.test(password) },
                                        { label: 'Number', met: /[0-9]/.test(password) },
                                        { label: 'Special Char (@$!%*?&)', met: /[@$!%*?&]/.test(password) }
                                    ].map((req, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.625rem', color: req.met ? '#10b981' : '#94a3b8' }}>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: req.met ? '#10b981' : '#cbd5e1' }} />
                                            {req.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <span style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: '600' }}>Passwords do not match</span>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || (password !== confirmPassword && confirmPassword !== '') || (password !== '' && strength.score < 5)}
                        style={{
                            marginTop: '0.5rem',
                            opacity: (loading || (password !== confirmPassword && confirmPassword !== '') || (password !== '' && strength.score < 5)) ? 0.6 : 1,
                            cursor: (loading || (password !== confirmPassword && confirmPassword !== '') || (password !== '' && strength.score < 5)) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                    Already have an account? <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
