'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isEventEnded } from '../utils/timezone';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/leaderboard', '/submit') || "http://localhost:5000/api/submit";
const TARGET_END_TIME = new Date("02/19/2026 14:15:00");

export default function SubmitPage() {
  const [enrollment, setEnrollment] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [eventEnded, setEventEnded] = useState(false);

  // Check if event has ended on component mount
  useEffect(() => {
    setEventEnded(isEventEnded(TARGET_END_TIME));
  }, []);
  const playSuccessSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio blocked by browser policy"));
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if event has ended
    if (isEventEnded(TARGET_END_TIME)) {
      setStatus({ 
        type: 'error', 
        message: 'Event has ended. No more submissions are allowed.' 
      });
      setEventEnded(true);
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_no: enrollment.trim(),
          secret_code: code.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        playSuccessSound(); // Trigger sound here!
        setStatus({ 
          type: 'success', 
          message: `BOOM! Code Claimed. Score updated by ${result.score}!` 
        });
        setCode('');
      } else {
        setStatus({ 
          type: 'error', 
          message: result.message || 'Verification failed. Try again.' 
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server is offline. Contact an organizer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full"></div>
        
        {eventEnded && (
          <div className="absolute top-0 left-0 right-0 bg-red-500/20 border-b border-red-500/40 py-4 px-6 text-center">
            <p className="text-red-400 font-black text-sm uppercase tracking-widest">🔒 SUBMISSIONS CLOSED</p>
            <p className="text-red-300 text-xs mt-1">The event has ended. No more submissions allowed.</p>
          </div>
        )}
        
        <header className={`text-center ${eventEnded ? 'mt-16' : 'mb-10'} mb-10`}>
          <div className="text-6xl mb-6 animate-pulse">⚡</div>
          <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600">
            CLAIM POINTS
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
            UTkarsh '26 NFT Rush
          </p>
        </header>

        <form onSubmit={handleClaim} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-4">
              Your Enrollment No.
            </label>
            <input 
              type="text" 
              required
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              placeholder="Enter Enrollment"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 transition-all outline-none placeholder:text-slate-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-4">
              QR Secret Code
            </label>
            <input 
              type="text" 
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code you found"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-yellow-500 transition-all outline-none placeholder:text-slate-600 font-bold"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || eventEnded}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-yellow-500/10 uppercase tracking-widest"
          >
            {eventEnded ? 'Event Ended' : loading ? 'Verifying...' : 'Claim Now'}
          </button>
        </form>

        {status.type !== 'idle' && (
          <div className={`mt-8 p-5 rounded-2xl text-center font-black text-sm border animate-in fade-in slide-in-from-top-4 ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {status.message}
          </div>
        )}

        <footer className="mt-12 text-center border-t border-slate-800 pt-8">
          <Link href="/" className="text-slate-500 hover:text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
            ← Back to Leaderboard
          </Link>
        </footer>
      </div>
      
      <p className="mt-8 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
        Property of E-Cell
      </p>
    </div>
  );
}