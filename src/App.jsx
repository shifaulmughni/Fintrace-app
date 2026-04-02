import React, { useState, useEffect } from 'react';
// Import diperbaiki agar sesuai dengan nama file lib/supabase.js kamu
import { supabase } from './lib/supabase'; 
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, LogOut, X, LayoutDashboard, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchTransactions(session.user.id);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTransactions(session.user.id);
      else setTransactions([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (!error) setTransactions(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !user) return;
    const { error } = await supabase
      .from('transactions')
      .insert([{ amount: Number(amount), note, type, date, user_id: user.id }]);
    if (!error) {
      setAmount(''); setNote(''); setIsModalOpen(false);
      fetchTransactions(user.id);
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchTransactions(user.id);
  };

  // Logika Kalkulasi Dashboard (Data Real)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  // Persentase Penggunaan Budget (Expense vs Income)
  const expenseProgress = totalIncome > 0 ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100) : 0;
  
  // Hitung Stroke Dasharray untuk Ring Chart (Lingkaran)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (expenseProgress / 100) * circumference;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter mb-2 italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">FINTRACE.</h1>
        <p className="text-zinc-500 mb-8 font-medium">Master your flow, track your glow.</p>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1400px] mx-auto p-6 md:p-10 pb-40">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black leading-none mb-1">Personal Pro</p>
              <h1 className="text-xl font-bold tracking-tight">{user.user_metadata.full_name}</h1>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-rose-500 transition-all text-xs font-bold">
            <LogOut size={14} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT & CENTER COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card Saldo Utama */}
            <div className="bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-3 font-bold">Current Balance</p>
                <h2 className="text-3xl md:text-6xl font-black tabular-nums tracking-tighter">Rp {balance.toLocaleString('id-ID')}</h2>
              </div>
              <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 md:w-64 md:h-64 text-white/5 rotate-12" />
            </div>

            {/* Income & Expense Mini Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-5 md:p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-3 md:gap-4 transition-all hover:border-emerald-500/30">
                <div className="w-fit p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp size={20}/></div>
                <div>
                  <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest mb-1">Incomes</p>
                  <p className="text-sm md:text-lg font-bold text-emerald-400">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 p-5 md:p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-3 md:gap-4 transition-all hover:border-rose-500/30">
                <div className="w-fit p-3 bg-rose-500/10 text-rose-500 rounded-xl"><TrendingDown size={20}/></div>
                <div>
                  <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-black tracking-widest mb-1">Expenses</p>
                  <p className="text-sm md:text-lg font-bold text-rose-400">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* --- MOBILE CHART: Muncul cuma di layar kecil (lg:hidden) --- */}
            <div className="block lg:hidden bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Spending Analysis</h3>
               <div className="relative flex items-center justify-center py-2">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-800" />
                  <circle 
                    cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="10" fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    style={{ 
                      strokeDashoffset: (2 * Math.PI * 60) - (expenseProgress / 100) * (2 * Math.PI * 60),
                      transition: 'stroke-dashoffset 1s ease-in-out' 
                    }}
                    strokeLinecap="round"
                    className={expenseProgress > 80 ? 'text-rose-500' : 'text-indigo-500'} 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black">{expenseProgress}%</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Used</span>
                </div>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50 text-center">
                   <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                     {expenseProgress > 70 ? "⚠️ Hati-hati bro, budget menipis!" : "✅ Keuangan kamu masih sehat."}
                   </p>
              </div>
            </div>
            {/* --- END MOBILE CHART --- */}

            {/* List Transaksi */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactions.map((t) => (
                  <div key={t.id} className="group bg-zinc-900/20 border border-zinc-800/40 p-5 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/60 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-200 capitalize tracking-tight leading-tight text-sm md:text-base">{t.note || 'General'}</p>
                        <p className="text-[10px] text-zinc-500 uppercase mt-1 font-bold tracking-wider">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className={`text-base md:text-lg font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.amount.toLocaleString('id-ID')}</p>
                      <button onClick={() => deleteTransaction(t.id)} className="p-2 md:opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Spending Analysis Desktop) */}
          <div className="hidden lg:block space-y-8 sticky top-10">
            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[3rem] space-y-8">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Spending Analysis</h3>
              
              <div className="relative flex items-center justify-center py-4">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-800" />
                  <circle 
                    cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                    strokeLinecap="round"
                    className={expenseProgress > 80 ? 'text-rose-500' : 'text-indigo-500'} 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black">{expenseProgress}%</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Used</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Usage vs Income</span>
                    <span className={expenseProgress > 80 ? 'text-rose-500' : 'text-indigo-400'}>{expenseProgress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${expenseProgress > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${expenseProgress}%` }} 
                    />
                  </div>
                </div>
                
                <div className="p-5 bg-black/40 rounded-[1.5rem] border border-zinc-800/50">
                   <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Insight</p>
                   <p className="text-xs text-zinc-400 leading-relaxed">
                     {expenseProgress > 70 ? "Hati-hati bro, pengeluaran kamu sudah mepet sama pemasukan." : "Kondisi keuangan masih aman. Terus pantau ya!"}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center">
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Modal Add Record */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-[100]">
          <div className="bg-[#0f0f0f] w-full max-w-lg rounded-[3rem] p-8 md:p-12 border border-zinc-800 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 text-zinc-500 hover:text-white"><X size={24} /></button>
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 italic">ADD RECORD.</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-black p-1.5 rounded-2xl border border-zinc-800">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'income' ? 'bg-zinc-800 text-emerald-400 shadow-lg' : 'text-zinc-600'}`}>INCOME</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'expense' ? 'bg-zinc-800 text-rose-400 shadow-lg' : 'text-zinc-600'}`}>EXPENSE</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-xl font-black outline-none focus:border-indigo-500 text-white" required />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 font-bold" required />
              </div>
              <input type="text" placeholder="Note (ex: Gaji, Kopi, etc)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 font-medium" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[1.5rem] font-black text-lg shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all mt-4 tracking-tighter">SAVE TRANSACTION</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;