import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend, onClick }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-600 border-indigo-100',
      iconBg: 'bg-indigo-500 text-white shadow-indigo-500/25',
      glow: 'hover:border-indigo-300 shadow-indigo-500/5'
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-600 border-emerald-100',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/25',
      glow: 'hover:border-emerald-300 shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-600 border-amber-100',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/25',
      glow: 'hover:border-amber-300 shadow-amber-500/5'
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-600 border-rose-100',
      iconBg: 'bg-rose-500 text-white shadow-rose-500/25',
      glow: 'hover:border-rose-300 shadow-rose-500/5'
    },
    blue: {
      bg: 'bg-blue-50/70 text-blue-600 border-blue-100',
      iconBg: 'bg-blue-500 text-white shadow-blue-500/25',
      glow: 'hover:border-blue-300 shadow-blue-500/5'
    },
    slate: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      iconBg: 'bg-slate-700 text-white shadow-slate-700/25',
      glow: 'hover:border-slate-300 shadow-slate-500/5'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`glass-card p-5 rounded-2xl shadow-sm border transition-all duration-200 ${scheme.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${scheme.iconBg}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
          {trend}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
