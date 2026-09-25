import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { 
  Car, 
  Bike, 
  Clock, 
  Calendar, 
  Plus, 
  Receipt, 
  Search, 
  CreditCard, 
  Layers, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusBadgeConfig } from '../utils/helpers';
import StatCard from '../components/common/StatCard';
import LiveParkingPass from '../components/parking/LiveParkingPass';
import ReceiptModal from '../components/parking/ReceiptModal';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState('All'); // All, Completed, Cancelled

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyBookings();
    const interval = setInterval(fetchMyBookings, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchMyBookings = async () => {
    try {
      const { data } = await api.get('/bookings/mybookings');
      setBookings(data);
    } catch (error) {
      console.error('Error loading my bookings:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndBooking = async (bookingId) => {
    if (!window.confirm('Are you ready to checkout and end this parking session?')) return;

    try {
      const { data } = await api.put(`/bookings/${bookingId}/end`);
      showSuccess(`Parking session ended! Total Amount: ${formatCurrency(data.totalAmount)}`);
      setSelectedBookingForReceipt(data);
      fetchMyBookings();
    } catch (error) {
      console.error('Error ending booking:', error);
      showError(error.response?.data?.message || 'Failed to end booking session');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this pending booking request?')) return;

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      showInfo('Booking request cancelled.');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showError(error.response?.data?.message || 'Failed to cancel booking request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading your parking dashboard...</p>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status === 'Active');
  const pendingBookings = bookings.filter((b) => b.status === 'Pending');
  const pastBookings = bookings.filter((b) => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Rejected');

  const totalSpent = pastBookings
    .filter((b) => b.status === 'Completed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const filteredHistory = pastBookings.filter((b) => {
    const matchesSearch = 
      b.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slot?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeHistoryTab === 'All') return matchesSearch;
    return matchesSearch && b.status === activeHistoryTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
            <Sparkles size={14} />
            <span>Driver Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.name} 👋
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Manage your live parked vehicles, track elapsed parking duration, and view official tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/booking"
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white gradient-brand hover:opacity-95 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={18} />
            <span>Reserve New Bay</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Passes"
          value={activeBookings.length}
          subtitle="Vehicles currently parked"
          icon={Car}
          color="emerald"
        />
        <StatCard
          title="Pending Requests"
          value={pendingBookings.length}
          subtitle="Waiting for check-in"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          subtitle="All-time reservations"
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          subtitle="Completed sessions"
          icon={CreditCard}
          color="blue"
        />
      </div>

      {/* Active Live Parking Passes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              Active Parking Passes ({activeBookings.length})
            </h2>
            <p className="text-xs text-slate-500">Live duration tickers and dynamic fare calculation</p>
          </div>
        </div>

        {activeBookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Car size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No active parking sessions</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any vehicle currently parked. Ready to park? Browse our available bays.
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <span>Find & Book a Slot</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.map((booking) => (
              <LiveParkingPass
                key={booking._id}
                booking={booking}
                onEndBooking={handleEndBooking}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {pendingBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Pending Booking Requests ({pendingBookings.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBookings.map((booking) => (
              <div
                key={booking._id}
                className="glass-card rounded-2xl p-5 border-2 border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                      {booking.vehicleType === 'Car' ? <Car size={22} /> : <Bike size={22} />}
                    </div>
                    <div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {booking.vehicleNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        Slot {booking.slot?.slotNumber} (Floor {booking.slot?.floor} · Zone {booking.slot?.zone})
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    Awaiting Check-in
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white/60 p-3 rounded-xl border border-amber-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Requested At</span>
                    <span className="font-medium">{formatDateTime(booking.requestTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stay Duration</span>
                    <span className="font-medium">{booking.requestedDuration} Hour(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700">
                    Est. Amount: {formatCurrency(booking.totalAmount)}
                  </span>
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Cancel Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parking History & Invoices */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-slate-500" />
              Parking History & Invoices
            </h2>
            <p className="text-xs text-slate-500">View past sessions, download or print digital tax receipts</p>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vehicle or ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 sm:w-56"
              />
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
              {['All', 'Completed', 'Cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveHistoryTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeHistoryTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 text-left">Ticket / Date</th>
                  <th className="px-5 py-3.5 text-left">Vehicle</th>
                  <th className="px-5 py-3.5 text-left">Slot & Zone</th>
                  <th className="px-5 py-3.5 text-left">Duration</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHistory.map((booking) => {
                  const badge = getStatusBadgeConfig(booking.status);
                  return (
                    <tr key={booking._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          {booking.ticketNumber || `TKT-${booking._id.substring(0, 8).toUpperCase()}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDateTime(booking.startTime || booking.requestTime)}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            {booking.vehicleType === 'Car' ? <Car size={14} /> : <Bike size={14} />}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              {booking.vehicleNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">{booking.vehicleType}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700">
                        Slot {booking.slot?.slotNumber || '-'}
                        <span className="text-slate-400 text-[10px] block">
                          Floor {booking.slot?.floor} · Zone {booking.slot?.zone}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {booking.actualDuration 
                          ? `${booking.actualDuration} Hour(s)` 
                          : `${booking.requestedDuration} Hour(s)`}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} inline-flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        {booking.rejectionReason && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate" title={booking.rejectionReason}>
                            Reason: {booking.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(booking.totalAmount)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedBookingForReceipt(booking)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          title="View Tax Invoice"
                        >
                          <Receipt size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredHistory.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                <p className="font-semibold text-slate-700 text-sm">No records found</p>
                <p>You do not have any past booking records matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedBookingForReceipt)}
        onClose={() => setSelectedBookingForReceipt(null)}
        booking={selectedBookingForReceipt}
      />
    </div>
  );
};

export default Dashboard;
