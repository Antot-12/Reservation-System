import Cookies from 'js-cookie';

// Cookie options
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

// Storage keys
const KEYS = {
  USER_PHONE: 'user_phone',
  USER_DATA: 'user_data',
  ADMIN_TOKEN: 'admin_token',
  ADMIN_PHONE: 'admin_phone',
  THEME: 'theme',
  FONT_SIZE: 'font_size',
  BOOKING_DATA: 'booking_data'
};

// User Session Management
export const saveUserSession = (phone, userData = null) => {
  Cookies.set(KEYS.USER_PHONE, phone, COOKIE_OPTIONS);
  if (userData) {
    Cookies.set(KEYS.USER_DATA, JSON.stringify(userData), COOKIE_OPTIONS);
  }
};

export const getUserPhone = () => {
  return Cookies.get(KEYS.USER_PHONE) || null;
};

export const getUserData = () => {
  const data = Cookies.get(KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
};

export const clearUserSession = () => {
  Cookies.remove(KEYS.USER_PHONE);
  Cookies.remove(KEYS.USER_DATA);
  Cookies.remove(KEYS.BOOKING_DATA);
  // Clear all cookies with the keys (in case of path issues)
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    if (name === KEYS.USER_PHONE || name === KEYS.USER_DATA || name === KEYS.BOOKING_DATA) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
  });
};

// Admin Session Management
export const saveAdminSession = (phone, token) => {
  Cookies.set(KEYS.ADMIN_PHONE, phone, COOKIE_OPTIONS);
  Cookies.set(KEYS.ADMIN_TOKEN, token, COOKIE_OPTIONS);
};

export const getAdminToken = () => {
  return Cookies.get(KEYS.ADMIN_TOKEN) || null;
};

export const getAdminPhone = () => {
  return Cookies.get(KEYS.ADMIN_PHONE) || null;
};

export const clearAdminSession = () => {
  Cookies.remove(KEYS.ADMIN_PHONE);
  Cookies.remove(KEYS.ADMIN_TOKEN);
  localStorage.removeItem('adminToken');
  // Clear all cookies with the keys (in case of path issues)
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    if (name === KEYS.ADMIN_PHONE || name === KEYS.ADMIN_TOKEN) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
  });
};

// Theme Management
export const saveTheme = (theme) => {
  Cookies.set(KEYS.THEME, theme, { ...COOKIE_OPTIONS, expires: 365 });
};

export const getTheme = () => {
  return Cookies.get(KEYS.THEME) || 'dark';
};

// Font Size Management
export const saveFontSize = (fontSize) => {
  Cookies.set(KEYS.FONT_SIZE, fontSize, { ...COOKIE_OPTIONS, expires: 365 });
};

export const getFontSize = () => {
  return Cookies.get(KEYS.FONT_SIZE) || 'medium';
};

// Booking Data (temporary)
export const saveBookingData = (bookingData) => {
  Cookies.set(KEYS.BOOKING_DATA, JSON.stringify(bookingData), {
    ...COOKIE_OPTIONS,
    expires: 1 // 1 day for booking data
  });
};

export const getBookingData = () => {
  const data = Cookies.get(KEYS.BOOKING_DATA);
  return data ? JSON.parse(data) : null;
};

export const clearBookingData = () => {
  Cookies.remove(KEYS.BOOKING_DATA);
};

// Clear all app data
export const clearAllData = () => {
  clearUserSession();
  clearAdminSession();
  clearBookingData();
  // Keep theme and font size preferences
};

const storageUtils = {
  saveUserSession,
  getUserPhone,
  getUserData,
  clearUserSession,
  saveAdminSession,
  getAdminToken,
  getAdminPhone,
  clearAdminSession,
  saveTheme,
  getTheme,
  saveFontSize,
  getFontSize,
  saveBookingData,
  getBookingData,
  clearBookingData,
  clearAllData
};

export default storageUtils;
