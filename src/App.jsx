import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; 
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, LogOut, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Umum');
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
      if (session?.user) {
        fetchTransactions(session.user.id);
      } else {
        setTransactions([]);
      }
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
      .insert([
        { 
          amount: Number(amount), 
          note, 
          category, 
          type, 
          date, 
          user_id: user.id 
        }
      ]);

    if (!error) {
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsModalOpen(false);
      fetchTransactions(user.id);
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) fetchTransactions(user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">FINTRACE.</h1>
            <p className="text-zinc-500 font-medium">Master your flow, track your glow.</p>
        </div>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Konten Utama */}
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 pb-40">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Overview</p>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{user.user_metadata.full_name}</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:border-rose-500/30 transition-all text-xs font-bold"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </header>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 p-8 md:p-12 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-3 font-bold">Current Balance</p>
            <h2 className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter">Rp {balance.toLocaleString('id-ID')}</h2>
          </div>
          <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        {/* Activity Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Recent Activity</h3>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">{transactions.length} Records</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="group bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/60 hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-200 capitalize tracking-tight leading-tight">{t.note || 'General'}</p>
                      <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1.5 mt-1.5 font-bold tracking-wider">
                        <Calendar size={12} className="opacity-50" /> {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className={`text-lg font-black tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.amount.toLocaleString('id-ID')}
                    </p>
                    <button 
                        onClick={() => deleteTransaction(t.id)} 
                        className="p-2 opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                    <p className="text-zinc-700 font-bold italic tracking-widest text-sm uppercase">No Transactions Found</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Area */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-30" />
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Modal - Improved Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-[100]">
          <div className="bg-[#0f0f0f] w-full max-w-lg rounded-[3rem] p-8 md:p-12 border border-zinc-800 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black italic tracking-tighter mb-8">ADD RECORD.</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-black p-1.5 rounded-2xl border border-zinc-800">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'income' ? 'bg-zinc-800 text-emerald-400 shadow-lg' : 'text-zinc-600'}`}>INCOME</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'expense' ? 'bg-zinc-800 text-rose-400 shadow-lg' : 'text-zinc-600'}`}>EXPENSE</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] ml-1">Nominal</label>
                    <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-2xl font-black outline-none focus:border-indigo-500 transition-all text-white" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] ml-1">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 transition-all font-bold" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] ml-1">Note</label>
                <input type="text" placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 transition-all font-medium" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[1.5rem] font-black text-lg shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all mt-4 tracking-tighter">
                SAVE TRANSACTION
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;