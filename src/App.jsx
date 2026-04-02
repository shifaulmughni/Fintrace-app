import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Plus, Menu, LogOut,
  ArrowUpRight, ArrowDownRight, Trash2, X, Download 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
const CATEGORIES = ["Makan", "Transport", "Hiburan", "Tagihan", "Kerja", "Lainnya"];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ type: 'income', amount: '', note: '', category: 'Kerja' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error) setTransactions(data);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTransactions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.note) return;

    const { error } = await supabase.from('transactions').insert([
      { 
        user_id: user.id,
        type: formData.type,
        amount: Number(formData.amount),
        note: formData.note,
        category: formData.category
      }
    ]);

    if (!error) {
      fetchTransactions();
      setShowModal(false);
      setFormData({ type: 'income', amount: '', note: '', category: 'Kerja' });
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchTransactions();
  };

  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalBalance = income - expense;

  const pieData = CATEGORIES.map(cat => ({
    name: cat,
    value: transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((acc, curr) => acc + Number(curr.amount), 0)
  })).filter(item => item.value > 0);

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-indigo-500 font-black tracking-tighter">LOADING...</div>;

  if (!user) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-[#0f172a] p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px]"></div>
          <div className="bg-indigo-500/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/10">
            <Wallet size={40} className="text-indigo-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">FinTrace<span className="text-indigo-500">.</span></h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Masuk untuk mulai mengelola cuan kamu di perangkat mana pun.</p>
          
          <button onClick={handleLogin} className="w-full py-5 bg-white text-black rounded-3xl font-black flex items-center justify-center gap-4 hover:bg-slate-200 transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#020617] border-r border-slate-800/50 p-8 transform transition-all duration-500 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 text-indigo-500 font-black text-2xl tracking-tighter">
            <div className="bg-indigo-500/20 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10"><Wallet size={26} /></div>
            FinTrace.
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500"><X size={24} /></button>
        </div>
        
        <nav className="space-y-3 flex-1">
          <div className="flex items-center gap-3 w-full p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-3 w-full p-4 rounded-2xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
            <Download size={20} /> Export Report
          </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 text-rose-500 font-black hover:bg-rose-500/5 rounded-2xl transition-all w-full">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <Menu size={24} />
          </button>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1">Overview.</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic opacity-70">"Keep your eye on the money, and your mind on the design."</p>
          </div>
          
          <button onClick={() => setShowModal(true)} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-3xl flex items-center justify-center gap-3 shadow-[0_15px_35px_rgba(79,70,229,0.3)] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95">
            <Plus size={20} strokeWidth={3} /> Tambah Data
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Saldo', val: totalBalance, color: 'text-white' },
            { label: 'Pemasukan', val: income, color: 'text-emerald-400' },
            { label: 'Pengeluaran', val: expense, color: 'text-rose-500' }
          ].map((stat, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-[#0f172a]/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800/50 hover:border-indigo-500/30 transition-all">
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black mb-3">{stat.label}</p>
              <h3 className={`text-3xl font-black tracking-tighter ${stat.color}`}>Rp {stat.val.toLocaleString('id-ID')}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-[#0f172a]/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800/50 p-8 md:p-10">
             <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...transactions].reverse()}>
                  <defs><linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
                  <XAxis dataKey="created_at" tickFormatter={(str) => new Date(str).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} stroke="#475569" fontSize={10} axisLine={false} dy={15} fontWeight="900" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={5} fill="url(#colorAmt)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#020617' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#0f172a]/40 rounded-[2.5rem] border border-slate-800/50 p-10 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">{pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={12} />)}</Pie><Tooltip contentStyle={{borderRadius: '20px', border: 'none', backgroundColor: '#0f172a'}} /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a]/40 rounded-[2.5rem] border border-slate-800/50 p-6 md:p-10 mb-10 min-h-[400px]">
          <h4 className="font-black mb-8 text-slate-500 uppercase text-[10px] tracking-[0.3em]">Recent Activity</h4>
          <div className="space-y-4">
            <AnimatePresence>
              {transactions.map((item) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-[#020617]/60 rounded-[2rem] border border-slate-800/50 group hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {item.type === 'income' ? <ArrowUpRight size={24} strokeWidth={3}/> : <ArrowDownRight size={24} strokeWidth={3}/>}
                    </div>
                    <div>
                        <p className="font-black text-slate-100 text-lg tracking-tight capitalize">{item.note}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('id-ID')} • {item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-8 border-t sm:border-none border-slate-800/50 mt-4 pt-4 sm:mt-0 sm:pt-0">
                    <p className={`font-black text-2xl tracking-tighter ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {item.type === 'income' ? '+' : '-'} Rp {Number(item.amount).toLocaleString('id-ID')}
                    </p>
                    <button onClick={() => deleteTransaction(item.id)} className="text-slate-700 hover:text-rose-500 transition-all p-3 hover:bg-rose-500/10 rounded-2xl opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {transactions.length === 0 && <div className="text-center py-20 text-slate-700 font-black uppercase text-xs tracking-widest">No Records Yet</div>}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-md p-10 rounded-[3.5rem] border border-slate-800 shadow-[0_0_80px_rgba(99,102,241,0.1)] relative">
              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-all"><X size={24} /></button>
              <h2 className="text-3xl font-black mb-10 tracking-tighter text-white">Add Record<span className="text-indigo-500">.</span></h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-2 bg-[#020617] rounded-[2rem] border border-slate-800/50">
                  {['income', 'expense'].map(type => (
                    <button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === type ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'text-slate-600'}`}>{type}</button>
                  ))}
                </div>
                <input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="Amount (Rp)" className="w-full bg-[#020617] border border-slate-800 p-6 rounded-3xl text-2xl font-black outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-800" />
                <input type="text" required value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="What is this for?" className="w-full bg-[#020617] border border-slate-800 p-6 rounded-3xl font-bold outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-800" />
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-6 rounded-3xl font-black uppercase text-xs tracking-widest outline-none text-white appearance-none cursor-pointer">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button type="submit" className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-lg shadow-2xl uppercase tracking-widest transition-all active:scale-95">Simpan Data</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;