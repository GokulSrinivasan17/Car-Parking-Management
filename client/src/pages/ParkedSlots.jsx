import React, { useEffect, useState } from 'react';
import { 
  Car, 
  Bike, 
  Search
} from 'lucide-react';
import api from '../utils/api';
import LiveParkingPass from '../components/parking/LiveParkingPass';

const ParkedSlots = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Car, Bike

  useEffect(() => {
    fetchActiveBookings();
    const interval = setInterval(fetchActiveBookings, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveBookings = async () => {
    try {
      const { data } = await api.get('/bookings/active');
      setActiveBookings(data);
    } catch (error) {
      console.error('Error fetching active bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = activeBookings.filter((b) => {
    const matchesSearch = 
      b.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.slot?.slotNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === 'All' || b.vehicleType === filterType;
    return matchesSearch && matchesType;
  });

  const carCount = activeBookings.filter((b) => b.vehicleType === 'Car').length;
  const bikeCount = activeBookings.filter((b) => b.vehicleType === 'Bike').length;

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading live parking bay occupancy...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Facility Telemetry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Currently Parked Vehicles
        </h1>
        <p className="text-sm text-slate-500">
          Monitor all active vehicles, stay duration timers, bay assignments, and real-time accrued fares.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="glass-card p-5 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Active Occupancy</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{activeBookings.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Vehicles in Complex</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Parked Cars</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1">{carCount}</div>
          <div className="text-xs text-indigo-500 mt-0.5">Four-Wheelers</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Parked Bikes</div>
          <div className="text-3xl font-extrabold text-purple-600 mt-1">{bikeCount}</div>
          <div className="text-xs text-purple-500 mt-0.5">Two-Wheelers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle number, owner, or slot ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        {/* Vehicle filter pills */}
        <div className="flex items-center gap-2">
          {['All', 'Car', 'Bike'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'Car' && <Car size={14} />}
              {type === 'Bike' && <Bike size={14} />}
              <span>{type === 'All' ? 'All Vehicles' : `${type}s`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Vehicles Grid */}
      {filteredBookings.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No vehicles found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeBookings.length === 0 
              ? 'There are currently no vehicles parked in the parking bays.' 
              : 'No vehicles match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <LiveParkingPass
              key={booking._id}
              booking={booking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkedSlots;
