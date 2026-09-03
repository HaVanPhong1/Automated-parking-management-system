import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Car, TrendingUp, RefreshCw, Clock, ShieldCheck, Search, History, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5181/api/parking';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats] = useState({
    activeVehicles: 0,
    revenueToday: 0,
    totalSessionsToday: 0,
    maxCapacity: 200
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, historyRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/active-sessions`),
        axios.get(`${API_BASE}/history`),
        axios.get(`${API_BASE}/stats`)
      ]);

      if (sessionsRes.data.success) setActiveVehicles(sessionsRes.data.data);
      if (historyRes.data.success) setHistoryList(historyRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const filteredActive = activeVehicles.filter(v => 
    v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = historyList.filter(h => 
    h.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDuration = (timeInStr, timeOutStr) => {
    const timeIn = new Date(timeInStr);
    const timeOut = timeOutStr ? new Date(timeOutStr) : new Date();
    const diffMs = timeOut - timeIn;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) return `${hours} giờ ${mins} phút`;
    return `${mins} phút`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Quản Trị Bãi Xe</h1>
          <p className="text-slate-400 mt-1">Giám sát xe đang đỗ, tra cứu lịch sử ra vào & Thống kê doanh thu</p>
        </div>
        <button 
          onClick={fetchData} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Car className="w-6 h-6 text-primary" />}
          title="Xe Đang Đỗ Trong Bãi"
          value={stats.activeVehicles}
          subtitle={`Sức chứa: ${stats.maxCapacity} xe (${Math.round((stats.activeVehicles / stats.maxCapacity) * 100)}%)`}
          trend="Thời gian thực"
          color="primary"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          title="Doanh Thu Hôm Nay"
          value={`${stats.revenueToday.toLocaleString('vi-VN')}đ`}
          subtitle="Tự động ghi nhận qua VietQR Agribank"
          trend="Hôm nay"
          color="emerald"
        />
        <StatCard 
          icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
          title="Tổng Lượt Xe Trong Ngày"
          value={stats.totalSessionsToday}
          subtitle="Đếm tổng lượt vào / ra"
          trend="Thống kê ngày"
          color="purple"
        />
        <StatCard 
          icon={<ShieldCheck className="w-6 h-6 text-cyan-400" />}
          title="Trạng Thái Bãi Xe"
          value={stats.activeVehicles >= stats.maxCapacity ? "HẾT CHỖ" : "CÒN CHỖ"}
          subtitle="Cổng tự động vận hành"
          trend="Ổn định"
          color="rose"
        />
      </div>

      {/* Main Section: Tab Bar */}
      <div className="bg-dark border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'active' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Car className="w-4 h-4" />
              Xe Đang Trong Bãi ({activeVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                activeTab === 'history' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Lịch Sử Ra Vào ({historyList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm kiếm biển số xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Tab 1: Active Vehicles */}
        {activeTab === 'active' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">STT</th>
                  <th className="p-4">Biển Số Xe</th>
                  <th className="p-4">Giờ Vào Bãi</th>
                  <th className="p-4">Thời Gian Đã Gửi</th>
                  <th className="p-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredActive.length > 0 ? (
                  filteredActive.map((vehicle, index) => (
                    <tr key={vehicle.sessionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-slate-500 font-mono">#{index + 1}</td>
                      <td className="p-4 font-mono font-bold text-white text-lg">
                        <span className="bg-slate-900 px-3 py-1 rounded-md border border-slate-700 tracking-wider">
                          {vehicle.licensePlate}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {new Date(vehicle.timeIn).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-medium text-cyan-400 text-sm flex items-center gap-1.5 mt-2">
                        <Clock className="w-4 h-4" />
                        {calculateDuration(vehicle.timeIn, null)}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          Đang đỗ trong bãi
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      {loading ? 'Đang tải dữ liệu...' : 'Không có xe nào đang đỗ trong bãi.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Full History */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Mã Phiên</th>
                  <th className="p-4">Biển Số Xe</th>
                  <th className="p-4">Thời Gian Vào</th>
                  <th className="p-4">Thời Gian Ra</th>
                  <th className="p-4">Tổng Thời Gian</th>
                  <th className="p-4">Số Tiền (VND)</th>
                  <th className="p-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.sessionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-slate-500 font-mono">#{item.sessionId}</td>
                      <td className="p-4 font-mono font-bold text-white text-base">
                        <span className="bg-slate-900 px-3 py-1 rounded-md border border-slate-700 tracking-wider">
                          {item.licensePlate}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {new Date(item.timeIn).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {item.timeOut ? new Date(item.timeOut).toLocaleString('vi-VN') : '---'}
                      </td>
                      <td className="p-4 text-slate-400 text-sm font-medium">
                        {calculateDuration(item.timeIn, item.timeOut)}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 text-base">
                        {item.fee ? `${item.fee.toLocaleString('vi-VN')} đ` : '---'}
                      </td>
                      <td className="p-4">
                        {item.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                            Đã hoàn thành ra bãi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Đang đỗ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      {loading ? 'Đang tải dữ liệu...' : 'Chưa có lịch sử ra vào nào.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, trend, color }) {
  const colorMap = {
    primary: 'bg-primary/10 border-primary/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className={`bg-dark border rounded-2xl p-6 shadow-lg ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-slate-900/50">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-900 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
    </div>
  );
}
