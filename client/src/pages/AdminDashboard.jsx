import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Clock, 
  Car, 
  Bike, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  LayoutGrid, 
  PlusCircle, 
  Trash2, 
  Wrench, 
  Search, 
  Receipt,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusBadgeConfig } from '../utils/helpers';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import LiveParkingPass from '../components/parking/LiveParkingPass';
import ReceiptModal from '../components/parking/ReceiptModal';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'slots', 'history'
  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Receipt modal for ending bookings
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Add Slot Form State
  const [newSlot, setNewSlot] = useState({
    slotNumber: '',
    floor: 1,
    zone: 'A',
    type: 'Car'
  });
  const [addingSlot, setAddingSlot] = useState(false);

  // Slot filter & search
  const [slotFilterFloor, setSlotFilterFloor] = useState('All');
  const [slotFilterType, setSlotFilterType] = useState('All');
  const [slotSearch, setSlotSearch] = useState('');

  // History search
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }
    fetchAllData();
    const interval = setInterval(fetchAllData, 15000); // 15s refresh
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      const [pendingRes, activeRes, statsRes, slotsRes, allRes] = await Promise.all([
        api.get('/bookings/pending'),
        api.get('/bookings/active'),
        api.get('/bookings/stats'),
        api.get('/slots'),
        api.get('/bookings')
      ]);

      setPendingBookings(pendingRes.data);
      setActiveBookings(activeRes.data);
      setStats(statsRes.data);
      setSlots(slotsRes.data);
      setAllBookings(allRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/approve`);
      showSuccess('Booking approved! Vehicle checked into slot.');
      fetchAllData();
    } catch (error) {
      console.error('Approval error:', error);
      showError(error.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    try {
      await api.put(`/bookings/${rejectingBooking._id}/reject`, {
        reason: rejectionReason || 'Request declined by facility manager'
      });
      showInfo(`Booking for ${rejectingBooking.vehicleNumber} rejected.`);
      setRejectingBooking(null);
      setRejectionReason('');
      fetchAllData();
    } catch (error) {
      console.error('Reject error:', error);
      showError('Failed to reject booking request');
    }
  };

  const handleEndBooking = async (bookingId) => {
    if (!window.confirm('End this vehicle parking session and generate final invoice?')) return;
    try {
      const { data } = await api.put(`/bookings/${bookingId}/end`);
      showSuccess(`Parking ended! Invoice generated for ${data.vehicleNumber}. Total: ${formatCurrency(data.totalAmount)}`);
      setCompletedReceipt(data);
      fetchAllData();
    } catch (error) {
      console.error('End session error:', error);
      showError(error.response?.data?.message || 'Failed to end booking');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.slotNumber.trim()) {
      showError('Please enter a slot number (e.g. A1-09)');
      return;
    }

    setAddingSlot(true);
    try {
      await api.post('/slots', {
        slotNumber: newSlot.slotNumber.trim().toUpperCase(),
        floor: Number(newSlot.floor),
        zone: newSlot.zone.trim().toUpperCase(),
        type: newSlot.type
      });
      showSuccess(`Slot ${newSlot.slotNumber.toUpperCase()} added successfully!`);
      setNewSlot({ slotNumber: '', floor: 1, zone: 'A', type: 'Car' });
      fetchAllData();
    } catch (error) {
      console.error('Create slot error:', error);
      showError(error.response?.data?.message || 'Failed to create slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    const nextStatus = slot.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      await api.put(`/slots/${slot._id}`, { status: nextStatus });
      showInfo(`Slot ${slot.slotNumber} set to ${nextStatus}.`);
      fetchAllData();
    } catch (error) {
      showError('Failed to update slot status');
    }
  };

  const handleDeleteSlot = async (slotId, slotNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete Slot ${slotNumber}?`)) return;
    try {
      await api.delete(`/slots/${slotId}`);
      showSuccess(`Slot ${slotNumber} removed.`);
      fetchAllData();
    } catch (error) {
      showError('Failed to delete slot');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Facility Manager Console...</p>
      </div>
    );
  }

  const filteredSlots = slots.filter((slot) => {
    const matchesFloor = slotFilterFloor === 'All' || slot.floor.toString() === slotFilterFloor;
    const matchesType = slotFilterType === 'All' || slot.type === slotFilterType;
    const matchesSearch = slot.slotNumber?.toLowerCase().includes(slotSearch.toLowerCase()) ||
                          slot.zone?.toLowerCase().includes(slotSearch.toLowerCase());
    return matchesFloor && matchesType && matchesSearch;
  });

  const filteredHistory = allBookings.filter((b) => {
    return (
      b.vehicleNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
      b.ownerName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      b.ticketNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
      b.slot?.slotNumber?.toLowerCase().includes(historySearch.toLowerCase())
    );
  });

  const availableSlotCount = slots.filter((s) => s.status === 'Available').length;
  const occupancyPercentage = slots.length > 0 ? Math.round(((slots.length - availableSlotCount) / slots.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Header Banner */}
      <div className="glass-dark p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/50 text-white text-xs font-bold border border-purple-400/70">
            <ShieldCheck size={14} />
            <span>Facility Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Central Parking Hub Admin
          </h1>
          <p className="text-sm text-slate-100 max-w-xl">
            Live bay dispatching, check-ins, automated billing clearance, and real-time multi-level capacity control.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md">
            <span>Occupancy: <strong className="text-emerald-400">{occupancyPercentage}%</strong> ({slots.length - availableSlotCount}/{slots.length} bays)</span>
          </div>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center gap-2"
          >
            <Zap size={15} />
            <span>Refresh Sensors</span>
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={pendingBookings.length}
          subtitle="Awaiting dispatch"
          icon={AlertCircle}
          color="amber"
          onClick={() => setActiveTab('pending')}
        />
        <StatCard
          title="Active Parkings"
          value={activeBookings.length}
          subtitle="Vehicles in bays"
          icon={Car}
          color="emerald"
          onClick={() => setActiveTab('active')}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue || 0)}
          subtitle="Settled today"
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle={`${stats?.completedBookings || 0} total sessions`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={16} />
          <span>Pending Approvals</span>
          {pendingBookings.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'active'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Car size={16} />
          <span>Live Vehicles</span>
          {activeBookings.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-400 text-slate-950 font-bold">
              {activeBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'slots'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutGrid size={16} />
          <span>Manage Slots ({slots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt size={16} />
          <span>Transactions & Audit</span>
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Pending Booking Queue ({pendingBookings.length})
              </h2>
              <p className="text-xs text-slate-500">Review incoming parking requests and assign entry pass</p>
            </div>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">All caught up!</h3>
              <p className="text-xs text-slate-500">No pending vehicle reservation requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingBookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl border-2 border-amber-200 overflow-hidden shadow-lg shadow-amber-500/5 flex flex-col justify-between"
                >
                  <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        {booking.vehicleType === 'Car' ? <Car size={22} /> : <Bike size={22} />}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg">{booking.vehicleNumber}</div>
                        <div className="text-xs text-amber-100">{booking.vehicleModel || `${booking.vehicleType} Vehicle`}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-amber-100 uppercase font-semibold">Est. Fare</div>
                      <div className="text-xl font-extrabold text-white">{formatCurrency(booking.totalAmount)}</div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driver</span>
                        <span className="font-bold text-slate-800">{booking.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                        <span className="font-bold text-slate-800">{booking.phoneNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Bay</span>
                        <span className="font-extrabold text-indigo-600">
                          {booking.slot?.slotNumber} (Z{booking.slot?.zone})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stay Est.</span>
                        <span className="font-bold text-slate-800">{booking.requestedDuration} Hours</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(booking._id)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check size={16} />
                        <span>Approve & Check-In</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingBooking(booking);
                          setRejectionReason('Facility full at requested time');
                        }}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        <X size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Parked Vehicles */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Currently Parked Vehicles ({activeBookings.length})
              </h2>
              <p className="text-xs text-slate-500">Live duration timers, overtime monitors, and exit settlement</p>
            </div>
          </div>

          {activeBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Car size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No active vehicles parked</h3>
              <p className="text-xs text-slate-500">All parking bays are currently unoccupied.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBookings.map((booking) => (
                <LiveParkingPass
                  key={booking._id}
                  booking={booking}
                  onEndBooking={handleEndBooking}
                  isAdminView={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Slot Manager */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Slot Card */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 rounded-2xl border shadow-sm space-y-4 sticky top-24">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <PlusCircle size={20} className="text-indigo-600" />
                  <span>Add New Parking Slot</span>
                </div>

                <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Slot Identifier *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A1-09, C2-11"
                      value={newSlot.slotNumber}
                      onChange={(e) => setNewSlot({ ...newSlot, slotNumber: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Floor Level
                      </label>
                      <select
                        value={newSlot.floor}
                        onChange={(e) => setNewSlot({ ...newSlot, floor: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value={1}>Floor 1</option>
                        <option value={2}>Floor 2</option>
                        <option value={3}>Floor 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Zone
                      </label>
                      <select
                        value={newSlot.zone}
                        onChange={(e) => setNewSlot({ ...newSlot, zone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="A">Zone A</option>
                        <option value="B">Zone B</option>
                        <option value="C">Zone C</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vehicle Bay Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewSlot({ ...newSlot, type: 'Car' })}
                        className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          newSlot.type === 'Car' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'text-slate-600'
                        }`}
                      >
                        <Car size={16} /> Car (₹50)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSlot({ ...newSlot, type: 'Bike' })}
                        className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          newSlot.type === 'Bike' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'text-slate-600'
                        }`}
                      >
                        <Bike size={16} /> Bike (₹20)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingSlot}
                    className="w-full mt-2 py-3 rounded-xl font-bold text-white gradient-brand hover:opacity-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {addingSlot ? 'Adding Bay...' : 'Save & Register Slot'}
                  </button>
                </form>
              </div>
            </div>

            {/* Slots List Table */}
            <div className="lg:col-span-2 space-y-4">
              {/* Slot Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search slot or zone..."
                    value={slotSearch}
                    onChange={(e) => setSlotSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border text-xs w-44"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={slotFilterFloor}
                    onChange={(e) => setSlotFilterFloor(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold"
                  >
                    <option value="All">All Floors</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                  </select>

                  <select
                    value={slotFilterType}
                    onChange={(e) => setSlotFilterType(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold"
                  >
                    <option value="All">All Types</option>
                    <option value="Car">Cars</option>
                    <option value="Bike">Bikes</option>
                  </select>
                </div>
              </div>

              {/* Slots Table */}
              <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="max-h-[550px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 sticky top-0 font-bold uppercase tracking-wider text-slate-500 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left">Slot</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Type & Rate</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredSlots.map((slot) => {
                        const badge = getStatusBadgeConfig(slot.status);
                        return (
                          <tr key={slot._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-slate-900">
                              {slot.slotNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                              Floor {slot.floor} · Zone {slot.zone}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{slot.type}</span>
                              <span className="text-[10px] text-slate-400 block">{formatCurrency(slot.basePrice || (slot.type === 'Car' ? 50 : 20))} base</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} inline-flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right space-x-1.5">
                              <button
                                onClick={() => handleToggleSlotStatus(slot)}
                                className={`p-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                                  slot.status === 'Maintenance' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={slot.status === 'Maintenance' ? 'Reopen Slot' : 'Set to Maintenance'}
                              >
                                <Wrench size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot._id, slot.slotNumber)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                                title="Delete Slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Transactions & Audit Logs */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Booking Transactions & Revenue Logs ({allBookings.length})
              </h2>
              <p className="text-xs text-slate-500">Comprehensive audit records for all parking requests</p>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, driver, vehicle..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border text-xs w-60"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 sticky top-0 font-bold uppercase tracking-wider text-slate-500 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Ticket #</th>
                    <th className="px-4 py-3.5 text-left">Driver & Vehicle</th>
                    <th className="px-4 py-3.5 text-left">Slot</th>
                    <th className="px-4 py-3.5 text-left">Time In / Out</th>
                    <th className="px-4 py-3.5 text-left">Duration</th>
                    <th className="px-4 py-3.5 text-left">Status</th>
                    <th className="px-4 py-3.5 text-right">Fare</th>
                    <th className="px-4 py-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((booking) => {
                    const badge = getStatusBadgeConfig(booking.status);
                    return (
                      <tr key={booking._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800">
                          {booking.ticketNumber || `TKT-${booking._id.substring(0, 8).toUpperCase()}`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{booking.ownerName || booking.user?.name}</div>
                          <div className="font-mono text-slate-500 text-[10px]">{booking.vehicleNumber} ({booking.vehicleType})</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                          Slot {booking.slot?.slotNumber || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                          <div>In: {booking.startTime ? formatDateTime(booking.startTime) : '-'}</div>
                          {booking.endTime && <div>Out: {formatDateTime(booking.endTime)}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {booking.actualDuration ? `${booking.actualDuration} hrs` : `${booking.requestedDuration} hrs`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} inline-flex items-center gap-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-slate-900">
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => setCompletedReceipt(booking)}
                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100"
                            title="Invoice"
                          >
                            <Receipt size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with presets */}
      <Modal
        isOpen={Boolean(rejectingBooking)}
        onClose={() => setRejectingBooking(null)}
        title="Reject Booking Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a rejection reason for vehicle <strong className="text-slate-900">{rejectingBooking?.vehicleNumber}</strong>:
          </p>

          <div className="space-y-2">
            {[
              'Facility is currently at maximum capacity',
              'Assigned slot is undergoing emergency maintenance',
              'Vehicle type does not match slot restrictions',
              'Incorrect or incomplete vehicle registration details'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRejectionReason(preset)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  rejectionReason === preset 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Custom Reason Note
            </label>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Provide reason for rejection..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectingBooking(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Completed Session Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(completedReceipt)}
        onClose={() => setCompletedReceipt(null)}
        booking={completedReceipt}
      />
    </div>
  );
};

export default AdminDashboard;
