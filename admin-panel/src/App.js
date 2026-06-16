import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Database, 
  Activity, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical, 
  X, 
  Save, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Server,
  Plus,
  Minus,
  LogOut,
  Bell
} from 'lucide-react';

const MOCK_USERS = [
  { id: 'U001', name: 'Admin AR', email: 'admin@arconnect.my', plan: 'PRO', credits: 5000, status: 'active', joined: '2023-11-01' },
  { id: 'U002', name: 'ABC Company', email: 'user@gmail.com', plan: 'STARTER', credits: 2000, status: 'active', joined: '2024-01-15' },
  { id: 'U003', name: 'VIP Client', email: 'vip@client.com', plan: 'ULTIMATE', credits: 15000, status: 'active', joined: '2024-02-20' },
  { id: 'U004', name: 'Ahmad Marketing', email: 'ahmad@marketing.com', plan: 'STARTER', credits: 50, status: 'suspended', joined: '2024-03-05' },
  { id: 'U005', name: 'Boutique Siti', email: 'siti@boutique.my', plan: 'PRO', credits: 8400, status: 'active', joined: '2024-04-12' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'dashboard', 'users', 'settings'
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Edit Form States
  const [editCredits, setEditCredits] = useState(0);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // System Settings States
  const [settingsTab, setSettingsTab] = useState('general');
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    systemName: 'AR CONNECT',
    apiProvider: 'baileys_md',
    webhookUrl: 'https://api.arconnect.my/webhook',
    timeout: 30000,
    delayMin: 15,
    delayMax: 35,
    autoPause: 50,
    costPerMessage: 1,
    freeCredits: 100,
  });

  const handleSettingChange = (key, value) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditCredits(user.credits);
    setEditPlan(user.plan);
    setEditStatus(user.status);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setShowEditModal(false);
  };

  const handleSaveUser = () => {
    setUsers(users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          credits: editCredits,
          plan: editPlan,
          status: editStatus
        };
      }
      return u;
    }));
    showToast(`Account ${editingUser.name} updated successfully!`);
    closeEditModal();
  };

  const adjustCredits = (amount) => {
    setEditCredits(prev => Math.max(0, prev + amount));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCredits = users.reduce((acc, curr) => acc + curr.credits, 0);
  const activeUsersCount = users.filter(u => u.status === 'active').length;

  const Sidebar = () => (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <ShieldAlert size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-tight tracking-tight">AR CONNECT</h1>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 mt-4">Menu Utama</p>
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'users', icon: Users, label: 'User Management' },
          { id: 'settings', icon: Settings, label: 'System Settings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
              activeTab === item.id 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">AD</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Super Admin</p>
            <p className="text-[10px] text-slate-400 truncate">System Owner</p>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  const Header = () => (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-black text-slate-800 capitalize">
          {activeTab === 'users' ? 'User Management' : activeTab}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <Activity size={16} /> Server Status: Optimal
        </div>
      </div>
    </header>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24} /></div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1">Total Active Users</p>
          <h3 className="text-3xl font-black text-slate-800">{activeUsersCount}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Database size={24} /></div>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1">Credits in Circulation</p>
          <h3 className="text-3xl font-black text-slate-800">{totalCredits.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><MessageSquare size={24} /></div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+5k today</span>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1">Total Blasts Sent (All Time)</p>
          <h3 className="text-3xl font-black text-slate-800">1.2M</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Server size={24} /></div>
          </div>
          <p className="text-sm font-bold text-slate-400 mb-1">API Server Load</p>
          <h3 className="text-3xl font-black text-slate-800">24%</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-black text-slate-800 mb-4">Recent System Activities</h3>
        <div className="space-y-4">
          {[
            { msg: 'User U003 purchased Enterprise Reload (10,000 credits)', time: '10 mins ago', type: 'payment' },
            { msg: 'System automated backup completed successfully', time: '1 hour ago', type: 'system' },
            { msg: 'User U005 started a new blast campaign (2,450 targets)', time: '2 hours ago', type: 'action' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/50">
              <div className={`w-2 h-2 rounded-full ${activity.type === 'payment' ? 'bg-emerald-500' : activity.type === 'system' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              <p className="text-sm font-medium text-slate-700 flex-1">{activity.msg}</p>
              <span className="text-xs font-bold text-slate-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-sm transition-all"
          />
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
          <Plus size={16} /> Add New User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-black">ID</th>
              <th className="p-4 font-black">Client Info</th>
              <th className="p-4 font-black">Plan</th>
              <th className="p-4 font-black">Credit Balance</th>
              <th className="p-4 font-black">Status</th>
              <th className="p-4 font-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 font-bold text-slate-400 text-sm">{user.id}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.plan === 'ULTIMATE' ? 'bg-purple-100 text-purple-700' :
                    user.plan === 'PRO' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 font-black text-slate-800">
                    <Database size={14} className="text-emerald-500" />
                    {user.credits.toLocaleString()}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    {user.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => openEditModal(user)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                  >
                    <Edit size={14} /> Edit Data
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                  No users found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EditModal = () => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Manage User Account</h3>
          <button onClick={closeEditModal} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User Info Read-only */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Client Name</p>
              <p className="font-black text-slate-800">{editingUser?.name}</p>
              <p className="text-sm text-slate-500">{editingUser?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">User ID</p>
              <p className="font-black text-slate-300 text-xl">{editingUser?.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Plan Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Subscription Plan</label>
              <select 
                value={editPlan} 
                onChange={(e) => setEditPlan(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                <option value="STARTER">STARTER</option>
                <option value="PRO">PRO</option>
                <option value="ULTIMATE">ULTIMATE</option>
              </select>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Account Status</label>
              <select 
                value={editStatus} 
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended (Banned)</option>
              </select>
            </div>
          </div>

          {/* Credit Management */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between">
              <span>Credit Balance</span>
              <span className="text-emerald-500 font-black">{editCredits.toLocaleString()} Units</span>
            </label>
            
            <div className="flex gap-2">
              <input 
                type="number" 
                value={editCredits}
                onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-black text-lg text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            
            {/* Quick action buttons for credits */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => adjustCredits(-1000)} className="py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1"><Minus size={12}/> 1k</button>
              <button onClick={() => adjustCredits(1000)} className="py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1"><Plus size={12}/> 1k</button>
              <button onClick={() => adjustCredits(5000)} className="py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1"><Plus size={12}/> 5k</button>
              <button onClick={() => adjustCredits(10000)} className="py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1"><Plus size={12}/> 10k</button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={closeEditModal}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveUser}
            className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border shadow-sm gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">System Configuration</h3>
          <p className="text-slate-500 text-sm font-medium">Manage global platform parameters and gateways.</p>
        </div>
        <button 
          onClick={() => showToast('System configurations saved successfully!')}
          className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Save size={18} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2 h-fit">
          {[
            { id: 'general', label: 'General Settings', icon: Settings },
            { id: 'gateway', label: 'API Gateway', icon: Server },
            { id: 'antiban', label: 'Anti-Ban Rules', icon: ShieldAlert },
            { id: 'billing', label: 'Billing & Credits', icon: Database },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                settingsTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 bg-white rounded-2xl border shadow-sm p-6 md:p-8">
          {settingsTab === 'general' && (
            <div className="space-y-8 animate-in fade-in">
              <h4 className="text-lg font-black text-slate-800 border-b pb-4">General Parameters</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">System Name</label>
                  <input 
                    type="text" 
                    value={systemSettings.systemName}
                    onChange={(e) => handleSettingChange('systemName', e.target.value)}
                    className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center justify-between max-w-md p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Temporarily disable access for users.</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('maintenanceMode', !systemSettings.maintenanceMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-6' : ''}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between max-w-md p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Allow New Registrations</p>
                    <p className="text-xs text-slate-500">Enable or disable public sign-ups.</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('allowRegistration', !systemSettings.allowRegistration)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${systemSettings.allowRegistration ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${systemSettings.allowRegistration ? 'translate-x-6' : ''}`}></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'gateway' && (
            <div className="space-y-8 animate-in fade-in">
              <h4 className="text-lg font-black text-slate-800 border-b pb-4">API Gateway Configuration</h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">WhatsApp Provider Core</label>
                  <select 
                    value={systemSettings.apiProvider}
                    onChange={(e) => handleSettingChange('apiProvider', e.target.value)}
                    className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="baileys_md">Baileys Multi-Device (Recommended)</option>
                    <option value="whatsapp_cloud">Official WhatsApp Cloud API</option>
                    <option value="wwebjs">WhatsApp Web JS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Global Webhook URL</label>
                  <input 
                    type="text" 
                    value={systemSettings.webhookUrl}
                    onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                    className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between max-w-md">
                    <span>Connection Timeout (ms)</span>
                    <span className="text-emerald-500">{systemSettings.timeout}</span>
                  </label>
                  <input 
                    type="range" 
                    min="10000" max="60000" step="1000"
                    value={systemSettings.timeout}
                    onChange={(e) => handleSettingChange('timeout', parseInt(e.target.value))}
                    className="w-full max-w-md accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'antiban' && (
            <div className="space-y-8 animate-in fade-in">
              <h4 className="text-lg font-black text-slate-800 border-b pb-4">Global Anti-Ban Rules</h4>
              <p className="text-sm text-slate-500 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 flex gap-2 items-start">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                These global settings override user defaults to ensure server IP safety and reduce global block rates.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Min Delay (Seconds)</label>
                  <input 
                    type="number" 
                    value={systemSettings.delayMin}
                    onChange={(e) => handleSettingChange('delayMin', parseInt(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Max Delay (Seconds)</label>
                  <input 
                    type="number" 
                    value={systemSettings.delayMax}
                    onChange={(e) => handleSettingChange('delayMax', parseInt(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Auto-Pause After X Messages</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="number" 
                    value={systemSettings.autoPause}
                    onChange={(e) => handleSettingChange('autoPause', parseInt(e.target.value))}
                    className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <span className="text-sm font-bold text-slate-400">Messages</span>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in">
              <h4 className="text-lg font-black text-slate-800 border-b pb-4">Billing & Credits Defaults</h4>
              
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Credit Cost Per Message</label>
                  <div className="relative">
                    <Database size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      value={systemSettings.costPerMessage}
                      onChange={(e) => handleSettingChange('costPerMessage', parseInt(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Free Credits (New Accounts)</label>
                  <div className="relative">
                    <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input 
                      type="number" 
                      value={systemSettings.freeCredits}
                      onChange={(e) => handleSettingChange('freeCredits', parseInt(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {/* Render Edit Modal if active */}
      {showEditModal && <EditModal />}

      {/* Custom Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <p className="font-bold text-sm">{toastMsg}</p>
        </div>
      )}
    </div>
  );
}