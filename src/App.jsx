import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Pastikan file ini sudah ada
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Umum');
  const [type, setType] = useState('income');
  // 1. STATE BARU UNTUK TANGGAL (Default: Hari Ini)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Cek Sesi Login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTransactions(session.user.id);
    });
  }, []);

  const fetchTransactions = async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

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
          date, // 2. KIRIM TANGGAL KE SUPABASE
          user_id: user.id 
        }
      ]);

    if (!error) {
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]); // Reset ke hari ini
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

  // Hitung Total Saldo
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-24">
      {/* Header & Balance Card */}
      <div className="max-w-md mx-auto p-6 space-y-6">
        <header className="flex justify-between items-center pt-4">
          <div>
            <p className="text-zinc-500 text-sm">Selamat Datang,</p>
            <h1 className="text-xl font-bold tracking-tight">{user.user_metadata.full_name}</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-zinc-500 text-xs hover:text-white">Logout</button>
        </header>

        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-[2rem] border border-zinc-700/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Total Saldo</p>
            <h2 className="text-4xl font-black tabular-nums">Rp {balance.toLocaleString('id-ID')}</h2>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
        </div>

        {/* List Transaksi */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-2">Aktivitas Terakhir</h3>
          {transactions.map((t) => (
            <div key={t.id} className="group bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                  <p className="font-medium text-zinc-200 capitalize">{t.note || 'Tanpa Catatan'}</p>
                  {/* TAMPILKAN TANGGAL DI BAWAH NOTE */}
                  <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1 mt-1">
                    <Calendar size={10} /> {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <p className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                </p>
                <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 p-5 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Modal Add Record */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Tambah Catatan</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Toggle Income/Expense */}
              <div className="flex bg-black p-1 rounded-2xl border border-zinc-800">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Pemasukan</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Pengeluaran</button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-2 tracking-widest">Nominal</label>
                <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-2xl font-black outline-none focus:border-indigo-600 transition-all text-indigo-400" required />
              </div>

              {/* 3. INPUT TANGGAL (BARU) */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-2 tracking-widest">Tanggal</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 transition-all" 
                  required 
                />
              </div>

              {/* Note Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-2 tracking-widest">Keterangan</label>
                <input type="text" placeholder="Beli apa?" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 transition-all" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-500 font-bold">Batal</button>
                <button type="submit" className="flex-[2] bg-indigo-600 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;