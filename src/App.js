import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, QrCode, Users, History, Settings, Coins, LogOut, CheckCircle2, 
  AlertCircle, Smartphone, ShieldCheck, LayoutDashboard, ArrowRight, 
  UploadCloud, User, Loader2, Lock, ChevronRight, PlusCircle, CreditCard, 
  Zap, ShoppingBag, Ticket, Image as ImageIcon, Film, X, Database, 
  Activity, Search, Edit, Trash2, MoreVertical, Save, ShieldAlert, 
  TrendingUp, MessageSquare, Server, Plus, Minus, Bell, LogIn, Play, Download,
  RefreshCw, ListPlus, Paperclip, XCircle, Gift, Calendar, Crown, Star, KeyRound, Building2, Mail,
  PieChart, LineChart, Ban, Clock, UserX, Layers, TicketPercent, UserPlus, Wand2
} from 'lucide-react';
const API_URL = 'https://ar-connect-backend.onrender.com/api';

/* ============================================================================
   CONSTANTS & DEFAULT SETTINGS
   ============================================================================ */
const SUBSCRIPTION_PACKAGES = [
  { id: 'basic', name: 'Basic Plan', price: 49, credits: 2000, features: ['2,000 Credits', 'Text & Image Only', 'Valid for 30 Days'], icon: Star, popular: false },
  { id: 'pro', name: 'Pro Plan', price: 99, credits: 5000, features: ['5,000 Credits', 'Text, Image & Video', 'Valid for 30 Days'], icon: Crown, popular: true },
  { id: 'ultimate', name: 'Ultimate Plan', price: 199, credits: 15000, features: ['15,000 Credits', 'All Features + Priority', 'Valid for 30 Days'], icon: ShieldCheck, popular: false }
];
const TOPUP_PACKAGES = [
  { id: 'tu_1', amount: 500, price: 15, label: 'Lite Reload', icon: Ticket, bonus: null },
  { id: 'tu_2', amount: 1500, price: 40, label: 'Basic Reload', icon: Zap, bonus: '+50 Bonus' },
  { id: 'tu_3', amount: 4000, price: 90, label: 'Pro Reload', icon: Coins, bonus: '+200 Bonus', popular: true },
  { id: 'tu_4', amount: 10000, price: 180, label: 'Enterprise Reload', icon: Database, bonus: '+500 Bonus' }
];
const DEFAULT_PACKAGE_SETTINGS = {
  free: { allowImage: false, allowVideo: false, label: 'Free Plan' },
  basic: { allowImage: true, allowVideo: false, label: 'Basic Plan' },
  pro: { allowImage: true, allowVideo: true, label: 'Pro Plan' },
  ultimate: { allowImage: true, allowVideo: true, label: 'Ultimate Plan' }
};
const QRCodeImage = ({ value, size = 200 }) => {
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size}&margin=1`;
  return (
    <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 inline-block max-w-full">
      <img src={qrUrl} alt="WhatsApp QR" width={size} height={size} className="rounded-xl max-w-full h-auto" />
    </div>
  );
};

/* ============================================================================
   ADMIN PORTAL 
   ============================================================================ */
const AdminPortal = ({ currentUser, onLogout, token, packageSettings, onSavePackageSettings }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });
  const [manageModal, setManageModal] = useState({ 
    isOpen: false, userId: null, kredit: 0, userName: '', status_langganan: 'free',
    isSuspended: false, isCreditLocked: false, expiryDate: ''
  });
  const [editPkgSettings, setEditPkgSettings] = useState(packageSettings);
  const [vouchers, setVouchers] = useState([]);
  const [newVoucher, setNewVoucher] = useState({ code: '', amount: 100, maxUses: 10 });
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [bulkCreditAmount, setBulkCreditAmount] = useState('');
  const [isBlastingCredit, setIsBlastingCredit] = useState(false);
  const [defaultRegCredit, setDefaultRegCredit] = useState(100);
  const [isSavingRegCredit, setIsSavingRegCredit] = useState(false);
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const showNotification = (title, message, type = 'info') => {
    setNotification({ show: true, title, message, type });
    if(type !== 'error') setTimeout(() => setNotification({ show: false, title: '', message: '', type: 'info' }), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setAllUsers(await res.json());
    } catch (err) {}
    setLoading(false);
  };

const fetchAdminExtras = async () => {
    try {
      const vRes = await fetch(`${API_URL}/admin/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (vRes.ok) setVouchers(await vRes.json());
      
      const sRes = await fetch(`${API_URL}/admin/settings`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (sRes.ok) {
        const data = await sRes.json();
        if (data && data.defaultRegistrationCredit !== undefined) {
           setDefaultRegCredit(data.defaultRegistrationCredit);
        }
        if (data && data.packageSettings) {
           setEditPkgSettings(data.packageSettings);
           onSavePackageSettings(data.packageSettings);
        }
      }
    } catch (err) { console.log("Gagal memuatkan tetapan admin", err); }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminExtras();
    // eslint-disable-next-line
  }, [token]);

  const totalUsers = allUsers.length;
  const activeWADevices = allUsers.filter(u => u.sesi_whatsapp_aktif).length;
  const suspendedUsers = allUsers.filter(u => u.isSuspended).length;
  const totalCreditsInSystem = allUsers.reduce((sum, u) => sum + (u.kredit || 0), 0);
  const filteredUsers = allUsers.filter(u => 
    u.nama_syarikat?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openManageModal = (user) => {
    const formattedDate = user.expiryDate ? new Date(user.expiryDate).toISOString().split('T')[0] : '';
    setManageModal({
      isOpen: true, userId: user._id, kredit: user.kredit, userName: user.nama_syarikat,
      status_langganan: user.status_langganan || 'free', isSuspended: user.isSuspended || false,
      isCreditLocked: user.isCreditLocked || false, expiryDate: formattedDate
    });
  };

  const handleSaveUser = async () => {
    if (isNaN(manageModal.kredit) || manageModal.kredit < 0) return showNotification("Invalid Amount", "Sila masukkan nilai kredit yang sah.", "warning");
    setIsSavingUser(true);
    try {
      const res = await fetch(`${API_URL}/admin/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          userId: manageModal.userId, kredit: parseInt(manageModal.kredit), status_langganan: manageModal.status_langganan,
          isSuspended: manageModal.isSuspended, isCreditLocked: manageModal.isCreditLocked, expiryDate: manageModal.expiryDate || null
        })
      });
      if (res.ok) {
        showNotification("Success", "Akaun pelanggan berjaya dikemaskini!", "success");
        setManageModal({ ...manageModal, isOpen: false }); fetchUsers();
      } else { showNotification("Error", "Gagal mengemaskini akaun.", "error"); }
    } catch (err) { showNotification("Error", "Masalah pelayan.", "error"); } 
    finally { setIsSavingUser(false); }
  };

  // --- DELETE & TEMP PASSWORD HANDLERS ---
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam akaun ${userName}? Tindakan ini tidak boleh dipulihkan.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Berjaya", data.message, "success");
        fetchUsers(); 
      } else {
        showNotification("Ralat", data.message, "error");
      }
    } catch (error) {
      showNotification("Ralat", 'Gagal memadam pengguna. Sila cuba lagi.', "error");
    }
  };

  const handleSetTempPassword = async (userId, userName) => {
    const tempPassword = window.prompt(`Sila masukkan kata laluan sementara baharu untuk ${userName}:`, "123456");
    if (!tempPassword) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/temp-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tempPassword })
      });
      const data = await res.json();
      if (res.ok) {
        window.alert(`Berjaya! Sila maklumkan kepada ${userName} kata laluan sementara mereka ialah: ${tempPassword}`);
      } else {
        showNotification("Ralat", data.message, "error");
      }
    } catch (error) {
      showNotification("Ralat", 'Gagal menetapkan kata laluan sementara.', "error");
    }
  };

  const handleBulkCreditBlast = async () => {
    if (!bulkCreditAmount || isNaN(bulkCreditAmount) || bulkCreditAmount <= 0) {
      return showNotification("Ralat", "Sila masukkan jumlah kredit yang sah.", "warning");
    }
    if (!window.confirm(`Adakah anda pasti untuk berikan ${bulkCreditAmount} kredit percuma kepada SEMUA ${allUsers.length} pelanggan secara serentak?`)) return;
    setIsBlastingCredit(true);
    try {
      const promises = allUsers.map(u => 
        fetch(`${API_URL}/admin/update-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
             userId: u._id, kredit: (u.kredit || 0) + parseInt(bulkCreditAmount),
             status_langganan: u.status_langganan, isSuspended: u.isSuspended,
             isCreditLocked: u.isCreditLocked, expiryDate: u.expiryDate
          })
        })
      );
      await Promise.all(promises);
      showNotification("Berjaya", `${bulkCreditAmount} Kredit telah dimasukkan ke dalam SEMUA akaun pelanggan!`, "success");
      setBulkCreditAmount(''); fetchUsers();
    } catch (error) { showNotification("Ralat", "Terdapat masalah semasa proses kemasukan kredit pukal.", "error"); }
    setIsBlastingCredit(false);
  };

  const handleSaveDefaultRegCredit = async () => {
    setIsSavingRegCredit(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ defaultRegistrationCredit: defaultRegCredit })
      });
      if (res.ok) showNotification("Berjaya", "Tetapan kredit pendaftaran baru telah disimpan.", "success");
      else showNotification("Ralat", "Sila pastikan backend API /admin/settings telah diaktifkan.", "error");
    } catch (err) { showNotification("Ralat", "Gagal menghubungi pelayan.", "error"); }
    setIsSavingRegCredit(false);
  };

  const generateRandomPin = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = 'PIN-';
    for(let i=0; i<4; i++) pin += chars.charAt(Math.floor(Math.random() * chars.length));
    pin += '-';
    for(let i=0; i<4; i++) pin += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewVoucher({...newVoucher, code: pin, maxUses: 1}); 
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setIsCreatingVoucher(true);
    try {
      const res = await fetch(`${API_URL}/admin/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: newVoucher.code.toUpperCase(), amount: newVoucher.amount, maxUses: newVoucher.maxUses })
      });
      if (res.ok) {
        showNotification("Berjaya", "Kod PIN / Voucher baharu dicipta!", "success");
        setNewVoucher({ code: '', amount: 100, maxUses: 10 });
        fetchAdminExtras(); 
      } else {
        const data = await res.json();
        showNotification("Ralat", data.message || "Gagal mencipta voucher.", "error");
      }
    } catch (err) { showNotification("Ralat", "Sila pastikan backend Voucher telah ditambah.", "error"); }
    setIsCreatingVoucher(false);
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Padam kod voucher ini?")) return;
    try {
      await fetch(`${API_URL}/admin/vouchers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchAdminExtras();
    } catch (err) {}
  };

const handleSavePackageConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ packageSettings: editPkgSettings })
      });
      if (res.ok) {
        onSavePackageSettings(editPkgSettings);
        showNotification("Success", "Tetapan format akses untuk pakej berjaya disimpan secara global!", "success");
      }
    } catch (err) {
      showNotification("Error", "Gagal menyimpan tetapan pakej ke server.", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) return showNotification("Error", "Kata laluan baharu tidak sepadan.", "error");
    setIsUpdatingPwd(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: currentUser.id || currentUser._id, old: pwdData.old, new: pwdData.new })
      });
      if (res.ok) {
        showNotification("Success", "Kata laluan Admin berjaya ditukar.", "success");
        setPwdData({ old: '', new: '', confirm: '' });
      } else {
        const data = await res.json();
        showNotification("Error", data.message || "Gagal menukar kata laluan.", "error");
      }
    } catch (err) { showNotification("Error", "Masalah sambungan pelayan.", "error"); }
    finally { setIsUpdatingPwd(false); }
  };

  const timeSince = (dateString) => {
    if(!dateString) return 'Belum Login';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lepas";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lepas";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lepas";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lepas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minit lepas";
    return "Baru sahaja";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex w-full relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {notification.show && (
        <div className="fixed top-6 right-6 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
            notification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-green-50 border-green-200 text-green-700'
          }`}>
            {notification.type === 'warning' ? <AlertCircle size={24} /> :
             notification.type === 'error' ? <XCircle size={24} /> :
             <CheckCircle2 size={24} />}
            <div>
              <h4 className="font-black text-sm">{notification.title}</h4>
              <p className="font-medium text-xs opacity-80">{notification.message}</p>
            </div>
            <button onClick={() => setNotification({ ...notification, show: false })} className="ml-4 opacity-50 hover:opacity-100"><X size={16}/></button>
          </div>
        </div>
      )}

      {manageModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><User size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black">Manage Client</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{manageModal.userName}</p>
                  </div>
               </div>
               <button onClick={() => setManageModal({...manageModal, isOpen: false})} className="p-2 hover:bg-white/10 rounded-xl transition"><X size={20}/></button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                 <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Plan & Credits</h4>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Credit Balance</label>
                      <input type="number" value={manageModal.kredit} onChange={(e) => setManageModal({...manageModal, kredit: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Package Plan</label>
                      <select value={manageModal.status_langganan} onChange={(e) => setManageModal({...manageModal, status_langganan: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 uppercase">
                        <option value="free">Free Plan</option>
                        <option value="basic">Basic Plan</option>
                        <option value="pro">Pro Plan</option>
                        <option value="ultimate">Ultimate Plan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Expiry Date (Optional)</label>
                      <input type="date" value={manageModal.expiryDate} onChange={(e) => setManageModal({...manageModal, expiryDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                    </div>
                 </div>

                 <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Account Restrictions</h4>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <div>
                        <p className="font-black text-sm text-red-900 flex items-center gap-2"><Ban size={16}/> Suspend Account</p>
                        <p className="text-[10px] font-bold text-red-500 mt-1">Block login</p>
                      </div>
                      <div onClick={() => setManageModal({...manageModal, isSuspended: !manageModal.isSuspended})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner flex-shrink-0 ${manageModal.isSuspended ? 'bg-red-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${manageModal.isSuspended ? 'left-7' : 'left-1'}`}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <div>
                        <p className="font-black text-sm text-amber-900 flex items-center gap-2"><Lock size={16}/> Lock Credits</p>
                        <p className="text-[10px] font-bold text-amber-600 mt-1">Prevent sending</p>
                      </div>
                      <div onClick={() => setManageModal({...manageModal, isCreditLocked: !manageModal.isCreditLocked})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner flex-shrink-0 ${manageModal.isCreditLocked ? 'bg-amber-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${manageModal.isCreditLocked ? 'left-7' : 'left-1'}`}></div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setManageModal({ ...manageModal, isOpen: false })} className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100">Cancel</button>
              <button disabled={isSavingUser} onClick={handleSaveUser} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                 {isSavingUser ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Client
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 hidden lg:flex">
        <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-slate-950 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <ShieldAlert size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight tracking-tight">AR CONNECT</h1>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Overview' },
            { id: 'users', icon: Users, label: 'Client Management' },
            { id: 'packages', icon: Layers, label: 'Plan Configurations' },
            { id: 'rewards', icon: Gift, label: 'Rewards & Vouchers' },
            { id: 'settings', icon: Settings, label: 'System Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 translate-x-1' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 opacity-60">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><User size={14}/></div>
             <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">System Admin</p>
                <p className="text-xs font-bold text-white">admin@arconnect.my</p>
             </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-xs uppercase tracking-widest font-black text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        
        <header className="bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 lg:px-8 py-4 sm:h-24 sticky top-0 z-10 flex-shrink-0 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 capitalize tracking-tight">
              {activeTab === 'users' ? 'Client Management' : activeTab === 'settings' ? 'System Settings' : activeTab === 'packages' ? 'Plan Configurations' : activeTab === 'rewards' ? 'Rewards & Vouchers' : 'Admin Dashboard'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Administrator Control Panel</p>
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-2 lg:hidden overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><LayoutDashboard size={16}/> Dash</button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><Users size={16}/> Clients</button>
            <button onClick={() => setActiveTab('rewards')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'rewards' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}><Gift size={16}/> Rewards</button>
            <button onClick={onLogout} className="p-2.5 bg-red-50 text-red-500 rounded-xl flex-shrink-0"><LogOut size={16}/></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            
            {activeTab === 'dashboard' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Clients</p>
                        <p className="text-3xl font-black text-slate-900">{totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active WA Devices</p>
                        <p className="text-3xl font-black text-slate-900">{activeWADevices}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><Smartphone size={24}/></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits Allocated</p>
                        <p className="text-3xl font-black text-slate-900">{totalCreditsInSystem.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><Coins size={24}/></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Suspended</p>
                        <p className="text-3xl font-black text-red-500">{suspendedUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"><UserX size={24}/></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2">System Status Normal</h3>
                    <p className="text-slate-400 text-sm font-medium">All APIs and core server functions are operating securely.</p>
                  </div>
                  <div className="relative z-10 mt-6 md:mt-0 flex gap-3">
                    <button onClick={fetchUsers} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"><RefreshCw size={16}/> Sync Database</button>
                  </div>
                  <Server className="absolute -left-10 -bottom-10 text-white/5 scale-150 rotate-12" size={200}/>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="max-w-[90rem] mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[75vh]">
                  <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div>
                      <h3 className="font-black text-lg text-slate-800">Registered Clients Database</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage plans, credits & access restrictions</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search client or email..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2.5 sm:py-3 w-full sm:w-64 bg-white border border-slate-200 rounded-full text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" 
                        />
                      </div>
                      <button onClick={fetchUsers} className="flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> {loading ? 'Syncing...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto overflow-y-auto relative">
                    {loading && allUsers.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                         <Loader2 className="animate-spin text-emerald-500" size={40}/>
                      </div>
                    ) : null}

                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-4 sm:p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Client Info</th>
                          <th className="p-4 sm:p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Plan & Credit</th>
                          <th className="p-4 sm:p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</th>
                          <th className="p-4 sm:p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Last Active</th>
                          <th className="p-4 sm:p-5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => {
                          const planKey = u.status_langganan || 'free';
                          const uAllowImage = packageSettings[planKey]?.allowImage;
                          const uAllowVideo = packageSettings[planKey]?.allowVideo;

                          return (
                          <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="p-4 sm:p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 shadow-sm overflow-hidden flex-shrink-0">
                                   {u.profilePic ? <img src={u.profilePic} alt="pic" className="w-full h-full object-cover"/> : <Building2 size={18}/>}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm flex items-center gap-1">
                                    {u.nama_syarikat} {u.isSuspended && <Ban size={12} className="text-red-500"/>}
                                  </p>
                                  <p className="text-xs font-bold text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 sm:p-5">
                              <div className="flex flex-col gap-1">
                                <span className={`text-[9px] font-black uppercase w-max px-2 py-0.5 rounded ${
                                  u.status_langganan === 'basic' ? 'bg-blue-100 text-blue-700' :
                                  u.status_langganan === 'pro' ? 'bg-amber-100 text-amber-700' : 
                                  u.status_langganan === 'ultimate' ? 'bg-purple-100 text-purple-700' : 
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {u.status_langganan || 'Free'} Plan
                                </span>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-black text-slate-900 text-lg">{u.kredit?.toLocaleString()}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Unit</span>
                                  {u.isCreditLocked && <Lock size={12} className="text-amber-500 ml-1" title="Credits Locked"/>}
                                </div>
                              </div>
                            </td>

                            <td className="p-4 sm:p-5 space-y-1.5">
                              <div className="flex gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max ${u.sesi_whatsapp_aktif ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${u.sesi_whatsapp_aktif ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                  {u.sesi_whatsapp_aktif ? 'WA Linked' : 'No WA'}
                                </span>
                                {u.isSuspended && (
                                  <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 mt-1">
                                {uAllowImage ? <ImageIcon size={12} className="text-blue-500" title="Image Allowed by Plan"/> : <ImageIcon size={12} className="text-slate-300"/>}
                                {uAllowVideo ? <Film size={12} className="text-purple-500" title="Video Allowed by Plan"/> : <Film size={12} className="text-slate-300"/>}
                              </div>
                            </td>

                            <td className="p-4 sm:p-5">
                               <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Clock size={12} className="text-slate-400"/> {timeSince(u.updatedAt || u.createdAt)}
                               </p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                  {new Date(u.updatedAt || u.createdAt).toLocaleDateString()}
                               </p>
                            </td>

                            <td className="p-4 sm:p-5 text-right">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => openManageModal(u)} className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase">
                                  <Settings size={14}/> Manage
                                </button>
                                <button onClick={() => handleSetTempPassword(u._id, u.nama_syarikat)} className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-3 py-1.5 rounded hover:bg-yellow-500 hover:text-black transition-all text-[10px] font-black uppercase" title="Set Temp Password">
                                  <KeyRound size={14}/> Temp Pass
                                </button>
                                <button onClick={() => handleDeleteUser(u._id, u.nama_syarikat)} className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase" title="Padam Pengguna">
                                  <Trash2 size={14}/> Padam
                                </button>
                              </div>
                            </td>
                          </tr>
                        )})}
                        {filteredUsers.length === 0 && !loading && (
                           <tr><td colSpan="5" className="p-16 text-center text-slate-400">
                             <Search size={40} className="mx-auto mb-4 opacity-20"/>
                             <p className="font-black text-lg text-slate-600 mb-1">No clients found.</p>
                             <p className="text-sm font-medium">Try adjusting your search keyword.</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-8 sm:p-10 text-white relative overflow-hidden">
                       <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-black mb-1">Plan Configurations</h3>
                            <p className="text-slate-400 text-sm">Tetapkan kebenaran format mesej secara pukal (pukal) mengikut pakej.</p>
                          </div>
                          <button onClick={handleSavePackageConfig} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95">
                             <Save size={16}/> Save Settings
                          </button>
                       </div>
                       <Layers className="absolute -right-10 -top-10 opacity-10 text-white scale-150 rotate-45" size={200} />
                    </div>

                    <div className="p-6 sm:p-10 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
                           {Object.keys(editPkgSettings).map(planKey => {
                              const plan = editPkgSettings[planKey];
                              return (
                                <div key={planKey} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-all">
                                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black flex-shrink-0 ${planKey === 'pro' || planKey === 'ultimate' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {planKey === 'free' ? <Star size={24}/> : planKey === 'ultimate' ? <ShieldCheck size={24}/> : <Crown size={24}/>}
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-black text-slate-800">{plan.label}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Message Format Access</p>
                                      </div>
                                   </div>

                                   <div className="space-y-4">
                                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-300 transition-colors">
                                        <div>
                                          <p className="font-black text-sm text-slate-800 flex items-center gap-2"><ImageIcon size={16} className="text-blue-500"/> Allow Images</p>
                                        </div>
                                        <div onClick={() => setEditPkgSettings(prev => ({...prev, [planKey]: {...prev[planKey], allowImage: !prev[planKey].allowImage}}))} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner flex-shrink-0 ${plan.allowImage ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${plan.allowImage ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-purple-300 transition-colors">
                                        <div>
                                          <p className="font-black text-sm text-slate-800 flex items-center gap-2"><Film size={16} className="text-purple-500"/> Allow Videos</p>
                                        </div>
                                        <div onClick={() => setEditPkgSettings(prev => ({...prev, [planKey]: {...prev[planKey], allowVideo: !prev[planKey].allowVideo}}))} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner flex-shrink-0 ${plan.allowVideo ? 'bg-purple-500' : 'bg-slate-300'}`}>
                                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${plan.allowVideo ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                      </div>
                                   </div>
                                </div>
                              );
                           })}
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                 {/* SECTION 1: BULK CREDIT BLAST */}
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                    <div className="bg-blue-600 p-8 sm:p-10 text-white relative overflow-hidden md:w-1/3 flex flex-col justify-center">
                       <div className="relative z-10">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><Zap size={24}/></div>
                          <h3 className="text-2xl font-black mb-2">Global Credit Blast</h3>
                          <p className="text-blue-100 text-sm">Berikan kredit bonus kepada SEMUA akaun yang berdaftar secara serentak.</p>
                       </div>
                       <TrendingUp className="absolute -right-10 -bottom-10 opacity-10 text-white scale-150" size={150} />
                    </div>
                    <div className="p-8 sm:p-10 md:w-2/3 flex flex-col justify-center bg-slate-50">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Kredit Untuk Setiap Pengguna</label>
                           <div className="flex gap-4">
                             <input 
                                type="number" 
                                value={bulkCreditAmount} 
                                onChange={(e) => setBulkCreditAmount(e.target.value)} 
                                placeholder="Contoh: 500" 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg focus:border-blue-500 outline-none transition-colors text-slate-900" 
                             />
                             <button 
                                onClick={handleBulkCreditBlast} 
                                disabled={isBlastingCredit || !allUsers.length}
                                className="px-8 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 whitespace-nowrap active:scale-95 disabled:opacity-50"
                             >
                                {isBlastingCredit ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Blast Now
                             </button>
                           </div>
                           <p className="text-xs font-bold text-slate-400 flex items-center gap-2"><Users size={14}/> Tindakan ini akan mengemaskini {allUsers.length} pelanggan.</p>
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* SECTION 2: DEFAULT REGISTER CREDIT */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><UserPlus size={24}/></div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">New Registration Bonus</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kredit percuma (Default)</p>
                          </div>
                       </div>
                       <p className="text-sm font-medium text-slate-500 mb-6">Berapa kredit automatik yang akan dimasukkan ke akaun pelanggan sebaik sahaja mereka mendaftar di sistem.</p>
                       
                       <div className="flex gap-3">
                         <input 
                            type="number" 
                            value={defaultRegCredit} 
                            onChange={(e) => setDefaultRegCredit(e.target.value)} 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg focus:border-purple-500 outline-none transition-colors text-slate-900 text-center" 
                          />
                         <button 
                            onClick={handleSaveDefaultRegCredit} 
                            disabled={isSavingRegCredit}
                            className="px-6 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-200 whitespace-nowrap active:scale-95"
                         >
                            {isSavingRegCredit ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save
                         </button>
                       </div>
                    </div>

                    {/* SECTION 3: VOUCHER & PIN GENERATOR */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><TicketPercent size={24}/></div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">Voucher & PIN Generator</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cipta Kod Penebusan</p>
                          </div>
                       </div>
                       
                       <form onSubmit={handleCreateVoucher} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5 col-span-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Voucher / Reload PIN Code</label>
                               <div className="flex gap-2">
                                 <input type="text" required value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value})} placeholder="Cth: RAYA2026 atau PIN-XXX" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-green-500 uppercase transition-colors" />
                                 <button type="button" onClick={generateRandomPin} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm" title="Auto-Generate Random PIN">
                                   <Wand2 size={16}/> Gen PIN
                                 </button>
                               </div>
                             </div>
                             <div className="space-y-1.5 col-span-2 sm:col-span-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Amount</label>
                               <input type="number" required value={newVoucher.amount} onChange={e => setNewVoucher({...newVoucher, amount: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-green-500" />
                             </div>
                             <div className="space-y-1.5 col-span-2 sm:col-span-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usage Limit (Max Uses)</label>
                               <input type="number" required value={newVoucher.maxUses} onChange={e => setNewVoucher({...newVoucher, maxUses: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-green-500" />
                               <p className="text-[9px] text-slate-400 font-bold mt-1">Set '1' untuk Single-Use Reload PIN.</p>
                             </div>
                          </div>
                          <button disabled={isCreatingVoucher} type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-green-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md mt-2">
                             {isCreatingVoucher ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} Generate Code
                          </button>
                       </form>
                    </div>
                 </div>

                 {/* VOUCHER LIST TABLE */}
                 <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                       <h3 className="font-black text-slate-800">Senarai Voucher & Reload PIN Aktif</h3>
                       <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black">{vouchers.length} Rekod</div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50/80">
                             <tr>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Kod (Voucher/PIN)</th>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Jumlah Kredit</th>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Jenis & Tebusan</th>
                               <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Tindakan</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {vouchers.map(v => (
                               <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 font-black text-slate-800 tracking-widest">{v.code}</td>
                                  <td className="p-4 font-black text-green-600">+{v.amount}</td>
                                  <td className="p-4 font-bold text-slate-500 text-xs flex flex-col gap-1">
                                     <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider w-max ${v.maxUses === 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {v.maxUses === 1 ? 'Single-Use PIN' : 'Promo Voucher'}
                                     </span>
                                     <span className="text-xs">
                                         Digunakan: <span className={v.currentUses >= v.maxUses ? 'text-red-500' : 'text-slate-800'}>{v.currentUses}</span> / {v.maxUses}
                                     </span>
                                  </td>
                                  <td className="p-4 text-right">
                                     <button onClick={() => handleDeleteVoucher(v._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm">
                                        <Trash2 size={16}/>
                                     </button>
                                  </td>
                               </tr>
                             ))}
                             {vouchers.length === 0 && (
                               <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold text-sm">Tiada Rekod aktif setakat ini.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>

              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-8 sm:p-10 text-white relative overflow-hidden">
                       <div className="relative z-10">
                          <h3 className="text-2xl font-black mb-1">System Configuration</h3>
                          <p className="text-slate-400 text-sm">Manage Super Admin profile and global settings.</p>
                       </div>
                       <Settings className="absolute -right-10 -top-10 opacity-10 text-white scale-150 rotate-45" size={200} />
                    </div>

                    <div className="p-6 sm:p-10 space-y-10">
                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Settings</h4>
                            <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-50 flex-shrink-0 text-emerald-500"><Lock size={24} /></div>
                                    <div>
                                      <h3 className="text-lg font-black text-slate-800">Change Admin Password</h3>
                                      <p className="text-xs font-bold text-slate-400">Keep your master account secure</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <input type="password" required value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-emerald-500 font-bold transition-colors text-sm text-slate-800" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input type="password" required value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-emerald-500 font-bold transition-colors text-sm text-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                        <input type="password" required value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-emerald-500 font-bold transition-colors text-sm text-slate-800" />
                                    </div>
                                </div>
                                <button disabled={isUpdatingPwd} type="submit" className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95">
                                    {isUpdatingPwd ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                                    Update Password
                                </button>
                            </form>
                        </section>
                    </div>
                 </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

/* ============================================================================
   USER PORTAL (CLIENT)
   ============================================================================ */
const UserPortal = ({ currentUser, token, onLogout, onUpdateUser, packageSettings }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [credits, setCredits] = useState(currentUser.kredit || 0);
  
  const [isDeviceLinked, setIsDeviceLinked] = useState(false);
  const [qrStatus, setQrStatus] = useState('idle'); 
  const [qr, setQr] = useState(null);
  const isRequesting = useRef(false);

  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);
  const [messagesSent, setMessagesSent] = useState(0);
  const [messagesFailed, setMessagesFailed] = useState(0);
  const [message, setMessage] = useState('');
  const [targetSource, setTargetSource] = useState('manual');
  const [manualNumbers, setManualNumbers] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [messageFormat, setMessageFormat] = useState('text'); 
  const [delayTime, setDelayTime] = useState(2); 
  const [campaigns, setCampaigns] = useState([]);

  const [mediaFile, setMediaFile] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ nama: '', nombor_telefon: '', kumpulan: 'General' });
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false); 
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [searchContactQuery, setSearchContactQuery] = useState('');

  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nama_syarikat: currentUser.nama_syarikat || '',
    profilePic: currentUser.profilePic || null
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });
  const [blastResultModal, setBlastResultModal] = useState({ isOpen: false, success: 0, failed: 0 });

  const currentPlan = currentUser.status_langganan || 'free';
  const isExpired = currentUser.expiryDate ? new Date() > new Date(currentUser.expiryDate) : false;
  
  const isFreePlan = currentPlan === 'free';
  const currentPlanSettings = packageSettings[currentPlan] || DEFAULT_PACKAGE_SETTINGS[currentPlan];
  const canUseImage = currentPlanSettings.allowImage;
  const canUseVideo = currentPlanSettings.allowVideo;

  const minDelayAllowed = isFreePlan ? 5 : 2;

  const uniqueGroups = useMemo(() => {
    const groups = new Set(contacts.map(c => c.kumpulan));
    return Array.from(groups);
  }, [contacts]);

  const displayedContacts = useMemo(() => {
    if (!searchContactQuery) return contacts;
    const lowerQuery = searchContactQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.nama.toLowerCase().includes(lowerQuery) || 
      contact.nombor_telefon.includes(lowerQuery) ||
      contact.kumpulan.toLowerCase().includes(lowerQuery)
    );
  }, [contacts, searchContactQuery]);

  const showNotification = (title, message, type = 'info') => {
    setNotification({ show: true, title, message, type });
  };

  const fetchData = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const [contactRes, campaignRes] = await Promise.all([
        fetch(`${API_URL}/contacts/${userId}`),
        fetch(`${API_URL}/campaigns/${userId}`)
      ]);
      if (contactRes.ok) setContacts(await contactRes.json());
      if (campaignRes.ok) setCampaigns(await campaignRes.json());
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
    setCredits(currentUser.kredit || 0);
    if(delayTime < minDelayAllowed) setDelayTime(minDelayAllowed);
    // eslint-disable-next-line
  }, [activeTab, currentUser, minDelayAllowed]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.nombor_telefon) return;
    
    setIsAddingContact(true);
    try {
      const res = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id || currentUser._id, ...newContact })
      });
      if (res.ok) {
        setNewContact({ nama: '', nombor_telefon: '', kumpulan: 'General' });
        fetchData();
        showNotification("Success", "New contact has been saved.", "success");
      }
    } catch (err) { showNotification("Error", "Failed to save contact.", "error");
    } finally { setIsAddingContact(false); }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {}
  };

  const handleDeleteAllContacts = async () => {
    if (!window.confirm("WARNING! Are you sure you want to delete ALL contacts?")) return;
    setIsDeletingAll(true);
    try {
      await Promise.all(contacts.map(contact => fetch(`${API_URL}/contacts/${contact._id}`, { method: 'DELETE' })));
      showNotification("Completed", "All contacts deleted!", "success");
      fetchData();
    } catch (err) { showNotification("Error", "An error occurred.", "error");
    } finally { setIsDeletingAll(false); }
  };

  const handleFormatChange = (format) => {
    if (format === 'image' && !canUseImage) {
      showNotification("Akses Dihadkan", "Penghantaran gambar tidak dibenarkan dalam pakej anda.", "warning");
      return;
    }
    if (format === 'video' && !canUseVideo) {
      showNotification("Akses Dihadkan", "Penghantaran video tidak dibenarkan dalam pakej anda.", "warning");
      return;
    }
    setMessageFormat(format);
    setMediaFile(null); 
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      showNotification("File Too Large", "Maximum file size is 16MB.", "warning");
      e.target.value = null; return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaFile({ file: file, type: file.type, name: file.name, base64: event.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = null; 
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingCSV(true);
    
    try {
      const XLSX = await new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('Failed to load XLSX'));
        document.head.appendChild(script);
      });
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
          const newContacts = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            let col0 = row[0] !== undefined ? String(row[0]).trim() : '';
            let col1 = row[1] !== undefined ? String(row[1]).trim() : '';
            let col2 = row[2] !== undefined ? String(row[2]).trim() : '';
            if (col0 && !col1 && col0.includes(',')) {
                const splitCols = col0.split(/[,;\t]/);
                col0 = splitCols[0] ? splitCols[0].replace(/"/g, '').trim() : '';
                col1 = splitCols[1] ? splitCols[1].replace(/"/g, '').trim() : '';
                col2 = splitCols[2] ? splitCols[2].replace(/"/g, '').trim() : '';
            }

            let nama = col0; let nombor = col1; let kumpulan = col2;

            if (!nombor && nama) {
                const possibleNumber = nama.replace(/[^0-9]/g, '');
                if (possibleNumber.length > 8) { nombor = possibleNumber; nama = 'Customer'; }
            }

            if (i === 0 && (nama.toLowerCase().includes('name') || nama.toLowerCase().includes('nama') || (nombor && nombor.toLowerCase().includes('number')))) continue;
            
            const cleanPhone = nombor ? nombor.replace(/[^0-9]/g, '') : '';
            if (!cleanPhone || cleanPhone.length < 8) continue; 

            newContacts.push({
              nama: nama || 'Customer',
              nombor_telefon: cleanPhone,
              kumpulan: kumpulan || 'Excel/CSV Import'
            });
          }

          if (newContacts.length === 0) {
            showNotification("Invalid Format", "No valid data found.", "warning");
            setIsUploadingCSV(false); return;
          }

          const res = await fetch(`${API_URL}/contacts/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id || currentUser._id, contacts: newContacts })
          });
          if (res.ok) {
            showNotification("Import Successful", `${newContacts.length} contacts saved!`, "success");
            fetchData(); 
          }
        } catch (err) {
          showNotification("File Error", "Failed to process file.", "error");
        } finally {
          setIsUploadingCSV(false);
          if (e.target) e.target.value = null;
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      showNotification("Error", "Failed to load Excel engine.", "error");
      setIsUploadingCSV(false);
    }
  };

  const connectWA = async () => {
    setQrStatus('loading'); setQr(null);
    try { await fetch(`${API_URL}/whatsapp/connect/${currentUser.id || currentUser._id}`); } 
    catch (err) { setQrStatus('error'); }
  };

  const logoutWA = async () => {
    setQrStatus('disconnecting');
    try {
      await fetch(`${API_URL}/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id || currentUser._id })
      });
    } catch (err) {}
    setQrStatus('idle'); setIsDeviceLinked(false); setQr(null);
  };

  useEffect(() => {
    let interval; let isMounted = true;
    const userId = currentUser.id || currentUser._id;
    const checkServerStatus = async () => {
      if (isRequesting.current) return; 
      isRequesting.current = true;
      try {
        const res = await fetch(`${API_URL}/whatsapp/connect/${userId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.status === 'connected' || data.connected) {
          setQrStatus('connected'); setIsDeviceLinked(true); setQr(null);
        } else if (data.status === 'disconnected') { 
          setQrStatus('idle'); setIsDeviceLinked(false); setQr(null);
        } else if (data.qr && qrStatus !== 'connected') {
          setQr(prevQr => prevQr !== data.qr ? data.qr : prevQr); setQrStatus('qr_ready');
        }
      } catch (err) {} finally { isRequesting.current = false; }
    };

    if (qrStatus === 'loading' || qrStatus === 'qr_ready') { interval = setInterval(checkServerStatus, 1500); } 
    else if (qrStatus === 'connected') { interval = setInterval(checkServerStatus, 5000); }

    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, [qrStatus, currentUser]);

  const startBlast = async () => {
    if (currentUser.isCreditLocked) {
      return showNotification("Action Denied", "Kredit anda telah dikunci. Sila hubungi Admin.", "error");
    }
    if (isExpired) {
      return showNotification("Subscription Expired", "Sila perbaharui pelan anda untuk menghantar mesej.", "error");
    }
    if (delayTime < minDelayAllowed) {
      return showNotification("Warning", `Minimum delay for your plan is ${minDelayAllowed} seconds.`, "warning");
    }

    if (!isDeviceLinked) { 
      showNotification("Session Inactive", "Please connect your WhatsApp first.", "warning");
      setActiveTab('dashboard'); return; 
    }

    let numbers = [];
    if (targetSource === 'manual') {
      numbers = manualNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 5);
    } else {
      const filteredContacts = selectedGroup === 'all' ? contacts : contacts.filter(c => c.kumpulan === selectedGroup);
      numbers = filteredContacts.map(c => c.nombor_telefon);
    }

    if (numbers.length === 0) return showNotification("No Target", "Please add target numbers.", "warning");
    if (messageFormat !== 'text' && !mediaFile) return showNotification("File Required", "Please upload media.", "warning");
    if (messageFormat === 'text' && !message) return showNotification("Empty Message", "Please type a message.", "warning");
    if (credits < numbers.length) return showNotification("Insufficient Credits", `You need ${numbers.length} credits.`, "error");

    setIsBlasting(true); setBlastProgress(0); setMessagesSent(0); setMessagesFailed(0);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < numbers.length; i++) {
      try {
        let targetNumber = numbers[i].replace(/[^0-9]/g, '');
        if (targetNumber.startsWith('0')) targetNumber = '6' + targetNumber; 
        else if (targetNumber.startsWith('+')) targetNumber = targetNumber.substring(1);

        const payload = { userId: currentUser.id || currentUser._id, to: targetNumber, message };
        if (messageFormat !== 'text' && mediaFile) {
            payload.media = mediaFile.base64.split(',')[1];
            payload.mediaType = mediaFile.type; 
            payload.fileName = mediaFile.name;
        }

        const res = await fetch(`${API_URL}/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) { successCount++; setMessagesSent(successCount); setCredits(prev => prev - 1); } 
        else { failCount++; setMessagesFailed(failCount); }
      } catch (err) { failCount++; setMessagesFailed(failCount); }
      
      setBlastProgress(Math.floor(((i + 1) / numbers.length) * 100));
      await new Promise(resolve => setTimeout(resolve, delayTime * 1000)); 
    }
    
    try {
      await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id || currentUser._id,
          nama_kempen: `Blast Campaign - ${new Date().toLocaleDateString()}`,
          mesej: message || 'Media Campaign',
          jumlah_sasaran: numbers.length,
          jumlah_berjaya: successCount,
          jumlah_gagal: failCount,
          status: 'completed'
        })
      });
    } catch(err) {}

    setTimeout(() => {
      setIsBlasting(false);
      setBlastResultModal({ isOpen: true, success: successCount, failed: failCount });
    }, 1500);
  };

  const handlePurchasePackage = (pkg, type = 'topup') => {
    const adminPhone = "60169012445";
    let text = type === 'subscription' 
      ? `Hi AR Connect Admin,\n\nI am ${currentUser.nama_syarikat} (${currentUser.email}) and I am interested in subscribing to:\n\n📅 *Plan: ${pkg.name}*\n💎 *Quota: ${pkg.credits.toLocaleString()} Credits/month*\n💰 *Price: RM${pkg.price}/month*`
      : `Hi AR Connect Admin,\n\nI am ${currentUser.nama_syarikat} (${currentUser.email}) and I am interested in purchasing a Topup:\n\n📦 *Package: ${pkg.label}*\n💎 *Amount: ${pkg.amount.toLocaleString()} Credits ${pkg.bonus ? `(${pkg.bonus})` : ''}*\n💰 *Price: RM${pkg.price}*`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return showNotification("Gagal", "Sila masukkan Kod Voucher atau PIN Topup terlebih dahulu.", "warning");
    setIsRedeeming(true);
    try {
       const res = await fetch(`${API_URL}/vouchers/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId: currentUser.id || currentUser._id, code: voucherCode.toUpperCase() })
       });
       const data = await res.json();
       if (res.ok) {
          setCredits(prev => prev + data.amount);
          const updatedUser = { ...currentUser, kredit: (currentUser.kredit || 0) + data.amount };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          onUpdateUser(updatedUser);
          showNotification("Berjaya!", `Tahniah! ${data.amount} Kredit telah dimasukkan ke akaun anda secara automatik.`, "success");
          setVoucherCode('');
       } else {
          showNotification("Tidak Sah", data.message || "Kod tidak sah atau telah digunakan.", "error");
       }
    } catch(err) {
       showNotification("Ralat", "Pelayan sistem sedang sibuk, sila cuba sebentar lagi.", "error");
    }
    setIsRedeeming(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) return showNotification("Error", "New passwords do not match.", "error");
    setIsUpdatingPwd(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: currentUser.id || currentUser._id, old: pwdData.old, new: pwdData.new })
      });
      if (res.ok) {
        showNotification("Success", "Password updated successfully.", "success");
        setPwdData({ old: '', new: '', confirm: '' });
      } else {
        const data = await res.json();
        showNotification("Error", data.message || "Failed to update password.", "error");
      }
    } catch (err) { showNotification("Error", "Server connection error.", "error"); }
    finally { setIsUpdatingPwd(false); }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("File Too Large", "Profile picture must be under 2MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData({ ...profileData, profilePic: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          nama_syarikat: profileData.nama_syarikat,
          profilePic: profileData.profilePic
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = { 
          ...currentUser, 
          nama_syarikat: data.user.nama_syarikat, 
          profilePic: data.user.profilePic 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdateUser(updatedUser); 
        showNotification("Success", "Profile saved to database successfully.", "success");
      } else {
        const errorData = await res.json();
        showNotification("Error", errorData.message || "Failed to save profile.", "error");
      }
    } catch (err) {
      showNotification("Error", "Server connection error.", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (currentUser.isSuspended) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="text-center space-y-6 max-w-md animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <Ban size={48} className="text-red-500" />
           </div>
           <div>
              <h1 className="text-3xl font-black mb-2">Akaun Digantung</h1>
              <p className="text-slate-400 text-sm leading-relaxed">Akses ke AR Connect telah disekat untuk akaun ini kerana masalah polisi atau pembayaran. Sila hubungi Admin kami untuk bantuan.</p>
           </div>
           <button onClick={onLogout} className="w-full px-6 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">
               Kembali ke Log Masuk
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50 text-slate-800 w-full font-sans relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex justify-center mb-5">
              {notification.type === 'warning' ? <AlertCircle size={56} className="text-amber-500" /> :
               notification.type === 'error' ? <XCircle size={56} className="text-red-500" /> :
               <CheckCircle2 size={56} className="text-green-500" />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{notification.title}</h3>
            <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">{notification.message}</p>
            <button onClick={() => setNotification({ ...notification, show: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black tracking-wide hover:bg-slate-800 transition-colors active:scale-95">Tutup</button>
          </div>
        </div>
      )}

      {blastResultModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
            <div className="bg-green-500 p-8 text-center text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-center mb-4"><div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30"><CheckCircle2 size={40} className="text-white drop-shadow-md" /></div></div>
              <h3 className="text-3xl font-black relative z-10 tracking-tight mb-1">Campaign Completed</h3>
              <p className="text-green-100 font-medium relative z-10 text-sm">Message delivery report</p>
              <Send className="absolute -right-6 -bottom-6 opacity-10 rotate-12 scale-150" size={120}/>
            </div>
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-center bg-green-50 p-4 rounded-2xl flex-1 border border-green-100 shadow-sm"><p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Success</p><p className="text-4xl font-black text-green-600">{blastResultModal.success}</p></div>
                <div className="text-center bg-red-50 p-4 rounded-2xl flex-1 border border-red-100 shadow-sm"><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Failed</p><p className="text-4xl font-black text-red-500">{blastResultModal.failed}</p></div>
              </div>
              <button 
                onClick={() => {
                  setMessage(''); setManualNumbers('');
                  setMediaFile(null); setMessageFormat('text'); setTargetSource('manual'); setSelectedGroup('all'); setDelayTime(minDelayAllowed);
                  setBlastResultModal({ isOpen: false, success: 0, failed: 0 });
                  setActiveTab('history');
                }} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-white border-r border-slate-100 h-full flex flex-col flex-shrink-0 hidden lg:flex">
        <div className="p-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 p-2 rounded-xl text-white"><Send size={20} fill="currentColor" /></div>
            <span className="text-xl font-black tracking-tight text-slate-900">AR CONNECT</span>
          </div>
          
          <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-black opacity-60 uppercase mb-1 tracking-widest relative z-10 flex items-center gap-2">
              Credit Balance {currentUser.isCreditLocked && <Lock size={10} className="text-amber-400"/>}
            </p>
            <div className="flex items-baseline gap-2 relative z-10"><span className="text-3xl font-black">{credits.toLocaleString()}</span><span className="text-xs opacity-50">Units</span></div>
            <button onClick={() => setActiveTab('topup')} className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 relative z-10"><PlusCircle size={14} /> Packages & Topup</button>
            <Coins className="absolute -right-4 -bottom-4 text-white opacity-5 rotate-12 group-hover:scale-110 transition duration-500" size={100} />
          </div>

          <div className="mt-4 flex flex-col gap-2">
             <div className={`p-3 rounded-xl flex items-center gap-3 border text-xs font-bold ${isExpired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                <Calendar size={14}/> 
                <span>{currentUser.expiryDate ? `Exp: ${new Date(currentUser.expiryDate).toLocaleDateString()}` : 'Tiada Tarikh Luput'}</span>
             </div>
             {currentUser.isCreditLocked && (
               <div className="p-3 rounded-xl flex items-center gap-3 border bg-amber-50 text-amber-700 border-amber-100 text-xs font-bold">
                 <Lock size={14}/> Kredit Dikunci Admin
               </div>
             )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hide-scrollbar px-6 space-y-2 py-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'blast', icon: Send, label: 'Fast Blast' },
            { id: 'contacts', icon: Users, label: 'Database' },
            { id: 'history', icon: History, label: 'Blast History' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${activeTab === item.id ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 pt-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0">
               {currentUser.profilePic ? <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User size={18} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Plan: {currentPlanSettings.label}</p>
              <p className="text-xs font-bold truncate text-slate-800">{currentUser.nama_syarikat}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3.5 text-red-500 font-black hover:bg-red-50 hover:scale-[1.02] active:scale-95 rounded-2xl transition-all border border-transparent text-[10px] uppercase tracking-widest"><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg lg:text-xl font-black capitalize text-slate-900">{activeTab === 'history' ? 'Blast History' : activeTab}</h2>
            <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Client Portal / {currentUser.nama_syarikat}</p>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex flex-col text-right hidden sm:flex"><span className="text-sm font-black text-slate-900">{currentUser.nama_syarikat}</span><span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active License</span></div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden hidden sm:flex cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('settings')}>
              {currentUser.profilePic ? <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User className="text-slate-400" />}
            </div>
            
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={() => setActiveTab('topup')} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-sm active:scale-95 transition-all hover:bg-slate-800">
                <Coins size={16} className="text-yellow-400" />
                <div className="flex flex-col text-left hidden min-[360px]:flex">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">Kredit</span>
                  <span className="text-xs font-black leading-none">{credits.toLocaleString()}</span>
                </div>
                <PlusCircle size={14} className="text-green-400" />
              </button>
              
              <button onClick={onLogout} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 pb-24 lg:pb-10">
          
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6 lg:space-y-10">
              
              {isExpired && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                   <AlertCircle size={20}/>
                   <span className="font-bold text-sm">Langganan anda telah luput. Sila perbaharui pelan anda untuk terus membuat penghantaran mesej.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Ready to Send', val: credits.toLocaleString(), color: 'blue', icon: Send },
                  { label: 'Database Contacts', val: contacts.length.toString(), color: 'green', icon: Users },
                  { label: 'Device Status', val: isDeviceLinked ? 'Active' : 'Inactive', color: isDeviceLinked ? 'green' : 'amber', icon: Activity },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 sm:gap-6 hover:scale-[1.02] transition-all cursor-default">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-500 flex-shrink-0`}><stat.icon size={24} /></div>
                    <div><p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p><p className="text-xl sm:text-2xl font-black text-slate-900">{stat.val}</p></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-8 sm:mb-10">
                    <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900"><ShieldCheck className="text-green-500" /> WhatsApp Device</h3>
                    <span className={`px-3 sm:px-4 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase ${qrStatus === 'connected' ? 'bg-green-100 text-green-600' : qrStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {qrStatus === 'connected' ? 'CONNECTED' : qrStatus === 'error' ? 'ERROR' : 'NOT CONNECTED'}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 min-h-[300px] sm:min-h-[400px]">
                    {qrStatus === 'loading' || qrStatus === 'disconnecting' ? (
                      <div className="text-center"><Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={40} /><p className="text-slate-600 font-bold text-sm">{qrStatus === 'disconnecting' ? "Disconnecting..." : "Loading Chrome engine..."}</p></div>
                    ) : qrStatus === 'error' ? (
                      <div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500"><AlertCircle size={32} /></div><h4 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Failed to Connect</h4><button onClick={connectWA} className="px-6 sm:px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase mt-4">Try Again</button></div>
                    ) : qrStatus === 'qr_ready' ? (
                      <div className="text-center space-y-4 sm:space-y-6 w-full flex flex-col items-center"><QRCodeImage value={qr} size={180} /><p className="text-xs sm:text-sm font-bold text-slate-500">Scan QR using your WhatsApp</p><Loader2 className="animate-spin text-green-500 mx-auto mt-2" /></div>
                    ) : qrStatus === 'connected' ? (
                      <div className="text-center"><div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100"><CheckCircle2 size={40} /></div><h4 className="text-xl sm:text-2xl font-black mb-2 text-slate-900">Connected Automatically!</h4><button onClick={logoutWA} className="px-6 sm:px-8 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] sm:text-xs uppercase mt-4">Disconnect</button></div>
                    ) : (
                      <div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400"><QrCode size={32} /></div><button onClick={connectWA} className="px-6 sm:px-10 py-4 sm:py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all text-xs sm:text-sm"><Zap size={18} /> Generate QR Code</button></div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 h-full">
                  <div className="bg-green-500 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 text-white shadow-xl shadow-green-100 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer h-full flex flex-col justify-center" onClick={() => setActiveTab('blast')}>
                    <h3 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 group-hover:-translate-y-1 transition-all">Fast Blast</h3>
                    <p className="text-sm sm:text-base font-bold opacity-80 mb-8 sm:mb-10 max-w-[280px]">Send thousands of messages instantly without saving numbers.</p>
                    <button className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-green-600 rounded-2xl font-black uppercase text-xs sm:text-sm shadow-lg hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 relative z-10 w-max">Start Now <ArrowRight size={18} /></button>
                    <Send className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" size={180} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Campaign History</h2>
                    <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Review your previous blast campaigns.</p>
                  </div>
                  <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:text-green-600 hover:border-green-200 transition-all w-full sm:w-auto justify-center">
                      <RefreshCw size={16} /> Refresh
                  </button>
                </div>

                {campaigns.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 sm:p-20 text-center flex flex-col items-center justify-center">
                        <History size={48} className="text-slate-200 mb-4" />
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2">No History Found</h3>
                        <p className="text-slate-500 font-medium text-sm">You haven't sent any blast campaigns yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {campaigns.map((c) => (
                            <div key={c._id} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 flex-shrink-0">
                                        <History size={20}/>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-slate-900 text-base sm:text-lg truncate">{c.nama_kempen}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">{new Date(c.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                                    <div className="bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl flex-1 md:flex-none text-center border border-slate-100 min-w-[80px]">
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                                        <p className="font-black text-slate-800 text-lg sm:text-xl">{c.jumlah_sasaran}</p>
                                    </div>
                                    <div className="bg-green-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl flex-1 md:flex-none text-center border border-green-100 min-w-[80px]">
                                        <p className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Success</p>
                                        <p className="font-black text-green-600 text-lg sm:text-xl">{c.jumlah_berjaya}</p>
                                    </div>
                                    <div className="bg-red-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl flex-1 md:flex-none text-center border border-red-100 min-w-[80px]">
                                        <p className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Failed</p>
                                        <p className="font-black text-red-500 text-lg sm:text-xl">{c.jumlah_gagal}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">System Settings</h2>
                    <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Manage your account profile and security.</p>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative overflow-hidden">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg shadow-green-500/20 relative z-10 overflow-hidden flex-shrink-0">
                            {currentUser.profilePic ? <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" /> : currentUser.nama_syarikat?.[0].toUpperCase()}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.nama_syarikat}</h3>
                            <p className="text-slate-400 font-medium mt-1 text-sm sm:text-base">{currentUser.email}</p>
                        </div>
                        <Settings className="absolute -right-10 -bottom-10 opacity-10 text-white hidden sm:block" size={200} />
                    </div>
                    
                    <div className="p-6 sm:p-10 space-y-10 sm:space-y-12">
                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Profile Settings</h4>
                            <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0"><User size={20} /></div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-800">Edit Profile</h3>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-center border-b border-slate-100 pb-8 text-center sm:text-left">
                                    <div className="relative group flex-shrink-0">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                            {profileData.profilePic ? <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
                                        </div>
                                        <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                                            <UploadCloud size={20} className="mb-1" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1 w-full space-y-4">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Profile Name</label>
                                            <input type="text" required value={profileData.nama_syarikat} onChange={e => setProfileData({...profileData, nama_syarikat: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-colors text-slate-900 text-sm" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 pt-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Cannot be changed)</label>
                                    <input type="email" readOnly value={currentUser.email} className="w-full p-4 bg-slate-100 border border-slate-100 rounded-2xl outline-none font-bold text-slate-500 cursor-not-allowed text-sm" />
                                </div>

                                <button disabled={isUpdatingProfile} type="submit" className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 mt-4">
                                    {isUpdatingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                                    Save Changes
                                </button>
                            </form>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Account Security</h4>
                            <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 flex-shrink-0"><KeyRound size={20} /></div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-800">Change Password</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <input type="password" required value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 font-bold transition-colors text-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input type="password" required value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 font-bold transition-colors text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                        <input type="password" required value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-green-500 font-bold transition-colors text-sm" />
                                    </div>
                                </div>
                                <button disabled={isUpdatingPwd} type="submit" className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95">
                                    {isUpdatingPwd ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                                    Update Password
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contact Database</h2>
                  <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Manage customer lists and organize them by segment.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <form onSubmit={handleAddContact} className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 sm:space-y-6">
                    <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 mb-4 sm:mb-6 text-slate-900"><ListPlus className="text-green-500" /> Add New</h3>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Name</label>
                      <input type="text" required value={newContact.nama} onChange={e => setNewContact({...newContact, nama: e.target.value})} placeholder="e.g. John Doe" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-sm focus:border-green-500 transition-colors outline-none text-slate-800" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input type="text" required value={newContact.nombor_telefon} onChange={e => setNewContact({...newContact, nombor_telefon: e.target.value})} placeholder="e.g. 60123456789" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-sm focus:border-green-500 transition-colors outline-none text-slate-800" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group / Label</label>
                      <input type="text" value={newContact.kumpulan} onChange={e => setNewContact({...newContact, kumpulan: e.target.value})} placeholder="e.g. VIP, General, 2024" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-sm focus:border-green-500 transition-colors outline-none text-slate-800" />
                    </div>

                    <button disabled={isAddingContact} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-green-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 mt-2 sm:mt-4 uppercase tracking-widest flex justify-center items-center gap-2 text-xs sm:text-sm">
                      {isAddingContact ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save Contact
                    </button>
                  </form>

                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-100 transition-all">
                    <h3 className="text-base sm:text-lg font-black flex items-center gap-3 mb-2 text-slate-900"><UploadCloud className="text-blue-500" /> Import Excel / CSV</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-4 sm:mb-6 leading-relaxed">File format must be in Columns A, B, C: <br/><strong className="text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-1">Name, Phone Number, Group</strong></p>
                    
                    <label className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 hover:scale-[1.02] transition-all group">
                      {isUploadingCSV ? (
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                      ) : (
                        <UploadCloud className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors group-hover:-translate-y-1" size={32} />
                      )}
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 group-hover:text-blue-600 text-center px-4">
                        {isUploadingCSV ? 'Processing File...' : 'Click to select .xlsx or .csv file'}
                      </span>
                      <input 
                        type="file" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isUploadingCSV} 
                      />
                    </label>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px] lg:h-[750px]">
                    <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4 rounded-t-[2rem] sm:rounded-t-[2.5rem]">
                      <h3 className="font-black text-base sm:text-lg text-slate-900">Saved Contacts ({displayedContacts.length})</h3>
                      <div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Search name/number..." 
                            value={searchContactQuery}
                            onChange={(e) => setSearchContactQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:border-green-500 outline-none w-full sm:w-48 lg:w-64 transition-all text-slate-800" 
                          />
                        </div>
                        
                        {contacts.length > 0 && (
                          <button 
                            onClick={handleDeleteAllContacts} 
                            disabled={isDeletingAll}
                            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 text-red-500 rounded-full text-xs sm:text-sm font-black hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                          >
                            {isDeletingAll ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16} />}
                            <span className="min-[400px]:hidden sm:inline">{isDeletingAll ? 'Deleting...' : 'Delete All'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto pb-12">
                      {displayedContacts.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 flex flex-col items-center mt-10 sm:mt-20">
                          <Database size={48} className="mb-4 opacity-20" />
                          <p className="font-bold">No contacts found.</p>
                          <p className="text-[10px] sm:text-xs mt-2">Please add manually, import file, or change the search keyword.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {displayedContacts.map((contact) => (
                            <div key={contact._id} className="flex flex-row items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group gap-2">
                              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-slate-300 font-bold shadow-sm border border-slate-100 flex-shrink-0 group-hover:scale-110 transition-all">
                                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{contact.nama}</p>
                                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{contact.nombor_telefon}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                <span className="hidden sm:inline-block px-2 sm:px-3 py-1 bg-white border border-slate-200 text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg max-w-[80px] truncate">
                                  {contact.kumpulan}
                                </span>
                                <button onClick={() => handleDeleteContact(contact._id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 lg:text-slate-300 rounded-xl transition-all opacity-100 lg:opacity-0 group-hover:opacity-100">
                                   <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blast' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-10">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">New Blast Campaign</h2>
                  <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Cost: <span className="text-green-600 font-bold">1 Unit</span> / message</p>
                </div>
                <div className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-2 ${isDeviceLinked ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${isDeviceLinked ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                  {isDeviceLinked ? 'Device Linked' : 'No Device Linked'}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 sm:space-y-8">
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Choose Target Source</label>
                      <select value={targetSource} onChange={(e) => setTargetSource(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-sm sm:text-base text-slate-800 outline-none focus:border-green-500 transition-colors cursor-pointer">
                        <option value="manual">✍️ Manual Number Entry (Copy & Paste)</option>
                        <option value="database">🗄️ Choose Contacts from Database ({contacts.length} Numbers)</option>
                      </select>
                    </div>
                    
                    {targetSource === 'manual' && (
                      <div className="space-y-3 animate-in fade-in zoom-in-95">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number List (One number per line)</label>
                        <textarea value={manualNumbers} onChange={(e) => setManualNumbers(e.target.value)} className="w-full p-4 sm:p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none font-medium text-slate-700 focus:border-green-500 transition-all resize-none h-28 sm:h-32 text-sm sm:text-base" placeholder="0123456789&#10;0198765432..." />
                      </div>
                    )}

                    {targetSource === 'database' && (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 p-4 sm:p-5 bg-green-50 border-2 border-green-100 rounded-2xl">
                        <label className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Target Group</label>
                        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full p-3 sm:p-4 bg-white rounded-xl font-bold text-sm sm:text-base text-slate-700 outline-none border border-slate-200 focus:border-green-500 cursor-pointer shadow-sm">
                          <option value="all">🚀 All Contacts ({contacts.length} numbers)</option>
                          {uniqueGroups.map((group, idx) => (
                            <option key={idx} value={group}>📁 Group: {group} ({contacts.filter(c => c.kumpulan === group).length} numbers)</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-3 border-t border-slate-100 pt-6 sm:pt-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Choose Message Format</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <label className={`flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] sm:hover:scale-105 active:scale-95 gap-4 sm:gap-2 ${messageFormat === 'text' ? 'border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-100' : 'border-slate-100 bg-white hover:border-green-200'}`}>
                                <input type="radio" name="format" value="text" checked={messageFormat === 'text'} onChange={() => handleFormatChange('text')} className="hidden" />
                                <MessageSquare size={20} className={`transition-all ${messageFormat === 'text' ? 'text-green-500 sm:scale-110' : 'text-slate-400'}`} />
                                <span className="font-bold text-[11px] uppercase tracking-wider text-left sm:text-center">Text Only</span>
                            </label>

                            <label className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 border-2 rounded-2xl transition-all gap-4 sm:gap-2 ${!canUseImage ? 'opacity-60 grayscale cursor-not-allowed border-slate-100 bg-slate-50' : messageFormat === 'image' ? 'border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-100' : 'border-slate-100 bg-white hover:border-green-200 hover:scale-[1.02] cursor-pointer'}`}>
                                <input type="radio" name="format" value="image" checked={messageFormat === 'image'} onChange={() => handleFormatChange('image')} className="hidden" disabled={!canUseImage} />
                                <ImageIcon size={20} className={`transition-all ${messageFormat === 'image' ? 'text-green-500 sm:scale-110' : 'text-slate-400'}`} />
                                <span className="font-bold text-[11px] uppercase tracking-wider text-left sm:text-center">Image & Caption</span>
                                {!canUseImage && <Lock size={12} className="absolute top-2 right-2 text-slate-400"/>}
                            </label>

                            <label className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 border-2 rounded-2xl transition-all gap-4 sm:gap-2 ${!canUseVideo ? 'opacity-60 grayscale cursor-not-allowed border-slate-100 bg-slate-50' : messageFormat === 'video' ? 'border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-100' : 'border-slate-100 bg-white hover:border-green-200 hover:scale-[1.02] cursor-pointer'}`}>
                                <input type="radio" name="format" value="video" checked={messageFormat === 'video'} onChange={() => handleFormatChange('video')} className="hidden" disabled={!canUseVideo} />
                                <Film size={20} className={`transition-all ${messageFormat === 'video' ? 'text-green-500 sm:scale-110' : 'text-slate-400'}`} />
                                <span className="font-bold text-[11px] uppercase tracking-wider text-left sm:text-center">Video & Caption</span>
                                {!canUseVideo && <Lock size={12} className="absolute top-2 right-2 text-slate-400"/>}
                            </label>
                        </div>
                    </div>

                    {messageFormat !== 'text' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                                3. Upload File {messageFormat === 'image' ? 'Image' : 'Video'}
                                {mediaFile && (
                                    <button onClick={() => setMediaFile(null)} className="text-red-500 flex items-center gap-1 font-bold text-[10px] hover:underline uppercase tracking-wider transition-all bg-red-50 px-2 py-1 rounded">
                                        <Trash2 size={12}/> Remove
                                    </button>
                                )}
                            </label>
                            
                            {!mediaFile ? (
                                <label className="w-full flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all hover:scale-[1.01] group">
                                    {messageFormat === 'image' ? (
                                        <ImageIcon size={32} className="text-slate-300 group-hover:text-green-500 mb-2 sm:mb-3 transition-colors group-hover:-translate-y-1 sm:w-10 sm:h-10" />
                                    ) : (
                                        <Film size={32} className="text-slate-300 group-hover:text-green-500 mb-2 sm:mb-3 transition-colors group-hover:-translate-y-1 sm:w-10 sm:h-10" />
                                    )}
                                    <span className="font-bold text-xs sm:text-sm text-slate-600 group-hover:text-green-700 transition-colors text-center">
                                        Click to select {messageFormat === 'image' ? 'Image' : 'Video'} file
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1 text-center px-4">Supported formats {messageFormat === 'image' ? 'JPG, PNG' : 'MP4'}. Max 16MB.</span>
                                    <input type="file" accept={messageFormat === 'image' ? 'image/*' : 'video/*'} className="hidden" onChange={handleMediaUpload} />
                                </label>
                            ) : (
                                <div className="relative border-2 border-slate-100 rounded-2xl overflow-hidden bg-slate-100 p-2 group animate-in zoom-in-95">
                                    {mediaFile.type.startsWith('video') ? (
                                        <video src={mediaFile.base64} controls className="w-full h-40 sm:h-56 object-contain rounded-xl bg-black shadow-md" />
                                    ) : (
                                        <img src={mediaFile.base64} alt="upload preview" className="w-full h-40 sm:h-56 object-contain rounded-xl shadow-md" />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        {messageFormat === 'text' ? '3. Message Content' : '4. Message Content (Caption)'}
                      </label>
                      <textarea 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        className="w-full p-4 sm:p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none h-32 sm:h-40 font-medium text-sm sm:text-base text-slate-700 focus:border-green-500 transition-colors resize-none" 
                        placeholder={messageFormat === 'text' ? "Type your WhatsApp message here..." : "Type description (caption) here (Optional)..."} 
                      />
                    </div>

                    <div className="space-y-3 pt-4 sm:pt-6 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-amber-500" /> Send Delay (Seconds)
                      </label>
                      <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-slate-50">
                        <input 
                          type="range" 
                          min={minDelayAllowed} 
                          max="20" 
                          value={delayTime} 
                          onChange={(e) => setDelayTime(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="bg-white px-3 sm:px-4 py-2 rounded-xl font-black text-slate-800 shadow-sm border border-slate-200 min-w-[70px] sm:min-w-[90px] text-center text-xs sm:text-sm">
                          {delayTime} Sec
                        </div>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-relaxed">
                        {isFreePlan ? (
                          <span className="text-amber-600 font-bold">*Free Plan memerlukan minimum delay 5 saat.</span>
                        ) : (
                          <span>*Tip: Set delay between <strong className="text-slate-700">2 to 5 seconds</strong> to prevent your WhatsApp from being flagged as spam.</span>
                        )}
                      </p>
                    </div>

                  </div>

                  {isBlasting ? (
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 text-center sm:text-left">
                        <span className="font-black text-green-500 animate-pulse text-sm sm:text-base">Sending via Server...</span>
                        <div className="flex gap-4 text-xs sm:text-sm">
                          <span className="font-bold text-green-500">{messagesSent} Success</span>
                          <span className="font-bold text-red-500">{messagesFailed} Failed</span>
                        </div>
                      </div>
                      <div className="w-full h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-green-500 transition-all duration-200 relative overflow-hidden" style={{ width: `${blastProgress}%` }}>
                           <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 -rotate-45 transform translate-x-[-100%] animate-[shimmer_1s_infinite]"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={startBlast} 
                      disabled={currentUser.isCreditLocked || isExpired}
                      className={`w-full py-5 sm:py-6 text-white rounded-[2rem] sm:rounded-[2.5rem] font-black text-lg sm:text-xl transition-all flex items-center justify-center gap-3 ${currentUser.isCreditLocked || isExpired ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-green-500 hover:bg-green-600 hover:scale-[1.01] active:scale-95 shadow-xl shadow-green-200'}`}
                    >
                      {currentUser.isCreditLocked ? <Lock size={20} className="sm:w-6 sm:h-6"/> : isExpired ? <Ban size={20} className="sm:w-6 sm:h-6"/> : <Send size={20} className="sm:w-6 sm:h-6" />}
                      {currentUser.isCreditLocked ? 'CREDITS LOCKED BY ADMIN' : isExpired ? 'SUBSCRIPTION EXPIRED' : 'START BLAST CAMPAIGN'}
                    </button>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-[#e5ddd5] rounded-[2rem] sm:rounded-[3rem] p-3 sm:p-4 shadow-2xl border-[8px] sm:border-[12px] border-slate-900 h-[450px] sm:h-[550px] lg:h-[650px] relative flex flex-col overflow-hidden mx-auto max-w-[350px] lg:max-w-none w-full">
                    <div className="bg-[#075e54] text-white p-3 sm:p-4 rounded-t-[1.5rem] sm:rounded-t-[2rem] -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 flex items-center gap-3 z-10 shadow-md">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
                        <User size={18} className="text-slate-400 mt-2 sm:w-5 sm:h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] sm:text-xs font-bold tracking-wide truncate">Customer Preview</p>
                        <p className="text-[8px] sm:text-[9px] opacity-80">online</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pt-4 sm:pt-6">
                      <div className="bg-white p-2.5 sm:p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] sm:max-w-[85%] relative animate-in slide-in-from-left-4 fade-in duration-300">
                        
                        {mediaFile && messageFormat !== 'text' && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-slate-100">
                                {mediaFile.type.startsWith('video') ? (
                                    <video src={mediaFile.base64} controls className="w-full max-h-40 sm:max-h-56 object-cover bg-black" />
                                ) : (
                                    <img src={mediaFile.base64} alt="Attachment Preview" className="w-full max-h-40 sm:max-h-56 object-cover" />
                                )}
                            </div>
                        )}
                        
                        {message && (
                            <p className="text-xs sm:text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed">{message}</p>
                        )}
                        {!message && !mediaFile && (
                             <p className="text-xs sm:text-[13px] text-slate-400 whitespace-pre-wrap leading-relaxed italic">Your message will be displayed here...</p>
                        )}

                        <p className="text-[8px] sm:text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                          12:00 PM <CheckCircle2 size={10} className="text-green-500"/>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'topup' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8 sm:space-y-12 pb-10">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Packages & Credit Topup</h2>
                  <p className="text-slate-500 font-medium mt-1 sm:text-base text-sm">Choose your monthly subscription plan or top up if you run out of quota.</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                  <div className="bg-green-50 p-2.5 sm:p-3 rounded-xl">
                    <Coins className="text-green-500 sm:w-6 sm:h-6 w-5 h-5" size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Balance</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900">{credits.toLocaleString()} <span className="text-xs sm:text-sm text-slate-400 font-bold">Units</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-sm">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <Calendar className="text-green-500 sm:w-6 sm:h-6 w-5 h-5" /> Monthly Subscription Plan
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 sm:mb-8">Monthly commitment packages for consistent blasting needs.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {SUBSCRIPTION_PACKAGES.map((pkg) => (
                    <div 
                       key={pkg.id} 
                      className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-2 relative overflow-hidden group transition-all hover:-translate-y-2 hover:shadow-xl flex flex-col ${
                        pkg.popular ? 'border-green-500 shadow-lg shadow-green-200' : 'border-slate-100 hover:border-green-300 shadow-sm'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] sm:text-[9px] font-black px-3 sm:px-4 py-1 rounded-bl-xl uppercase tracking-widest z-10">
                          Popular Choice
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-500 group-hover:scale-110 relative z-10 ${
                        pkg.popular ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-500 group-hover:text-green-600 group-hover:bg-green-50'
                      }`}
                      >
                        <pkg.icon size={24} className="sm:w-7 sm:h-7" />
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 relative z-10">{pkg.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-100 relative z-10">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">RM{pkg.price}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">/ Month</span>
                      </div>

                      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-grow relative z-10">
                        {pkg.features.map((feature, idx) => (
                           <div key={idx} className="flex items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-600">
                             <CheckCircle2 size={16} className={`text-green-500 flex-shrink-0 mt-0.5 sm:mt-0`} /> 
                             <span dangerouslySetInnerHTML={{__html: feature.replace(/Kredit/g, '<strong class="text-slate-900">Credits</strong>').replace(/Credits/g, '<strong class="text-slate-900">Credits</strong>')}} />
                           </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handlePurchasePackage(pkg, 'subscription')}
                        className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all active:scale-95 relative z-10 ${
                          pkg.popular 
                             ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                         Choose Plan
                      </button>

                      <pkg.icon className={`absolute -right-6 -bottom-6 text-slate-900 opacity-5 rotate-12 group-hover:scale-110 transition duration-500 pointer-events-none ${pkg.popular ? 'text-green-500/10' : ''}`} size={120} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 sm:pt-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <Zap className="text-amber-500 sm:w-6 sm:h-6 w-5 h-5" /> Additional Credit Topup
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 sm:mb-8">Ideal if your monthly quota runs out or you just need one-off credits.</p>
               
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {TOPUP_PACKAGES.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 border-2 shadow-sm relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-lg ${
                        pkg.popular ? 'border-green-500 shadow-green-100' : 'border-slate-100 hover:border-green-200'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">
                          Best Value
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                          pkg.popular ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-500 group-hover:text-green-500 group-hover:bg-green-50'
                        }`}>
                          <pkg.icon size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-right">
                           <h3 className="text-xs sm:text-sm font-black text-slate-900 mb-0.5">{pkg.label}</h3>
                           <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">RM{pkg.price}</span>
                        </div>
                       </div>

                      <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">{pkg.amount.toLocaleString()}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Credits</span>
                      </div>

                      {pkg.bonus && (
                         <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-600 bg-amber-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-amber-100 mb-4 sm:mb-6 w-max">
                            <Zap size={12} className="text-amber-500 sm:w-3.5 sm:h-3.5" /> {pkg.bonus} Free
                         </div>
                      )}
                      {!pkg.bonus && <div className="h-6 sm:h-8 mb-4 sm:mb-6"></div>}

                      <button 
                        onClick={() => handlePurchasePackage(pkg, 'topup')}
                        className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all active:scale-95 ${
                          pkg.popular 
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                         Buy Topup
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 sm:mt-10 max-w-2xl pt-4 sm:pt-6 border-t border-slate-200">
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
                  <h3 className="text-lg sm:text-xl font-black mb-2 flex items-center gap-3 text-slate-900"><Gift className="text-purple-500" /> Redeem Voucher / Reload PIN</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-4 sm:mb-6">Masukkan kod PIN Reload anda di bawah untuk terus menambah kredit.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={voucherCode} 
                      onChange={e => setVoucherCode(e.target.value)} 
                      placeholder="Contoh: PIN-XXXX-XXXX atau RAYA2026" 
                      className="flex-1 p-3.5 sm:p-4 bg-slate-50 border-2 border-slate-50 rounded-xl sm:rounded-2xl font-black text-slate-800 focus:border-purple-500 outline-none uppercase transition-colors text-sm" 
                    />
                    <button 
                      onClick={handleRedeemVoucher} 
                      disabled={isRedeeming}
                       className="px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-500 text-white rounded-xl sm:rounded-2xl font-black hover:bg-purple-600 transition-all active:scale-95 shadow-lg shadow-purple-200 whitespace-nowrap uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50"
                    >
                      {isRedeeming ? 'Checking...' : 'Redeem Code'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-2xl relative overflow-hidden mt-10 sm:mt-12 text-center md:text-left">
                 <div className="relative z-10">
                   <h3 className="text-xl sm:text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-3"><ShieldAlert className="text-amber-400"/> Need a Custom Package?</h3>
                   <p className="text-slate-400 font-medium text-xs sm:text-sm">Contact us for large-scale company / corporate plans.</p>
                 </div>
                 <button 
                    onClick={() => window.open(`https://wa.me/60169012445?text=Hi%20Admin,%20I%20need%20a%20custom%20plan%20for%20AR%20Connect.`, '_blank')}
                    className="relative z-10 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs hover:bg-slate-100 transition-all active:scale-95 whitespace-nowrap w-full md:w-auto"
                 >
                   Contact Admin
                 </button>
                 <Server className="absolute -right-4 -bottom-4 opacity-10 scale-150 rotate-12" size={150} />
              </div>
            </div>
          )}
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-3 pb-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'blast', icon: Send },
            { id: 'contacts', icon: Users },
            { id: 'history', icon: History },
            { id: 'settings', icon: Settings }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`p-3 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-green-500 text-white shadow-lg shadow-green-200 -translate-y-2' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

/* ============================================================================
   MAIN APP COMPONENT 
   ============================================================================ */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState('');
  const [viewMode, setViewMode] = useState('login'); 
  const [resetTokenUrl, setResetTokenUrl] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', nama_syarikat: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [packageSettings, setPackageSettings] = useState(() => {
    const saved = localStorage.getItem('ar_package_settings');
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGE_SETTINGS;
  });
  
  const handleSavePackageSettings = (newSettings) => {
    setPackageSettings(newSettings);
    localStorage.setItem('ar_package_settings', JSON.stringify(newSettings));
  };
  
useEffect(() => {
    // 1. Tarik tetapan Format Mesej (Pakej) dari Database secara automatik
    fetch(`${API_URL}/settings/packages`)
      .then(res => res.json())
      .then(data => {
        if (data && data.free) { // Pastikan data sah
          setPackageSettings(data);
          localStorage.setItem('ar_package_settings', JSON.stringify(data));
        }
      })
      .catch(err => console.log("Gagal memuat turun format pakej."));

    // 2. Cek token login pengguna (Kod asal anda)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setResetTokenUrl(tokenFromUrl);
      setViewMode('reset-password');
    }

    const savedToken = localStorage.getItem('token');
    if (savedToken && !tokenFromUrl) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Token expired");
      })
      .then(userData => {
        const updatedUser = { ...userData, id: userData._id || userData.id };
        setCurrentUser(updatedUser);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }
  }, []);
  
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let endpoint = '';
    let payload = {};

    if (viewMode === 'login') {
      endpoint = '/auth/login';
      payload = { email: formData.email, kata_laluan: formData.password };
    } else if (viewMode === 'register') {
      endpoint = '/auth/register';
      payload = { email: formData.email, kata_laluan: formData.password, nama_syarikat: formData.nama_syarikat };
    } else if (viewMode === 'forgot') {
      endpoint = '/auth/forgot-password';
      payload = { email: formData.email };
    } else if (viewMode === 'reset-password') {
      endpoint = '/auth/reset-password';
      payload = { token: resetTokenUrl, newPassword: formData.password };
      
      if (formData.password !== formData.confirmPassword) {
         setErrorMsg("Passwords do not match!");
         setLoading(false);
         return;
      }
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Something went wrong, please try again.');
      
      if (viewMode === 'login') {
        localStorage.setItem('token', data.token);
        const userData = { ...data.user, id: data.user.id || data.user._id }; 
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(data.token);
        setCurrentUser(userData);
      } else if (viewMode === 'forgot') {
        setSuccessMsg(data.message || 'A password reset link has been sent to your email.');
        setFormData({ ...formData, email: '' }); 
      } else if (viewMode === 'reset-password') {
        setSuccessMsg('Your password has been successfully updated! Please log in.');
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setViewMode('login');
        }, 3000);
      } else {
        setSuccessMsg('Registration successful! Please log in.');
        setViewMode('login');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const onLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setToken('');
  };
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-white p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-green-200">
              <Zap size={32} className="text-white fill-current" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">AR CONNECT</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Fully Connected System</p>
          </div>

          {viewMode !== 'reset-password' && (
            <div className="mb-8 flex justify-center gap-2">
                <button onClick={() => {setViewMode('login'); setErrorMsg(''); setSuccessMsg('');}} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${viewMode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Login</button>
                <button onClick={() => {setViewMode('register'); setErrorMsg(''); setSuccessMsg('');}} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${viewMode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Register</button>
            </div>
          )}

          {viewMode === 'reset-password' && (
            <div className="text-center mb-8">
               <h2 className="text-xl font-black text-slate-900">Set New Password</h2>
               <p className="text-xs text-slate-500 mt-2">Please enter your new password below.</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2 bg-red-50 text-red-500">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
         
          {successMsg && (
            <div className="p-4 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2 bg-green-50 text-green-500">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {viewMode !== 'reset-password' && (
              <>
                {viewMode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                    <input 
                      type="text" 
                      onChange={(e) => setFormData({...formData, nama_syarikat: e.target.value})} 
                      placeholder="e.g. AR Global" 
                      required 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-green-500 font-bold text-sm transition-all text-slate-800" 
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="e.g. admin@arconnect.my" 
                    required 
                    className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-green-500 font-bold text-sm transition-all text-slate-800" 
                  />
                </div>
                
                {viewMode !== 'forgot' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-green-500 font-bold text-sm transition-all text-slate-800" 
                    />
                  </div>
                )}
              </>
            )}

            {viewMode === 'reset-password' && (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-green-500 font-bold text-sm transition-all text-slate-800" 
                    />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-slate-50 focus:border-green-500 font-bold text-sm transition-all text-slate-800" 
                    />
                 </div>
              </div>
            )}

            {viewMode === 'login' && (
              <div className="text-right">
                 <button type="button" onClick={() => {setViewMode('forgot'); setErrorMsg(''); setSuccessMsg('');}} className="text-[10px] font-black text-slate-400 hover:text-green-600 uppercase tracking-widest transition-colors">Forgot Password?</button>
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full py-5 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 transition-all shadow-xl shadow-green-100 mt-4 uppercase tracking-widest flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : (viewMode === 'login' ? <LogIn size={20} /> : viewMode === 'register' ? <PlusCircle size={20} /> : viewMode === 'reset-password' ? <Save size={20} /> : <Send size={20} />)} 
              {viewMode === 'login' ? 'Login' : viewMode === 'register' ? 'Register Account' : viewMode === 'reset-password' ? 'Save New Password' : 'Send Reset Link'}
            </button>

            {viewMode === 'forgot' && (
              <button type="button" onClick={() => {setViewMode('login'); setErrorMsg(''); setSuccessMsg('');}} className="w-full text-center text-xs font-black text-slate-400 hover:text-green-600 mt-4 transition-colors">
                 Back to Login
              </button>
            )}
            
            {viewMode !== 'forgot' && viewMode !== 'reset-password' && (
              <div className="mt-8 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setViewMode(viewMode === 'login' ? 'register' : 'login');
                  }}
                  className="text-sm font-black text-slate-400 hover:text-green-600 transition-all hover:scale-105"
                >
                  {viewMode === 'login' ? "No account? Register now" : "Already have an account? Login"}
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-10">
            &copy; 2026 AR CONNECT TECHNOLOGY
          </p>
        </div>
      </div>
    );
  }

  if (currentUser.email === 'admin@arconnect.my') {
    return (
      <AdminPortal 
        currentUser={currentUser} 
        token={token} 
        onLogout={onLogout} 
        packageSettings={packageSettings} 
        onSavePackageSettings={handleSavePackageSettings}
      />
    );
  }

  return (
    <UserPortal 
      currentUser={currentUser} 
      token={token} 
      onLogout={onLogout} 
      onUpdateUser={setCurrentUser} 
      packageSettings={packageSettings}
    />
  );
}