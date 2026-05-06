import React from 'react';
import '../styles/Dashboard.css';

const Dashboard = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">Завантаження статистики...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <h3>Помилка завантаження статистики</h3>
          <p>Будь ласка, оновіть сторінку або увійдіть знову</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Key Metrics */}
        <div className="dashboard-card highlight">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">{stats.appointments_today}</div>
            <div className="card-label">Записів сьогодні</div>
          </div>
        </div>

        <div className="dashboard-card highlight">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <div className="card-value">{stats.upcoming_appointments}</div>
            <div className="card-label">Майбутніх записів</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{stats.total_appointments}</div>
            <div className="card-label">Всього записів</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-value">{stats.total_users}</div>
            <div className="card-label">Всього користувачів</div>
          </div>
        </div>

        {/* Period Stats */}
        <div className="dashboard-card">
          <div className="card-icon">📆</div>
          <div className="card-content">
            <div className="card-value">{stats.appointments_this_week}</div>
            <div className="card-label">Цього тижня</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">{stats.appointments_this_month}</div>
            <div className="card-label">Цього місяця</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{stats.completed_appointments}</div>
            <div className="card-label">Завершено</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <div className="card-value">{stats.cancelled_appointments}</div>
            <div className="card-label">Скасовано</div>
          </div>
        </div>

        {/* Users Stats */}
        <div className="dashboard-card">
          <div className="card-icon">🟢</div>
          <div className="card-content">
            <div className="card-value">{stats.active_users}</div>
            <div className="card-label">Активних користувачів</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🚫</div>
          <div className="card-content">
            <div className="card-value">{stats.blacklisted_users}</div>
            <div className="card-label">В чорному списку</div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="dashboard-section">
        <h3>Записи на найближчі 7 днів</h3>
        <div className="chart-container">
          <div className="bar-chart">
            {stats.appointments_by_day.map((day) => {
              const maxCount = Math.max(...stats.appointments_by_day.map(d => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

              return (
                <div key={day.date} className="bar-item">
                  <div className="bar-value">{day.count > 0 ? day.count : ''}</div>
                  <div className="bar-column">
                    <div
                      className="bar-fill"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.count} записів`}
                    ></div>
                  </div>
                  <div className="bar-label">{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
