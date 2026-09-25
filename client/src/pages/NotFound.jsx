import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="glass-card rounded-3xl p-8 sm:p-12 border shadow-xl max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-3xl gradient-brand flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/25">
          <Car size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900">404</h1>
          <h2 className="text-xl font-bold text-slate-800">Parking Bay Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            The page or parking resource you are looking for has moved or does not exist.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white gradient-brand shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Main Entrance</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
