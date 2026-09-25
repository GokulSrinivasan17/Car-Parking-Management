/**
 * Utility helpers for formatting currency, time, duration, and status styling
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDateOnly = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTimeOnly = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const getElapsedDuration = (startTime, endTime = null) => {
  if (!startTime) return '0h 0m';
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = Math.max(0, end - start);
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (hours === 0 && minutes === 0) {
    return `${seconds}s`;
  }
  if (hours === 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m`;
};

export const calculateLiveBill = (startTime, vehicleType = 'Car', requestedDuration = 1) => {
  if (!startTime) {
    const defaultPricing = vehicleType === 'Car' ? { base: 50, perDay: 10 } : { base: 20, perDay: 5 };
    const estTotal = defaultPricing.base + Math.max(0, requestedDuration - 1) * defaultPricing.perDay;
    return {
      actualHours: requestedDuration,
      baseAmount: defaultPricing.base,
      additionalAmount: Math.max(0, requestedDuration - 1) * defaultPricing.perDay,
      totalAmount: estTotal,
      isOvertime: false,
      overtimeHours: 0
    };
  }

  const start = new Date(startTime);
  const now = new Date();
  const durationMs = Math.max(0, now - start);
  const actualDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

  const pricing = vehicleType === 'Car' 
    ? { base: 50, perDay: 10 } 
    : { base: 20, perDay: 5 };

  const additionalDays = Math.max(0, actualDays - 1);
  const additionalAmount = additionalDays * pricing.perDay;
  const totalAmount = pricing.base + additionalAmount;

  const isOvertime = actualDays > requestedDuration;
  const overtimeHours = isOvertime ? actualDays - requestedDuration : 0;

  return {
    actualHours: actualDays,
    baseAmount: pricing.base,
    additionalAmount,
    totalAmount,
    isOvertime,
    overtimeHours
  };
};

export const getStatusBadgeConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Available'
      };
    case 'occupied':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Occupied'
      };
    case 'maintenance':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-500',
        label: 'Maintenance'
      };
    case 'active':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500 animate-pulse',
        label: 'Active'
      };
    case 'pending':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
        label: 'Pending Approval'
      };
    case 'completed':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Completed'
      };
    case 'rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Rejected'
      };
    case 'cancelled':
      return {
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Cancelled'
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: status || 'Unknown'
      };
  }
};
