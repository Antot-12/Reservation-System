import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarIntegration from './CalendarIntegration';

// Mock fetch
global.fetch = jest.fn();

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('CalendarIntegration Component', () => {
  const mockAppointment = {
    id: 1,
    start_time: '2026-05-05T10:00:00',
    end_time: '2026-05-05T11:00:00'
  };
  const mockUserPhone = '+380501234567';

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders add to calendar button', () => {
    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    expect(screen.getByText(/Додати в календар/i)).toBeInTheDocument();
  });

  test('fetches calendar links when button is clicked', async () => {
    const mockLinks = {
      google: 'https://calendar.google.com/...',
      outlook: 'https://outlook.live.com/...',
      yahoo: 'https://calendar.yahoo.com/...',
      ics_download: '/api/v1/calendar/appointment/1/ics'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLinks
    });

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/v1/calendar/appointment/1/links?phone=${mockUserPhone}`
      );
    });
  });

  test('shows calendar options after fetching links', async () => {
    const mockLinks = {
      google: 'https://calendar.google.com/...',
      outlook: 'https://outlook.live.com/...',
      yahoo: 'https://calendar.yahoo.com/...'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLinks
    });

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Outlook Calendar')).toBeInTheDocument();
      expect(screen.getByText('Yahoo Calendar')).toBeInTheDocument();
    });
  });

  test('downloads ICS file when download button is clicked', async () => {
    const mockBlob = new Blob(['mock ics content'], { type: 'text/calendar' });

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: 'https://calendar.google.com/...',
          outlook: 'https://outlook.live.com/...',
          yahoo: 'https://calendar.yahoo.com/...'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Завантажити ICS файл/i)).toBeInTheDocument();
    });

    const downloadButton = screen.getByText(/Завантажити ICS файл/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/v1/calendar/appointment/1/ics?phone=${mockUserPhone}`
      );
    });
  });

  test('closes dropdown when close button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        google: 'https://calendar.google.com/...'
      })
    });

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Google Calendar')).not.toBeInTheDocument();
  });

  test('handles fetch error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('shows loading state while fetching', async () => {
    fetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <CalendarIntegration
        appointment={mockAppointment}
        userPhone={mockUserPhone}
      />
    );

    const button = screen.getByText(/Додати в календар/i);
    fireEvent.click(button);

    expect(screen.getByText(/Завантаження.../i)).toBeInTheDocument();
  });
});
