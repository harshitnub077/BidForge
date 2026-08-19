"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setLoading(true); 
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Verification email dispatched. Please check your inbox.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b]">
      
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-[380px]"
      >
        {/* Header Branding */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Logo className="w-9 h-9 mb-3" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            BidForge Enterprise
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isLogin ? 'Sign in to access your proposal workspace' : 'Create an enterprise account to begin'}
          </p>
        </div>

        {/* Card Container */}
        <div className="surface-card p-6 border border-[#27272a]">
          
          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-md text-xs font-semibold text-white bg-[#18181b] hover:bg-[#222226] border border-[#27272a] transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#27272a]" /></div>
            <span className="relative px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-[#121215]">
              or work email
            </span>
          </div>

          {/* Email Credentials Form */}
          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Work Email
              </label>
              <input
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input" 
                placeholder="name@company.com"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input" 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded text-xs border border-rose-500/30 bg-rose-500/10 text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-1"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="mt-5 pt-3 border-t border-[#27272a] flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck size={12} className="text-zinc-400" />
            <span>SOC2 Type II • 256-bit encrypted</span>
          </div>
        </div>

        {/* Toggle Login / Register */}
        <div className="text-center mt-4">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
          >
            {isLogin ? "Need an enterprise account? Sign up" : "Already registered? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
