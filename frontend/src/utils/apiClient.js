import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Generic API request handler with comprehensive error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || data || 'Щось пішло не так';

      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          url,
          status: response.status,
          statusText: response.statusText,
          data
        });
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    // Network error or other fetch errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const message = 'Не вдалося з\'єднатися з сервером. Перевірте інтернет з\'єднання.';
      toast.error(message);
      throw new ApiError(message, 0, null);
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      const message = 'Запит перевищив час очікування';
      toast.error(message);
      throw new ApiError(message, 0, null);
    }

    // Unknown errors
    const message = error.message || 'Невідома помилка';
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected error:', error);
    }
    throw new ApiError(message, 0, null);
  }
}

// Helper to show user-friendly error messages
export function handleApiError(error, customMessages = {}) {
  if (error instanceof ApiError) {
    // Custom message for specific status codes
    const statusMessages = {
      400: 'Некоректні дані. Перевірте введену інформацію.',
      401: 'Необхідна авторизація. Будь ласка, увійдіть знову.',
      403: 'Недостатньо прав для виконання цієї дії.',
      404: 'Ресурс не знайдено.',
      409: 'Конфлікт даних. Можливо, цей час вже зайнятий.',
      422: 'Помилка валідації даних.',
      429: 'Занадто багато запитів. Спробуйте пізніше.',
      500: 'Помилка сервера. Спробуйте пізніше.',
      503: 'Сервіс тимчасово недоступний.',
      ...customMessages,
    };

    const message = statusMessages[error.status] || error.message;
    toast.error(message);

    return {
      error: true,
      message,
      status: error.status,
      data: error.data
    };
  }

  // Non-API errors
  toast.error(error.message || 'Виникла несподівана помилка');
  return {
    error: true,
    message: error.message || 'Виникла несподівана помилка',
    status: 0,
    data: null
  };
}

// Export API methods with error handling
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),

  post: (endpoint, data, options = {}) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  }),

  put: (endpoint, data, options = {}) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  }),

  delete: (endpoint, options = {}) => apiRequest(endpoint, {
    method: 'DELETE',
    ...options
  }),

  patch: (endpoint, data, options = {}) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  }),
};

// Export for backward compatibility and specific use cases
export { ApiError };
export default api;
