import React, { useState, useEffect } from 'react';
// Sesuaikan path ini dengan struktur folder kamu (src/lib/supabase.js)
import { supabase } from './lib/supabase'; 
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, LogOut } from 'lucide-react';

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
    // Cek Sesi saat aplikasi dimuat
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchTransactions(session.user.id);
    };

    getSession();

    // Listener untuk perubahan auth (Login/Logout)
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
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error logging out:', error.message);
  };

  // Kalkulasi
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">FINTRACE.</h1>
            <p className="text-zinc-500">Master your flow, track your glow.</p>
        </div>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-32">
      {/* Wrapper Utama - Dibuat max-w-4xl agar lebar di desktop */}
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        
        {/* Header Responsif */}
        <header className="flex justify-between items-center pt-6">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Dashboard</p>
            <h1 className="text-2xl font-bold tracking-tight">{user.user_metadata.full_name}</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:border-rose-500/50 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </header>

        {/* Hero Card - Full Width */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/70 text-xs uppercase tracking-widest mb-2 font-bold">Total Saldo Kamu</p>
            <h2 className="text-5xl font-black tabular-nums tracking-tighter">Rp {balance.toLocaleString('id-ID')}</h2>
          </div>
          <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
        </div>

        {/* Section List - Responsif (2 Kolom di Desktop) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Aktivitas Terakhir</h3>
            <span className="text-xs text-zinc-600">{transactions.length} Transaksi</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="group bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-zinc-900 hover:border-zinc-700 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-200 capitalize tracking-tight">{t.note || 'Tanpa Catatan'}</p>
                      <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1.5 mt-1 font-bold tracking-wider">
                        <Calendar size={12} className="text-zinc-600" /> {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className={`text-lg font-black tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                    </p>
                    <button 
                        onClick={() => deleteTransaction(t.id)} 
                        className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2rem]">
                    <p className="text-zinc-600 font-medium italic">Belum ada transaksi recorded.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black p-5 rounded-full shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Modal - Glassmorphism */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-10 border border-zinc-800 shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic tracking-tighter">ADD RECORD.</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white">Close</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-black p-1.5 rounded-2xl border border-zinc-800">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'income' ? 'bg-zinc-800 text-emerald-400 shadow-inner' : 'text-zinc-600'}`}>INCOME</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-black tracking-tighter transition-all ${type === 'expense' ? 'bg-zinc-800 text-rose-400 shadow-inner' : 'text-zinc-600'}`}>EXPENSE</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Nominal</label>
                    <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-2xl font-black outline-none focus:border-indigo-500 transition-all text-white" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Tanggal</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 transition-all font-bold" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">Keterangan</label>
                <input type="text" placeholder="Explain the vibe..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black border border-zinc-800 p-5 rounded-[1.5rem] text-white outline-none focus:border-indigo-500 transition-all" />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[1.5rem] font-black text-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mt-4 tracking-tighter">
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