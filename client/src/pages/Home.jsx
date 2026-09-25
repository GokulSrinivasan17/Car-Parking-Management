import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { 
  Car, 
  Bike, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  CreditCard,
  Smartphone,
  ChevronDown,
  Zap,
  ShieldCheck
} from 'lucide-react';
import SlotCard from '../components/parking/SlotCard';

const Home = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedType, setSelectedType] = useState('All');
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/slots');
      setSlots(data);
    } catch (error) {
      console.error('Error loading slots on home:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === 'Available');
  const carSlots = slots.filter((s) => s.type === 'Car');
  const bikeSlots = slots.filter((s) => s.type === 'Bike');
  const availableCarSlots = carSlots.filter((s) => s.status === 'Available');
  const availableBikeSlots = bikeSlots.filter((s) => s.status === 'Available');
  const occupancyPercentage = totalSlots > 0 ? Math.round(((totalSlots - availableSlots.length) / totalSlots) * 100) : 0;

  // Filter preview slots
  const previewSlots = slots.filter((s) => {
    const matchesFloor = s.floor === selectedFloor;
    const matchesType = selectedType === 'All' || s.type === selectedType;
    return matchesFloor && matchesType;
  }).slice(0, 12);

  const faqs = [
    {
      q: 'How does the slot reservation and approval process work?',
      a: 'Browse available slots in real-time, select your preferred floor and bay, enter your vehicle details, and submit a request. The admin receives your request immediately for instant digital check-in confirmation.'
    },
    {
      q: 'What are the parking rates for Cars and Bikes?',
      a: 'Cars are billed at ₹50 base fare for the first day and ₹10/day thereafter. Two-wheelers/Bikes are ₹20 base fare for the first day and ₹5/day thereafter.'
    },
    {
      q: 'Can I monitor my parked vehicle and elapsed stay duration?',
      a: 'Yes! Your personal Driver Dashboard displays a live ticking pass with current elapsed duration, active slot location, and real-time accrued fare.'
    },
    {
      q: 'How do I checkout and receive my parking invoice?',
      a: 'Click "Exit Parking & Pay Bill" from your dashboard or present your ticket number to the parking manager. An itemized digital receipt with print support is automatically generated upon exit.'
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 lg:pt-16">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Live Availability Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-indigo-200/80 text-xs sm:text-sm font-bold text-indigo-900 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sensor Sync: <strong className="text-emerald-600">{availableSlots.length}</strong> of {totalSlots || 70} Bays Open</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Smart, Seamless & <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                Real-Time Parking.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Eliminate parking friction. Reserve bays across multi-level floors, track live vehicle stays with digital timers, and settle automated invoices effortlessly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/booking"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-bold text-white gradient-brand hover:opacity-95 shadow-xl shadow-indigo-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <span>Reserve a Slot Now</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/parked-slots"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <Car size={18} className="text-indigo-600" />
                <span>View Live Occupancy</span>
              </Link>
            </div>
          </motion.div>

          {/* Quick Metrics Deck */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 lg:mt-16 max-w-5xl mx-auto">
            <div className="glass-card p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mb-2 mx-auto">
                <Layers size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalSlots || 50}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Total Bays</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 mb-2 mx-auto">
                <Car size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {availableCarSlots.length}/{carSlots.length || 25}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Car Bays Open</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600 mb-2 mx-auto">
                <Bike size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
                {availableBikeSlots.length}/{bikeSlots.length || 25}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Bike Bays Open</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 mb-2 mx-auto">
                <Zap size={20} />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{occupancyPercentage}%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Occupancy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Parking Bay Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-6 lg:p-10 border shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block mb-1">
                Interactive Lot Map
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Live Parking Bay Availability
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Explore real-time slot occupancy across floors and zones. Click an available slot to book.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Floor Selector */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  onClick={() => setSelectedFloor(1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFloor === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Floor 1
                </button>
                <button
                  onClick={() => setSelectedFloor(2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFloor === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Floor 2
                </button>
              </div>

              {/* Type Filter */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                {['All', 'Car', 'Bike'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slots Grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {previewSlots.map((slot) => (
                <SlotCard key={slot._id} slot={slot} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <span>View All Multi-Level Slots & Reserve</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Transparent Tariff Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Fair & Transparent
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">Standard Parking Rates</h2>
          <p className="text-slate-500 text-sm">
            Simple daily pricing with automatic billing. No hidden convenience fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Car Pricing Card */}
          <div className="glass-card rounded-3xl p-8 border-2 border-indigo-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-500/25">
              <Car size={26} />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">Four-Wheeler (Car)</h3>
            <p className="text-slate-500 text-xs mt-1">Sedans, SUVs, Hatchbacks & Electric Cars</p>

            <div className="my-6 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">₹50</span>
                <span className="text-slate-500 text-sm font-semibold">/ first day base</span>
              </div>
              <div className="text-sm font-bold text-indigo-600">+₹10 per additional day</div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Dedicated wide bay parking with sensor guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Automated digital ticket pass & barrier check</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>24/7 CCTV surveillance & guard patrol</span>
              </li>
            </ul>

            <Link
              to="/booking"
              className="mt-8 w-full block text-center py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
            >
              Book Car Spot
            </Link>
          </div>

          {/* Bike Pricing Card */}
          <div className="glass-card rounded-3xl p-8 border-2 border-purple-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-md shadow-purple-500/25">
              <Bike size={26} />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900">Two-Wheeler (Bike)</h3>
            <p className="text-slate-500 text-xs mt-1">Motorcycles, Scooters & Electric Bikes</p>

            <div className="my-6 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">₹20</span>
                <span className="text-slate-500 text-sm font-semibold">/ first day base</span>
              </div>
              <div className="text-sm font-bold text-purple-600">+₹5 per additional day</div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 pt-4 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Zone C multi-deck sheltered bike racks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Fast scan & park with instant mobile ticket</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Zero hassle digital check-out</span>
              </li>
            </ul>

            <Link
              to="/booking"
              className="mt-8 w-full block text-center py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
            >
              Book Bike Spot
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Frictionless Flow
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">How ParkSmart Works</h2>
          <p className="text-slate-500 text-sm">4 simple steps to effortless vehicle parking</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Find Available Bay',
              desc: 'Select floor and zone with live sensor indicators showing open spots in green.',
              icon: MapPin
            },
            {
              step: '02',
              title: 'Submit Reservation',
              desc: 'Provide vehicle registration and expected stay duration with instant rate estimation.',
              icon: Smartphone
            },
            {
              step: '03',
              title: 'Get Digital Pass',
              desc: 'Upon quick manager check-in, receive your active pass with ticking stay timer.',
              icon: ShieldCheck
            },
            {
              step: '04',
              title: 'Exit & Settle',
              desc: 'End your session, verify exact stay duration, and get an itemized printable receipt.',
              icon: CreditCard
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border shadow-sm space-y-3 relative group hover:border-indigo-300 transition-all">
              <span className="text-3xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <item.icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl border overflow-hidden transition-all"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-slate-800 flex justify-between items-center gap-4 hover:bg-slate-50/50"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 shrink-0 transition-transform ${
                    faqOpen === idx ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
