import React, { useState, useEffect, useContext } from 'react';
import Modal from '../common/Modal';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import { Car, Bike, Clock, User, Phone, Hash, ShieldAlert, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const BookingModal = ({ isOpen, onClose, slot, onBookingSuccess }) => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();

  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [requestedDuration, setRequestedDuration] = useState(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setOwnerName(user.name || '');
      setPhoneNumber(user.phone || '');
    }
  }, [user, isOpen]);

  if (!slot) return null;

  const vehicleType = slot.type;
  const pricing = vehicleType === 'Car' 
    ? { base: 50, perDay: 10 } 
    : { base: 20, perDay: 5 };

  const additionalDays = Math.max(0, requestedDuration - 1);
  const additionalAmount = additionalDays * pricing.perDay;
  const estimatedTotal = pricing.base + additionalAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleNumber.trim()) {
      showError('Please enter vehicle registration number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        slotId: slot._id,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        vehicleModel: vehicleModel.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
        requestedDuration: Number(requestedDuration)
      };

      const { data } = await api.post('/bookings', payload);
      showSuccess(`Booking requested for Slot ${slot.slotNumber}! Waiting for Admin approval.`);
      if (onBookingSuccess) {
        onBookingSuccess(data);
      }
      onClose();
    } catch (err) {
      console.error('Booking error:', err);
      showError(err.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reserve Parking Slot ${slot.slotNumber}`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slot Info Banner */}
        <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              {slot.type === 'Car' ? <Car size={22} /> : <Bike size={22} />}
            </div>
            <div>
              <div className="text-sm font-bold text-indigo-950">Slot {slot.slotNumber}</div>
              <div className="text-xs text-indigo-700">Floor {slot.floor} · Zone {slot.zone} · {slot.type} Parking</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-indigo-900">{formatCurrency(pricing.base)}</div>
            <div className="text-[10px] text-indigo-600">Base rate (1st day)</div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Owner Name *
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Vehicle Reg Number *
            </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. MH 02 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono font-bold uppercase outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Vehicle Model (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Honda City / Royal Enfield"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all"
            />
          </div>
        </div>

        {/* Duration Picker Slider */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-600" />
              Expected Stay Duration: <span className="text-indigo-600 font-extrabold text-sm">{requestedDuration} Day{requestedDuration > 1 ? 's' : ''}</span>
            </label>
            <span className="text-xs font-extrabold text-slate-900">
              {formatCurrency(estimatedTotal)} Est.
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={requestedDuration}
            onChange={(e) => setRequestedDuration(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>1 day</span>
            <span>3 days</span>
            <span>6 days</span>
            <span>9 days</span>
            <span>12 days</span>
          </div>

          {/* Pricing breakdown breakdown */}
          <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs text-slate-500">
            <span>Base (1st day): {formatCurrency(pricing.base)}</span>
            <span>Additional ({additionalDays}d @ {formatCurrency(pricing.perDay)}/day): {formatCurrency(additionalAmount)}</span>
          </div>
        </div>

        {/* Overtime Policy Note */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <span>If your vehicle stays beyond requested duration, regular daily rate (+{formatCurrency(pricing.perDay)}/day) applies automatically upon exit.</span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white gradient-brand hover:opacity-95 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Submit Booking Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingModal;
