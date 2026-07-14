"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative overflow-hidden">


      <div className="w-full max-w-[400px] relative z-10 animate-fade-in" style={{ animationDuration: '0.8s' }}>
        
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <Logo className="w-16 h-16 mb-4 animate-float" />
          <h1 className="text-2xl font-semibold text-zinc-950 tracking-tight mb-2">
            Welcome to <span className="font-bold text-black">BidForge</span>
          </h1>
          <p className="text-sm text-zinc-500">
            {isLogin ? 'Sign in to access your workspace' : 'Create an account to get started'}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm relative">
          
          {/* Decorative Top Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

          {/* Google Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-md text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 mb-6 group shadow-sm"
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
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
            <span className="relative px-3 bg-white text-xs font-medium text-zinc-400 uppercase tracking-widest">Or</span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Email Address</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="premium-input" placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="premium-input" placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm border bg-red-50 text-red-600 border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="premium-btn w-full bg-black hover:bg-zinc-800 text-white mt-6 disabled:opacity-50 shadow-md"
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
            className="text-sm text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
