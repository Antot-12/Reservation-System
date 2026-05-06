import React from 'react';
import './NotFound.css';

function NotFound({ onNavigate }) {
  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.location.href = page === 'booking' ? '/' : `/${page}`;
    }
  };

  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-animation">
          <div className="number">4</div>
          <div className="stethoscope">🩺</div>
          <div className="number">4</div>
        </div>

        <h1>Сторінку не знайдено</h1>

        <p className="not-found-message">
          Схоже, ця сторінка пішла на перерву або не існує.
        </p>

        <div className="not-found-suggestions">
          <p>Можливо, ви шукали:</p>
          <ul>
            <li>
              <button onClick={() => handleNavigate('booking')} className="link-button">
                🏠 Головна сторінка
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('booking')} className="link-button">
                📅 Записатися на прийом
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('admin')} className="link-button">
                👨‍⚕️ Адмін панель
              </button>
            </li>
          </ul>
        </div>

        <button onClick={() => handleNavigate('booking')} className="btn-home">
          Повернутися на головну
        </button>
      </div>
    </div>
  );
}

export default NotFound;
