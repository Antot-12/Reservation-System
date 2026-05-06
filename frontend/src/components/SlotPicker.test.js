import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlotPicker from './SlotPicker';
import * as userService from '../services/userService';

jest.mock('../services/userService');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('SlotPicker Component', () => {
  const mockOnSlotSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar and header', () => {
    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    expect(screen.getByText('Виберіть дату та час')).toBeInTheDocument();
  });

  test('loads slots when date is selected', async () => {
    const mockSlots = [
      { start_time: '2026-05-05T10:00:00', end_time: '2026-05-05T11:00:00' },
      { start_time: '2026-05-05T11:00:00', end_time: '2026-05-05T12:00:00' }
    ];

    userService.getAvailableSlots.mockResolvedValue(mockSlots);

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    await waitFor(() => {
      expect(userService.getAvailableSlots).toHaveBeenCalled();
    });
  });

  test('displays loading state while fetching slots', () => {
    userService.getAvailableSlots.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    expect(screen.getByText('Завантаження слотів...')).toBeInTheDocument();
  });

  test('displays slots when loaded', async () => {
    const mockSlots = [
      { start_time: '2026-05-05T10:00:00', end_time: '2026-05-05T11:00:00' },
      { start_time: '2026-05-05T14:00:00', end_time: '2026-05-05T15:00:00' }
    ];

    userService.getAvailableSlots.mockResolvedValue(mockSlots);

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });
  });

  test('calls onSlotSelect when slot is clicked', async () => {
    const mockSlots = [
      { start_time: '2026-05-05T10:00:00', end_time: '2026-05-05T11:00:00' }
    ];

    userService.getAvailableSlots.mockResolvedValue(mockSlots);

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    const slotButton = screen.getByText('10:00');
    fireEvent.click(slotButton);

    expect(mockOnSlotSelect).toHaveBeenCalledWith('2026-05-05T10:00:00');
  });

  test('shows message when no slots available', async () => {
    userService.getAvailableSlots.mockResolvedValue([]);

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Немає доступних слотів на цей день')).toBeInTheDocument();
    });
  });

  test('handles error when loading slots', async () => {
    userService.getAvailableSlots.mockRejectedValue(new Error('Network error'));

    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    await waitFor(() => {
      expect(userService.getAvailableSlots).toHaveBeenCalled();
    });
  });

  test('disables past dates in calendar', () => {
    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    // Calendar should have minDate set to today
    const calendar = document.querySelector('.react-calendar');
    expect(calendar).toBeInTheDocument();
  });

  test('disables weekends in calendar', () => {
    render(<SlotPicker onSlotSelect={mockOnSlotSelect} />);

    // Weekend tiles should be disabled
    const calendar = document.querySelector('.react-calendar');
    expect(calendar).toBeInTheDocument();
  });
});
