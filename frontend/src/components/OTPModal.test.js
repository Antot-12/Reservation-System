import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OTPModal from './OTPModal';
import * as userService from '../services/userService';

// Mock services
jest.mock('../services/userService');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

describe('OTPModal Component', () => {
  const mockOnVerified = jest.fn();
  const mockOnClose = jest.fn();
  const mockSetPhone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders phone input initially', () => {
    render(
      <OTPModal
        phone=""
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText('+380XXXXXXXXX')).toBeInTheDocument();
    expect(screen.getByText('Надіслати код')).toBeInTheDocument();
  });

  test('allows user to enter phone number', async () => {
    const user = userEvent.setup();
    render(
      <OTPModal
        phone=""
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const phoneInput = screen.getByPlaceholderText('+380XXXXXXXXX');
    await user.type(phoneInput, '+380501234567');

    expect(mockSetPhone).toHaveBeenCalled();
  });

  test('sends OTP when form is submitted', async () => {
    userService.sendOTP.mockResolvedValue({});

    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const sendButton = screen.getByText('Надіслати код');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(userService.sendOTP).toHaveBeenCalledWith('+380501234567');
    });
  });

  test('shows OTP input after sending code', async () => {
    userService.sendOTP.mockResolvedValue({});

    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const sendButton = screen.getByText('Надіслати код');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Підтвердити')).toBeInTheDocument();
    });
  });

  test('verifies OTP code', async () => {
    userService.sendOTP.mockResolvedValue({});
    userService.verifyOTP.mockResolvedValue({});

    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    // Send OTP first
    const sendButton = screen.getByText('Надіслати код');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Підтвердити')).toBeInTheDocument();
    });

    // Enter code and verify
    // Note: OTP input implementation may vary
    const verifyButton = screen.getByText('Підтвердити');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(userService.verifyOTP).toHaveBeenCalled();
    });
  });

  test('calls onVerified after successful verification', async () => {
    userService.sendOTP.mockResolvedValue({});
    userService.verifyOTP.mockResolvedValue({});

    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const sendButton = screen.getByText('Надіслати код');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Підтвердити')).toBeInTheDocument();
    });

    const verifyButton = screen.getByText('Підтвердити');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockOnVerified).toHaveBeenCalled();
    });
  });

  test('closes modal when close button is clicked', () => {
    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles errors gracefully', async () => {
    userService.sendOTP.mockRejectedValue({
      response: { data: { detail: 'Error sending OTP' } }
    });

    render(
      <OTPModal
        phone="+380501234567"
        setPhone={mockSetPhone}
        onVerified={mockOnVerified}
        onClose={mockOnClose}
      />
    );

    const sendButton = screen.getByText('Надіслати код');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(userService.sendOTP).toHaveBeenCalled();
    });
  });
});
