import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Bike, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Receipt, 
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, calculateLiveBill, formatDateTime } from '../../utils/helpers';

const LiveParkingPass = ({ booking, onEndBooking, isAdminView = false }) => {
  const [elapsedTime, setElapsedTime] = useState('0h 0m 0s');
  const [bill, setBill] = useState({ actualHours: 1, baseAmount: 50, additionalAmount: 0, totalAmount: 50, isOvertime: false });

  useEffect(() => {
    const updateTicker = () => {
      if (!booking?.startTime) return;
      const start = new Date(booking.startTime);
      const now = new Date();
      const diffMs = Math.max(0, now - start);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      setBill(calculateLiveBill(booking.startTime, booking.vehicleType, booking.requestedDuration));
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  if (!booking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-xl shadow-indigo-500/5 hover:border-indigo-400 transition-all"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              {booking.vehicleType === 'Car' ? <Car size={22} /> : <Bike size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg tracking-wider">
                  {booking.vehicleNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                {booking.vehicleModel || `${booking.vehicleType} Vehicle`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">Accrued Fare</div>
            <div className="text-2xl font-extrabold text-white">{formatCurrency(bill.totalAmount)}</div>
          </div>
        </div>
      </div>

      {/* Ticket Details & Live Timer */}
      <div className="p-5 space-y-4">
        {/* Live Timer Deck */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Clock size={13} className="text-indigo-600" /> Elapsed Time
            </span>
            <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 mt-0.5">
              {elapsedTime}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin size={13} className="text-indigo-600" /> Assigned Bay
            </span>
            <div className="text-base sm:text-lg font-extrabold text-indigo-600 mt-0.5">
              Slot {booking.slot?.slotNumber || '-'}
              <span className="text-xs font-semibold text-slate-500 ml-1">
                (F{booking.slot?.floor} · Z{booking.slot?.zone})
              </span>
            </div>
          </div>
        </div>

        {/* User Info (For Admin View) or Entry Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Driver / Owner</span>
            <span className="font-bold text-slate-800">{booking.ownerName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Contact</span>
            <span className="font-bold text-slate-800">{booking.phoneNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Check-In Time</span>
            <span className="font-semibold text-slate-700">{formatDateTime(booking.startTime)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Requested Stay</span>
            <span className="font-semibold text-slate-700">{booking.requestedDuration} Hour(s)</span>
          </div>
        </div>

        {/* Overtime Alert */}
        {bill.isOvertime && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Overtime Alert:</span> Vehicle exceeded {booking.requestedDuration}h requested stay. Extra hours billed at standard rate.
            </div>
          </div>
        )}

        {/* Ticket Barcode Strip */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono">TKT: {booking.ticketNumber || booking._id?.substring(0, 10)}</span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> Active Bay
          </span>
        </div>

        {/* Action Button */}
        {onEndBooking && (
          <button
            onClick={() => onEndBooking(booking._id)}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Receipt size={16} />
            <span>{isAdminView ? 'End Session & Settle Bill' : 'Exit Parking & Pay Bill'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default LiveParkingPass;
