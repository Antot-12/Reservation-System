import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BookingForm from './BookingForm';
import * as userService from '../services/userService';

jest.mock('../services/userService');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('BookingForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockPhone = '+380501234567';
  const mockSelectedSlot = '2026-05-05T10:00:00';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all fields', () => {
    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/Ім'я та прізвище/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Дата народження/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText('Підтвердити запис')).toBeInTheDocument();
  });

  test('displays selected slot information', () => {
    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Дата:/i)).toBeInTheDocument();
    expect(screen.getByText(/Час:/i)).toBeInTheDocument();
  });

  test('allows user to fill in form fields', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Ім'я та прізвище/i);
    const birthdateInput = screen.getByLabelText(/Дата народження/i);
    const emailInput = screen.getByLabelText(/Email/i);

    await user.type(nameInput, 'Іван Петренко');
    await user.type(birthdateInput, '1990-01-01');
    await user.type(emailInput, 'ivan@example.com');

    expect(nameInput).toHaveValue('Іван Петренко');
    expect(birthdateInput).toHaveValue('1990-01-01');
    expect(emailInput).toHaveValue('ivan@example.com');
  });

  test('submits form with correct data', async () => {
    userService.createAppointment.mockResolvedValue({});

    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Ім'я та прізвище/i);
    const birthdateInput = screen.getByLabelText(/Дата народження/i);

    fireEvent.change(nameInput, { target: { value: 'Іван Петренко' } });
    fireEvent.change(birthdateInput, { target: { value: '1990-01-01' } });

    const submitButton = screen.getByText('Підтвердити запис');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(userService.createAppointment).toHaveBeenCalledWith(
        mockPhone,
        mockSelectedSlot,
        expect.objectContaining({
          name: 'Іван Петренко',
          birthdate: '1990-01-01'
        })
      );
    });
  });

  test('calls onSuccess after successful booking', async () => {
    userService.createAppointment.mockResolvedValue({});

    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Ім'я та прізвище/i);
    const birthdateInput = screen.getByLabelText(/Дата народження/i);

    fireEvent.change(nameInput, { target: { value: 'Іван Петренко' } });
    fireEvent.change(birthdateInput, { target: { value: '1990-01-01' } });

    const submitButton = screen.getByText('Підтвердити запис');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('validates required fields', async () => {
    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Підтвердити запис');
    fireEvent.click(submitButton);

    // Form should not submit without required fields
    await waitFor(() => {
      expect(userService.createAppointment).not.toHaveBeenCalled();
    });
  });

  test('handles API errors gracefully', async () => {
    userService.createAppointment.mockRejectedValue({
      response: { data: { detail: 'Booking failed' } }
    });

    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Ім'я та прізвище/i);
    const birthdateInput = screen.getByLabelText(/Дата народження/i);

    fireEvent.change(nameInput, { target: { value: 'Іван Петренко' } });
    fireEvent.change(birthdateInput, { target: { value: '1990-01-01' } });

    const submitButton = screen.getByText('Підтвердити запис');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(userService.createAppointment).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  test('disables submit button while loading', async () => {
    userService.createAppointment.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Ім'я та прізвище/i);
    const birthdateInput = screen.getByLabelText(/Дата народження/i);

    fireEvent.change(nameInput, { target: { value: 'Іван Петренко' } });
    fireEvent.change(birthdateInput, { target: { value: '1990-01-01' } });

    const submitButton = screen.getByText('Підтвердити запис');
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test('validates email format if provided', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        phone={mockPhone}
        selectedSlot={mockSelectedSlot}
        onSuccess={mockOnSuccess}
      />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');

    // Check if HTML5 validation is triggered
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
