import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Car, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Compass, 
  Sparkles, 
  User as UserIcon,
  CalendarPlus
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showInfo('You have been logged out successfully.');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Car size={22} className="group-hover:rotate-6 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent tracking-tight">
                ParkSmart
              </span>
              <span className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-widest uppercase">
                Smart Parking OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isActive('/') 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass size={17} />
              Explore
            </Link>

            <Link
              to="/parked-slots"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isActive('/parked-slots') 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Car size={17} />
              Live Occupancy
            </Link>

            {user && (
              <>
                <Link
                  to="/booking"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive('/booking') 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <CalendarPlus size={17} />
                  Book Slot
                </Link>

                <Link
                  to={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive('/dashboard') || isActive('/admin/dashboard')
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {user.isAdmin ? <ShieldCheck size={17} className="text-purple-600" /> : <LayoutDashboard size={17} />}
                  {user.isAdmin ? 'Admin Console' : 'My Dashboard'}
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Right Side Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                {/* User Info Chip */}
                <div className="flex items-center gap-2.5 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      {user.isAdmin ? (
                        <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                          <ShieldCheck size={10} /> Admin
                        </span>
                      ) : (
                        'Driver'
                      )}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-all flex items-center gap-1.5"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white gradient-brand hover:opacity-95 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={16} />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-xl">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between border border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
                {user.isAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
              isActive('/') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Explore
          </Link>

          <Link
            to="/parked-slots"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
              isActive('/parked-slots') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Live Occupancy
          </Link>

          {user ? (
            <>
              <Link
                to="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/booking') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Book Parking Slot
              </Link>

              <Link
                to={user.isAdmin ? "/admin/dashboard" : "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/dashboard') || isActive('/admin/dashboard') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {user.isAdmin ? 'Admin Console' : 'My Dashboard'}
              </Link>

              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-bold text-white gradient-brand shadow-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
