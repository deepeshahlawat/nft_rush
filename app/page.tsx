'use client';

import { useState, useEffect } from 'react';
import { formatTimeRemaining, isEventEnded } from './utils/timezone';

// Replace this with your teammate's actual hosted API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/leaderboard";
const TARGET_END_TIME = new Date("02/18/2026 21:30:00");

export default function Leaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState("API SYNC ACTIVE");
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();

      const mappedData = result.leaderboard.map((item: any) => ({
        name: item.team_name,
        points: item.score
      }));

      setData(mappedData);
      setLastSync(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error("API Sync Error:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
    const timerInterval = setInterval(() => {
      const timeDisplay = formatTimeRemaining(TARGET_END_TIME);
      setTimeLeft(timeDisplay);
      
      if (isEventEnded(TARGET_END_TIME)) {
        setIsRoundOver(true);
        clearInterval(timerInterval);
      } else {
        setIsRoundOver(false);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-8 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      {/* WINNER MODAL */}
      {isRoundOver && data.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl px-4">
          <div className="text-center p-8 md:p-12 border-4 border-yellow-500 rounded-[2.5rem] md:rounded-[3rem] bg-slate-900 shadow-[0_0_150px_rgba(234,179,8,0.4)] max-w-xl w-full">
            <div className="text-7xl md:text-9xl mb-6 md:mb-8 animate-bounce">🏆</div>
            <h2 className="text-2xl md:text-4xl font-black text-yellow-500 uppercase tracking-widest mb-2 text-glow">Champion</h2>
            <h1 className="text-4xl md:text-7xl font-black italic text-white mb-6 md:mb-8 tracking-tighter uppercase break-words">
              {data[0].name}
            </h1>
            <div className="bg-yellow-500 text-black inline-block px-8 md:px-12 py-3 md:py-4 rounded-full font-black text-xl md:text-3xl mb-8">
              {data[0].points} POINTS
            </div>
            <button onClick={() => setIsRoundOver(false)} className="block w-full text-slate-500 hover:text-white transition-all uppercase font-black tracking-widest text-xs md:text-sm underline decoration-dotted">
              Dismiss to view results
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative pt-6 md:pt-10">
        
        <button 
          onClick={fetchData} 
          disabled={isSyncing} 
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 bg-yellow-500 hover:bg-yellow-400 text-black p-3 md:p-4 rounded-full shadow-2xl active:scale-95 transition-all group"
        >
          <svg className={`w-5 h-5 md:w-6 md:h-6 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>

        <div className={`mb-8 md:mb-12 text-center border py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] backdrop-blur-md transition-all duration-700 ${isRoundOver ? 'bg-green-600/20 border-green-500/40 shadow-green-500/10' : 'bg-red-600/20 border-red-500/40 shadow-red-500/10'}`}>
          <p className={`${isRoundOver ? 'text-green-400' : 'text-red-400'} font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-[10px] md:text-xs mb-2 md:mb-3`}>
            {isRoundOver ? 'Final Standings' : 'Time Remaining'}
          </p>
          <div className="text-4xl md:text-8xl font-mono font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
            {timeLeft}
          </div>
        </div>

        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 drop-shadow-md">
            QR HUNT LIVE
          </h1>
          <p className="text-slate-600 mt-2 md:mt-4 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-base italic">UTkarsh '26 Leaderboard</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center py-20 text-yellow-500 font-black tracking-widest animate-pulse">
             API HANDSHAKE...
          </div>
        ) : (
          <>
            {isRoundOver ? (
              /* PODIUM VIEW: Responsive Stacking */
              <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-8 md:gap-10 mb-24 px-4 animate-in slide-in-from-bottom duration-1000">
                {/* 2nd Place */}
                <div className="flex flex-col items-center order-2 md:order-1">
                  <div className="bg-slate-800 border-2 border-slate-500 w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-4 md:shadow-2xl relative">
                    <span className="text-3xl md:text-6xl font-black text-slate-400">2</span>
                  </div>
                  <p className="font-black uppercase text-xs md:text-sm text-slate-300 mb-1 truncate w-32 text-center">{data[1]?.name || '---'}</p>
                  <p className="text-yellow-500 font-black text-lg md:text-xl">{data[1]?.points || 0} pts</p>
                </div>
                {/* 1st Place */}
                <div className="flex flex-col items-center order-1 md:order-2 scale-110 md:scale-135 mb-4 md:mb-16">
                  <div className="relative">
                     <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 text-4xl md:text-6xl animate-bounce">👑</div>
                     <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center mb-4 md:mb-6 border-4 border-yellow-200 shadow-[0_0_60px_rgba(234,179,8,0.6)]">
                        <span className="text-5xl md:text-8xl font-black text-black">1</span>
                     </div>
                  </div>
                  <p className="font-black uppercase text-sm md:text-2xl text-yellow-400 mb-1 tracking-tight truncate w-40 text-center">{data[0]?.name || '---'}</p>
                  <p className="text-white font-black text-xl md:text-3xl drop-shadow-xl">{data[0]?.points || 0} pts</p>
                </div>
                {/* 3rd Place */}
                <div className="flex flex-col items-center order-3 md:order-3">
                  <div className="bg-slate-800 border-2 border-orange-900 w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-4 shadow-2xl text-orange-700 font-black">
                    <span className="text-2xl md:text-5xl">3</span>
                  </div>
                  <p className="font-black uppercase text-xs md:text-sm text-orange-800 mb-1 truncate w-32 text-center">{data[2]?.name || '---'}</p>
                  <p className="text-yellow-500 font-black text-base md:text-lg">{data[2]?.points || 0} pts</p>
                </div>
              </div>
            ) : (
              /* TABLE VIEW: Mobile-Optimized Columns */
              <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[1.5rem] md:rounded-[3rem] shadow-2xl border border-slate-800/60 overflow-hidden mb-24 animate-in fade-in duration-500">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                    <tr>
                      <th className="w-16 md:w-24 px-4 md:px-12 py-5 md:py-8 text-center">Rank</th>
                      <th className="px-4 md:px-12 py-5 md:py-8">Team Name</th>
                      <th className="w-24 md:w-40 px-4 md:px-12 py-5 md:py-8 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {data.map((player, index) => (
                      <tr key={index} className="hover:bg-slate-800/50 transition-all">
                        <td className="px-4 md:px-12 py-5 md:py-8">
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-[10px] md:text-sm font-black mx-auto ${index === 0 ? 'border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'border-slate-700 text-slate-500'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 md:px-12 py-5 md:py-8 font-black uppercase text-slate-200 text-sm md:text-xl tracking-tighter truncate">
                          {player.name}
                        </td>
                        <td className="px-4 md:px-12 py-5 md:py-8 text-right font-black text-yellow-400 text-lg md:text-3xl tabular-nums">
                          {player.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="text-center pb-10">
              <p className="text-slate-700 text-[10px] uppercase font-bold tracking-widest">
                Last Refresh: <span className="text-slate-500">{lastSync || 'Pending'}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}