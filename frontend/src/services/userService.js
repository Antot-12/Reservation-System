import api from './api';

// OTP Services
export const sendOTP = async (phone) => {
  const response = await api.post('/auth/send-otp', { phone });
  return response.data;
};

export const verifyOTP = async (phone, code) => {
  const response = await api.post('/auth/verify-otp', { phone, code });
  return response.data;
};

// Slots Services
export const getAvailableSlots = async (fromDate, toDate) => {
  const response = await api.get('/slots', {
    params: {
      from_date: fromDate,
      to_date: toDate,
    },
  });
  return response.data;
};

// Appointments Services
export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const cancelAppointment = async (appointmentId, phone) => {
  const response = await api.delete(`/appointments/${appointmentId}`, {
    params: { phone },
  });
  return response.data;
};

export const deleteAppointment = async (appointmentId, phone) => {
  const response = await api.delete(`/appointments/${appointmentId}/delete`, {
    params: { phone },
  });
  return response.data;
};

export const getUserAppointments = async (phone) => {
  const response = await api.get('/appointments', {
    params: { phone },
  });
  return response.data;
};

// Profile Services
export const getUserProfile = async (phone) => {
  const response = await api.get('/profile', {
    params: { phone },
  });
  return response.data;
};

export const createOrUpdateProfile = async (phone, name, birthdate) => {
  const response = await api.post('/profile', null, {
    params: { phone, name, birthdate },
  });
  return response.data;
};
