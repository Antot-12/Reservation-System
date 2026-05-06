import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Fetch CSRF token
const getCSRFToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/csrf-token`);
    return response.data.csrf_token;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  }
};

// Add auth token and CSRF token to requests
api.interceptors.request.use(async (config) => {
  // Add admin token
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for non-GET requests (when enabled in backend)
  if (config.method !== 'get') {
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
}, (error) => {
  // Request error handler
  if (process.env.NODE_ENV === 'development') {
    console.error('Request setup error:', error);
  }
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Запит перевищив час очікування. Спробуйте пізніше.');
      } else if (error.message === 'Network Error') {
        toast.error('Помилка мережі. Перевірте інтернет з\'єднання.');
      } else {
        toast.error('Не вдалося з\'єднатися з сервером.');
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('Network error:', error);
      }

      return Promise.reject(error);
    }

    // HTTP error responses
    const { status, data } = error.response;
    const errorMessage = data?.detail || data?.message || 'Виникла помилка';

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status,
        url: error.config?.url,
        method: error.config?.method,
        data
      });
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        toast.error(errorMessage || 'Некоректні дані запиту');
        break;

      case 401:
        toast.error('Необхідна авторизація. Будь ласка, увійдіть знову.');
        // Clear auth data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userPhone');
        // Redirect to home if not already there
        if (window.location.pathname !== '/') {
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
        break;

      case 403:
        toast.error('Недостатньо прав для виконання цієї дії');
        break;

      case 404:
        toast.error('Ресурс не знайдено');
        break;

      case 409:
        toast.error(errorMessage || 'Конфлікт даних. Можливо, цей час вже зайнятий.');
        break;

      case 422:
        toast.error(errorMessage || 'Помилка валідації даних');
        break;

      case 429:
        toast.error('Занадто багато запитів. Спробуйте через хвилину.');
        break;

      case 500:
        toast.error('Помилка сервера. Спробуйте пізніше.');
        break;

      case 503:
        toast.error('Сервіс тимчасово недоступний');
        break;

      default:
        toast.error(errorMessage || 'Виникла несподівана помилка');
    }

    return Promise.reject(error);
  }
);

// Input sanitization helper
export const sanitizeInput = (value, type = 'text') => {
  if (!value) return '';

  let sanitized = String(value).trim();

  switch (type) {
    case 'phone':
      // Remove all non-digit characters except +
      sanitized = sanitized.replace(/[^\d+]/g, '');
      break;

    case 'name':
      // Remove special characters, keep only letters, spaces, hyphens
      sanitized = sanitized.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-']/g, '');
      break;

    case 'email':
      sanitized = sanitized.toLowerCase();
      break;

    case 'notes':
      // Remove script tags and dangerous patterns
      sanitized = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      break;

    default:
      // Basic HTML escape for text
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
  }

  return sanitized;
};

export default api;
