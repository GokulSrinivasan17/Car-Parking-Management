import React from 'react';
import Modal from '../common/Modal';
import { 
  Printer, 
  CheckCircle2, 
  Car, 
  Calendar, 
  Clock, 
  MapPin
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const ReceiptModal = ({ isOpen, onClose, booking }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Parking Pass & Tax Invoice" maxWidth="max-w-md">
      <div className="space-y-4 print:p-0" id="parking-receipt-print">
        {/* Ticket Header Card */}
        <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Car size={14} />
            </div>
            <span className="text-sm font-extrabold tracking-wider uppercase">ParkSmart Official Ticket</span>
          </div>

          <div className="my-2">
            <span className="text-xs text-indigo-300 font-mono tracking-widest block">TICKET NUMBER</span>
            <span className="text-lg font-mono font-bold tracking-wider text-emerald-400">
              {booking.ticketNumber || `TKT-${booking._id?.substring(0, 8).toUpperCase()}`}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Status: {booking.status}</span>
          </div>

          {/* Barcode Mock Visual */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col items-center">
            <div className="h-7 w-4/5 flex justify-between items-center opacity-80 gap-[2px]">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full bg-white ${
                    i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1 tracking-widest">
              PARK-{booking._id?.substring(0, 12)}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Car size={14} className="text-slate-400" /> Vehicle Number
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {booking.vehicleNumber}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin size={14} className="text-slate-400" /> Slot & Zone
            </span>
            <span className="font-bold text-slate-800">
              Slot {booking.slot?.slotNumber || '-'} (Floor {booking.slot?.floor}, Zone {booking.slot?.zone})
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-slate-400" /> Entry Time
            </span>
            <span className="font-semibold text-slate-800">
              {booking.startTime ? formatDateTime(booking.startTime) : formatDateTime(booking.requestTime)}
            </span>
          </div>

          {booking.endTime && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock size={14} className="text-slate-400" /> Exit Time
              </span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(booking.endTime)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-slate-400" /> Total Duration
            </span>
            <span className="font-bold text-slate-900">
              {booking.actualDuration 
                ? `${booking.actualDuration} Hour${booking.actualDuration > 1 ? 's' : ''}` 
                : `${booking.requestedDuration} Hour (Est.)`}
            </span>
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-2 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Base Fare (First Hour)</span>
              <span>{formatCurrency(booking.baseAmount || (booking.vehicleType === 'Car' ? 50 : 20))}</span>
            </div>
            <div className="flex justify-between">
              <span>Additional Time Fare</span>
              <span>{formatCurrency(booking.additionalAmount || 0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total Amount Paid</span>
              <span className="text-indigo-600 text-base">{formatCurrency(booking.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Print / Actions Button */}
        <div className="flex items-center gap-3 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
