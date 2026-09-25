import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { 
  Car, 
  Bike, 
  Layers, 
  Search, 
  Sparkles,
  Filter
} from 'lucide-react';
import SlotCard from '../components/parking/SlotCard';
import BookingModal from '../components/parking/BookingModal';

const BookingPage = () => {
  const { user } = useContext(AuthContext);
  const { showError } = useToast();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedType, setSelectedType] = useState('All'); // 'All', 'Car', 'Bike'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/slots');
      setSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      showError('Failed to fetch slot availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (slot.status !== 'Available') {
      showError(`Slot ${slot.slotNumber} is currently ${slot.status.toLowerCase()}.`);
      return;
    }
    setSelectedSlotForBooking(slot);
  };

  const handleBookingSuccess = () => {
    fetchSlots();
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Parking Bays & Sensor Status...</p>
      </div>
    );
  }

  // Summary counts
  const availableSlots = slots.filter((s) => s.status === 'Available');
  const carSlots = slots.filter((s) => s.type === 'Car');
  const bikeSlots = slots.filter((s) => s.type === 'Bike');
  const availableCarSlots = carSlots.filter((s) => s.status === 'Available');
  const availableBikeSlots = bikeSlots.filter((s) => s.status === 'Available');

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    const matchesFloor = slot.floor === selectedFloor;
    const matchesZone = selectedZone === 'All' || slot.zone === selectedZone;
    const matchesType = selectedType === 'All' || slot.type === selectedType;
    const matchesSearch = slot.slotNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesZone && matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
          <Sparkles size={14} />
          <span>Interactive Bay Dispatcher</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Reserve Your Parking Slot
        </h1>
        <p className="text-sm text-slate-500">
          Select your floor level, filter by vehicle type, and choose an open bay for instant check-in.
        </p>
      </div>

      {/* Real-Time Availability Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="glass-card p-4 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Total Capacity</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            {availableSlots.length} / {slots.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Bays Available Now</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Car Bays</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-0.5">
            {availableCarSlots.length} / {carSlots.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">₹50 base · +₹10/day</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Bike Bays</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-0.5">
            {availableBikeSlots.length} / {bikeSlots.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">₹20 base · +₹5/day</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Occupied</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-0.5">
            {slots.length - availableSlots.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Active In Use</div>
        </div>
      </div>

      {/* Control & Filter Center */}
      <div className="glass-card p-5 rounded-3xl border shadow-md space-y-4">
        {/* Top Control Line: Floor Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Multi-Level Floor Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Layers size={14} className="text-indigo-600" /> Floor Level:
            </span>
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
              {[1, 2].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    selectedFloor === floor
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bay ID (e.g. A1-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>

        {/* Secondary Filter Line: Zones & Vehicle Types */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Zone Pills */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Zone:</span>
            <div className="flex items-center gap-1">
              {['All', 'A', 'B', 'C'].map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedZone === zone
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {zone === 'All' ? 'All Zones' : `Zone ${zone}`}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Pills */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Vehicle:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'All', label: 'All Bays' },
                { id: 'Car', label: 'Cars Only', icon: Car },
                { id: 'Bike', label: 'Bikes Only', icon: Bike }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedType(item.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    selectedType === item.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.icon && <item.icon size={13} />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Maintenance
            </span>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredSlots.length}</strong> bays on <strong>Floor {selectedFloor}</strong>
          </span>
          <span className="text-indigo-600 font-semibold">Click any open bay to reserve</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSlots.map((slot) => (
            <SlotCard
              key={slot._id}
              slot={slot}
              onSelect={handleSlotSelect}
            />
          ))}
        </div>

        {filteredSlots.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center border space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Filter size={20} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No slots match your filters</h3>
            <p className="text-xs text-slate-500">Try changing your zone, floor, or vehicle type filters.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={Boolean(selectedSlotForBooking)}
        onClose={() => setSelectedSlotForBooking(null)}
        slot={selectedSlotForBooking}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default BookingPage;
