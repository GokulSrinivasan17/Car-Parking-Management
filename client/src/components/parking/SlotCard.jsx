import React from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Zap } from 'lucide-react';
import { formatCurrency, getStatusBadgeConfig } from '../../utils/helpers';

const SlotCard = ({ slot, onSelect, isSelected = false }) => {
  const isAvailable = slot.status === 'Available';
  const isOccupied = slot.status === 'Occupied';
  const badgeConfig = getStatusBadgeConfig(slot.status);

  const getBorderColor = () => {
    if (isSelected) return 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10';
    if (isAvailable) return 'border-emerald-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20';
    if (isOccupied) return 'border-rose-200 bg-rose-50/20 opacity-90';
    return 'border-slate-200 bg-slate-100/60 opacity-75';
  };

  return (
    <motion.div
      whileHover={isAvailable ? { y: -3, scale: 1.02 } : {}}
      whileTap={isAvailable ? { scale: 0.98 } : {}}
      onClick={() => isAvailable && onSelect && onSelect(slot)}
      className={`relative rounded-2xl p-4 border-2 transition-all duration-200 flex flex-col justify-between select-none ${getBorderColor()} ${
        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
    >
      {/* Top Bar with Slot ID & Type Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">
            {slot.slotNumber}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            F{slot.floor} · Z{slot.zone}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeConfig.bg} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dot}`} />
            {badgeConfig.label}
          </span>
        </div>
      </div>

      {/* Center Visual Bay */}
      <div className="my-2 py-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
        {slot.type === 'Car' ? (
          <Car 
            size={36} 
            className={`transition-transform duration-200 ${
              isAvailable 
                ? 'text-emerald-500 group-hover:scale-110' 
                : isOccupied 
                  ? 'text-rose-500' 
                  : 'text-slate-400'
            }`} 
          />
        ) : (
          <Bike 
            size={36} 
            className={`transition-transform duration-200 ${
              isAvailable 
                ? 'text-emerald-500 group-hover:scale-110' 
                : isOccupied 
                  ? 'text-rose-500' 
                  : 'text-slate-400'
            }`} 
          />
        )}

        <div className="mt-1 text-[11px] font-semibold text-slate-500">
          {slot.type} Spot
        </div>

        {isOccupied && slot.currentVehicle?.vehicleNumber && (
          <div className="mt-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold tracking-wider">
            {slot.currentVehicle.vehicleNumber}
          </div>
        )}
      </div>

      {/* Bottom Pricing & Call-to-action */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-slate-600">
          <span className="font-extrabold text-slate-900">{formatCurrency(slot.basePrice || (slot.type === 'Car' ? 50 : 20))}</span>
          <span className="text-[10px] text-slate-400"> (1st hr)</span>
        </div>
        
        {isAvailable ? (
          <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
            Book <Zap size={12} />
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">
            {isOccupied ? 'In Use' : 'Closed'}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default SlotCard;
