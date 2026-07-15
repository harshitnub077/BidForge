"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { motion } from 'framer-motion';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError((e as Error).message); setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email for a confirmation link.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-canvas)' }}>


      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Logo className="w-14 h-14 mb-5" />
          <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Welcome to <span className="font-bold">BidForge</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {isLogin ? 'Sign in to access your workspace' : 'Create an account to get started'}
          </p>
        </div>

        <div className="surface-card p-8 relative">
          {/* Decorative Top Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
            style={{ background: 'linear-gradient(to right, transparent, var(--color-hairline-strong), transparent)' }} />

          {/* Google Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 mb-6 group"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-ink)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline-strong)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80 group-hover:opacity-100 transition-opacity">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: '1px solid var(--color-hairline)' }} /></div>
            <span className="relative px-3 text-xs font-medium uppercase tracking-widest"
              style={{ backgroundColor: 'var(--color-surface-1)', color: 'var(--color-ink-faint)' }}>Or</span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 ml-0.5" style={{ color: 'var(--color-ink-muted)' }}>Email Address</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="premium-input" placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 ml-0.5" style={{ color: 'var(--color-ink-muted)' }}>Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="premium-input" placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{
                border: '1px solid rgba(239,68,68,0.2)',
                backgroundColor: 'rgba(239,68,68,0.05)',
                color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="premium-btn btn-primary w-full mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <div className="text-center mt-8">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-ink-faint)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-ink)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-faint)'}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
