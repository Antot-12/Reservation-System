import {
  saveUserSession,
  getUserPhone,
  getUserData,
  clearUserSession,
  saveAdminSession,
  getAdminToken,
  getAdminPhone,
  clearAdminSession,
  saveFontSize,
  getFontSize,
  saveBookingData,
  getBookingData,
  clearAllData
} from '../utils/storage';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie');

describe('Storage Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Session Management', () => {
    test('saveUserSession should save phone to cookies', () => {
      saveUserSession('+380501234567');
      expect(Cookies.set).toHaveBeenCalledWith(
        'user_phone',
        '+380501234567',
        expect.any(Object)
      );
    });

    test('saveUserSession should save user data', () => {
      const userData = { name: 'Test User', birthdate: '1990-01-01' };
      saveUserSession('+380501234567', userData);
      expect(Cookies.set).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(userData),
        expect.any(Object)
      );
    });

    test('getUserPhone should return phone from cookies', () => {
      Cookies.get.mockReturnValue('+380501234567');
      const phone = getUserPhone();
      expect(phone).toBe('+380501234567');
    });

    test('getUserData should return parsed user data', () => {
      const userData = { name: 'Test User' };
      Cookies.get.mockReturnValue(JSON.stringify(userData));
      const data = getUserData();
      expect(data).toEqual(userData);
    });

    test('clearUserSession should remove user cookies', () => {
      clearUserSession();
      expect(Cookies.remove).toHaveBeenCalledWith('user_phone');
      expect(Cookies.remove).toHaveBeenCalledWith('user_data');
    });
  });

  describe('Admin Session Management', () => {
    test('saveAdminSession should save phone and token', () => {
      saveAdminSession('+380501234567', 'test-token');
      expect(Cookies.set).toHaveBeenCalledWith('admin_phone', '+380501234567', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('admin_token', 'test-token', expect.any(Object));
    });

    test('getAdminToken should return token from cookies', () => {
      Cookies.get.mockReturnValue('test-token');
      const token = getAdminToken();
      expect(token).toBe('test-token');
    });

    test('getAdminPhone should return phone from cookies', () => {
      Cookies.get.mockReturnValue('+380501234567');
      const phone = getAdminPhone();
      expect(phone).toBe('+380501234567');
    });

    test('clearAdminSession should remove admin cookies', () => {
      clearAdminSession();
      expect(Cookies.remove).toHaveBeenCalledWith('admin_phone');
      expect(Cookies.remove).toHaveBeenCalledWith('admin_token');
    });
  });

  describe('Font Size Management', () => {
    test('saveFontSize should save font size to cookies', () => {
      saveFontSize('large');
      expect(Cookies.set).toHaveBeenCalledWith('font_size', 'large', expect.any(Object));
    });

    test('getFontSize should return font size or default', () => {
      Cookies.get.mockReturnValue('large');
      const size = getFontSize();
      expect(size).toBe('large');
    });

    test('getFontSize should return medium as default', () => {
      Cookies.get.mockReturnValue(undefined);
      const size = getFontSize();
      expect(size).toBe('medium');
    });
  });

  describe('Booking Data Management', () => {
    test('saveBookingData should save booking data', () => {
      const bookingData = { slot: '10:00', name: 'Test' };
      saveBookingData(bookingData);
      expect(Cookies.set).toHaveBeenCalledWith(
        'booking_data',
        JSON.stringify(bookingData),
        expect.any(Object)
      );
    });

    test('getBookingData should return parsed booking data', () => {
      const bookingData = { slot: '10:00' };
      Cookies.get.mockReturnValue(JSON.stringify(bookingData));
      const data = getBookingData();
      expect(data).toEqual(bookingData);
    });
  });

  describe('Clear All Data', () => {
    test('clearAllData should remove all session data', () => {
      clearAllData();
      expect(Cookies.remove).toHaveBeenCalledWith('user_phone');
      expect(Cookies.remove).toHaveBeenCalledWith('admin_phone');
      expect(Cookies.remove).toHaveBeenCalledWith('booking_data');
    });
  });
});
