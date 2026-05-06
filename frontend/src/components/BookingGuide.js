import React, { useState } from 'react';
import '../styles/BookingGuide.css';

const BookingGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      number: 1,
      icon: '📱',
      title: 'Підтвердіть телефон',
      description: 'Введіть номер телефону та підтвердіть його за допомогою SMS-коду'
    },
    {
      number: 2,
      icon: '📅',
      title: 'Оберіть дату',
      description: 'Виберіть зручну дату в календарі (доступні робочі дні)'
    },
    {
      number: 3,
      icon: '🕐',
      title: 'Оберіть час',
      description: 'Виберіть доступний час з запропонованих слотів'
    },
    {
      number: 4,
      icon: '📝',
      title: 'Заповніть форму',
      description: "Вкажіть ім'я, дату народження та email (за бажанням)"
    },
    {
      number: 5,
      icon: '✅',
      title: 'Підтвердіть запис',
      description: 'Перевірте дані та підтвердіть запис на прийом'
    },
    {
      number: 6,
      icon: '🔔',
      title: 'Очікуйте нагадування',
      description: 'Ви отримаєте SMS-нагадування за 24 години до прийому'
    }
  ];

  return (
    <div className="booking-guide">
      <div className="guide-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="guide-icon">📖</span>
          Як забронювати прийом?
        </h3>
        <button className="toggle-button">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="guide-content">
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-icon">{step.icon}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="guide-tips">
            <h4>💡 Корисні поради</h4>
            <ul>
              <li>Бронювання можливе на 2 місяці вперед</li>
              <li>Скасувати запис можна за 48 годин до прийому</li>
              <li>Одночасно можна мати максимум 6 активних записів</li>
              <li>Приходьте на 5-10 хвилин раніше призначеного часу</li>
              <li>Візьміть з собою паспорт та медичну картку</li>
            </ul>
          </div>

          <div className="guide-faq">
            <h4>❓ Часті питання</h4>
            <div className="faq-item">
              <strong>Що робити, якщо не отримав SMS?</strong>
              <p>Спробуйте надіслати код повторно або зверніться за допомогою</p>
            </div>
            <div className="faq-item">
              <strong>Чи можна змінити час прийому?</strong>
              <p>Так, скасуйте поточний запис та створіть новий</p>
            </div>
            <div className="faq-item">
              <strong>Як переглянути свої записи?</strong>
              <p>Натисніть кнопку "Мій профіль" після авторизації</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGuide;
