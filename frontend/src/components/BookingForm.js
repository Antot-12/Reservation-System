import React, { useState } from 'react';
import { createAppointment } from '../services/userService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import '../styles/BookingForm.css';

const BookingForm = ({ phone, selectedSlot, onSuccess }) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        phone,
        start_time: selectedSlot,
      };

      if (isNewUser) {
        data.name = name;
        data.birthdate = birthdate;
      }

      await createAppointment(data);
      toast.success('Запис створено успішно!');
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || 'Помилка створення запису';
      toast.error(message);

      // If error indicates new user, show form
      if (message.includes('необхідно вказати')) {
        setIsNewUser(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUser = async () => {
    setLoading(true);
    try {
      const data = {
        phone,
        start_time: selectedSlot,
      };

      await createAppointment(data);
      toast.success('Запис створено успішно!');
      onSuccess();
    } catch (error) {
      const message = error.response?.data?.detail || '';

      if (message.includes('необхідно вказати')) {
        setIsNewUser(true);
        toast.info('Будь ласка, заповніть форму реєстрації');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isNewUser === null) {
    return (
      <div className="booking-form">
        <h2>Підтвердження запису</h2>
        <div className="booking-info">
          <p><strong>Телефон:</strong> {phone}</p>
          <p><strong>Час:</strong> {format(new Date(selectedSlot), 'dd MMMM yyyy, HH:mm', { locale: uk })}</p>
        </div>
        <button onClick={handleCheckUser} disabled={loading}>
          {loading ? 'Перевірка...' : 'Підтвердити запис'}
        </button>
      </div>
    );
  }

  return (
    <div className="booking-form">
      <h2>Форма реєстрації</h2>

      <div className="booking-info">
        <p><strong>Час:</strong> {format(new Date(selectedSlot), 'dd MMMM yyyy, HH:mm', { locale: uk })}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ім'я та прізвище</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Іван Петренко"
          />
        </div>

        <div className="form-group">
          <label>Дата народження</label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Створення...' : 'Створити запис'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
