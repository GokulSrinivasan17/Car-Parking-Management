import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Clock, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Car size={20} />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                ParkSmart
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Next-generation smart parking management platform built on the MERN stack. Real-time slot allocation, live sensor status, automated digital billing, and instant barrier ticketing.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Parking Sensors Online
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home / Overview</Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-white transition-colors">Book a Parking Slot</Link>
              </li>
              <li>
                <Link to="/parked-slots" className="hover:text-white transition-colors">Live Occupancy Grid</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Driver Dashboard</Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">Admin Console</Link>
              </li>
            </ul>
          </div>

          {/* Parking Tariff */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Parking Tariff</h4>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-200 font-bold flex justify-between">
                  <span>🚗 Four Wheeler (Car)</span>
                  <span className="text-indigo-400">₹50 base</span>
                </div>
                <div className="text-slate-400 mt-0.5">+₹10/day after first day</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-slate-200 font-bold flex justify-between">
                  <span>🏍️ Two Wheeler (Bike)</span>
                  <span className="text-emerald-400">₹20 base</span>
                </div>
                <div className="text-slate-400 mt-0.5">+₹5/day after first day</div>
              </div>
            </div>
          </div>

          {/* Facility Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Facility Hub</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <span>Central Parking Complex, Multi-Level Bays Floor 1 & 2</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-400 shrink-0" />
                <span>Open 24/7, 365 Days</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-indigo-400 shrink-0" />
                <span>Support: +91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ParkSmart Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by React & Node MERN Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
