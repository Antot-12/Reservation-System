import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { toast } from 'react-toastify';
import 'react-calendar/dist/Calendar.css';
import '../styles/AdminScheduleView.css';

const AdminScheduleView = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [daysOff, setDaysOff] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState(null);
  const [editingHours, setEditingHours] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '+380'
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [hoursForm, setHoursForm] = useState({
    start_time: '09:00',
    end_time: '18:00',
    slot_duration: 30
  });

  const loadScheduleConfig = async () => {
    try {
      const response = await fetch('/api/v1/admin/schedule', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduleConfig(data);
        setHoursForm({
          start_time: data.start_time,
          end_time: data.end_time,
          slot_duration: data.slot_duration
        });
      }
    } catch (error) {
      console.error('Error loading schedule config:', error);
    }
  };

  const findFirstAvailableDate = async () => {
    let checkDate = new Date();
    const maxCheckDate = addDays(new Date(), 30); // Check up to 30 days ahead

    while (checkDate <= maxCheckDate) {
      try {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/v1/slots?from_date=${dateStr}&to_date=${dateStr}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setSelectedDate(checkDate);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking date:', error);
      }
      checkDate = addDays(checkDate, 1);
    }

    // If no slots found in 30 days, just select today
    setSelectedDate(new Date());
  };

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/v1/slots?from_date=${dateStr}&to_date=${dateStr}`);
      if (!response.ok) {
        console.error('Failed to load slots:', response.status);
        setSlots([]);
        return;
      }
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadBlockedSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/admin/blocked-slots', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        console.error('Failed to load blocked slots:', response.status);
        setBlockedSlots([]);
        return;
      }
      const data = await response.json();
      setBlockedSlots(data);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
      setBlockedSlots([]);
    }
  }, []);

  const loadBookedAppointments = useCallback(async () => {
    setBookedAppointments([]);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/v1/admin/appointments?from_date=${dateStr}&to_date=${dateStr}&status=booked&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        console.error('Failed to load booked appointments:', response.status);
        setBookedAppointments([]);
        return;
      }
      const data = await response.json();
      setBookedAppointments(data.items || []);
    } catch (error) {
      console.error('Error loading booked appointments:', error);
      setBookedAppointments([]);
    }
  }, [selectedDate]);

  const loadDaysOff = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/admin/days-off', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        console.error('Failed to load days off:', response.status);
        setDaysOff([]);
        return;
      }
      const data = await response.json();
      setDaysOff(data);
    } catch (error) {
      console.error('Error loading days off:', error);
      setDaysOff([]);
    }
  }, []);

  // Find the first available date on mount
  useEffect(() => {
    findFirstAvailableDate();
    loadScheduleConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when selected date changes
  useEffect(() => {
    if (selectedDate) {
      loadSlots();
      loadBlockedSlots();
      loadBookedAppointments();
      loadDaysOff();
    }
  }, [selectedDate, loadSlots, loadBlockedSlots, loadBookedAppointments, loadDaysOff]);

  const blockSlot = async (slot) => {
    try {
      const response = await fetch('/api/v1/admin/block-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          start_time: slot.start_time,
          end_time: slot.end_time
        })
      });

      if (response.ok) {
        toast.success('Слот заблоковано');
        loadBlockedSlots();
        loadSlots();
      } else {
        const error = await response.text();
        console.error('Failed to block slot:', response.status, error);
        toast.error(`Помилка блокування: ${response.status}`);
      }
    } catch (error) {
      console.error('Error blocking slot:', error);
      toast.error('Помилка з\'єднання');
    }
  };

  const openBookingForm = (slot) => {
    setBookingSlot(slot);
    setBookingForm({
      name: '',
      phone: '+380'
    });
  };

  const closeBookingForm = (force = false) => {
    if (bookingSubmitting && !force) return;
    setBookingSlot(null);
    setBookingForm({
      name: '',
      phone: '+380'
    });
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!bookingSlot) return;

    setBookingSubmitting(true);
    try {
      const response = await fetch('/api/v1/admin/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          name: bookingForm.name.trim(),
          phone: bookingForm.phone.trim(),
          start_time: bookingSlot.start_time
        })
      });

      if (response.ok) {
        toast.success('Запис створено');
        closeBookingForm(true);
        loadSlots();
        loadBookedAppointments();
      } else {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || `Помилка створення: ${response.status}`;
        toast.error(message);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Помилка з\'єднання');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const unblockSlot = async (slotId) => {
    try {
      const response = await fetch(`/api/v1/admin/blocked-slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        toast.success('Слот розблоковано');
        loadBlockedSlots();
        loadSlots();
      } else {
        const error = await response.text();
        console.error('Failed to unblock slot:', response.status, error);
        toast.error(`Помилка розблокування: ${response.status}`);
      }
    } catch (error) {
      console.error('Error unblocking slot:', error);
      toast.error('Помилка з\'єднання');
    }
  };

  const blockDay = async (date) => {
    try {
      const response = await fetch('/api/v1/admin/days-off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd')
        })
      });

      if (response.ok) {
        loadDaysOff();
        loadSlots();
      }
    } catch (error) {
      console.error('Error blocking day:', error);
    }
  };

  const unblockDay = async (date) => {
    const dayOff = daysOff.find(d => isSameDay(new Date(d.date), date));
    if (!dayOff) return;

    try {
      const response = await fetch(`/api/v1/admin/days-off/${dayOff.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        loadDaysOff();
        loadSlots();
      }
    } catch (error) {
      console.error('Error unblocking day:', error);
    }
  };

  const blockRecurringDayOfWeek = async (dayOfWeek) => {
    // dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, etc.
    // Block ALL occurrences of this day in the current month
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // Find all dates in the month that match this day of week
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const datesToCheck = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === dayOfWeek) {
        datesToCheck.push(date);
      }
    }

    if (datesToCheck.length === 0) return;

    // Check if any of these days are already blocked
    const blockedDates = datesToCheck.filter(date => isDayOff(date));
    const shouldUnblock = blockedDates.length >= datesToCheck.length / 2;

    try {
      if (shouldUnblock) {
        // Unblock all matching days
        const promises = blockedDates.map(date => {
          const dayOff = daysOff.find(d => isSameDay(new Date(d.date), date));
          if (!dayOff) return Promise.resolve();

          return fetch(`/api/v1/admin/days-off/${dayOff.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          });
        });

        await Promise.all(promises);
        toast.success(`Всі дні розблоковано (${blockedDates.length} днів)`);
      } else {
        // Block all matching days
        const promises = datesToCheck.map(date =>
          fetch('/api/v1/admin/days-off', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
              date: format(date, 'yyyy-MM-dd')
            })
          })
        );

        await Promise.all(promises);
        toast.success(`Всі дні заблоковано (${datesToCheck.length} днів)`);
      }

      loadDaysOff();
      loadSlots();
    } catch (error) {
      console.error('Error toggling recurring days:', error);
      toast.error('Помилка зміни днів');
    }
  };

  const isWholeWeekBlocked = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    let blockedCount = 0;

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      if (isDayOff(date)) {
        blockedCount++;
      }
    }

    // If more than half the week is blocked, consider it "blocked"
    return blockedCount >= 4;
  };

  const isDayOfWeekBlocked = (dayOfWeek) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let blockedCount = 0;
    let totalCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === dayOfWeek) {
        totalCount++;
        if (isDayOff(date)) {
          blockedCount++;
        }
      }
    }

    // If more than half are blocked, show as blocked
    return blockedCount >= totalCount / 2;
  };

  const toggleWeek = async () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const shouldUnblock = isWholeWeekBlocked();

    try {
      if (shouldUnblock) {
        // Unblock all days in the week
        const weekDaysOff = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i);
          const dayOff = daysOff.find(d => isSameDay(new Date(d.date), date));
          if (dayOff) {
            weekDaysOff.push(dayOff);
          }
        }

        const promises = weekDaysOff.map(dayOff =>
          fetch(`/api/v1/admin/days-off/${dayOff.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          })
        );

        await Promise.all(promises);
        toast.success('Тиждень розблоковано');
      } else {
        // Block all days in the week
        const promises = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i);
          promises.push(
            fetch('/api/v1/admin/days-off', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              },
              body: JSON.stringify({
                date: format(date, 'yyyy-MM-dd')
              })
            })
          );
        }

        await Promise.all(promises);
        toast.success('Тиждень заблоковано');
      }

      loadDaysOff();
      loadSlots();
    } catch (error) {
      console.error('Error toggling week:', error);
      toast.error('Помилка зміни тижня');
    }
  };

  const handleUpdateHours = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/admin/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(hoursForm)
      });

      if (response.ok) {
        toast.success('Робочі години оновлено');
        setEditingHours(false);
        loadScheduleConfig();
        loadSlots();
      } else {
        const error = await response.text();
        console.error('Failed to update hours:', response.status, error);
        toast.error(`Помилка оновлення: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating hours:', error);
      toast.error('Помилка з\'єднання');
    }
  };

  const isDayOff = (date) => {
    return daysOff.some(d => isSameDay(new Date(d.date), date));
  };

  const isSlotBlocked = (slot) => {
    return blockedSlots.some(bs =>
      new Date(bs.start_time).getTime() === new Date(slot.start_time).getTime()
    );
  };

  const getSlotBlockedId = (slot) => {
    const blocked = blockedSlots.find(bs =>
      new Date(bs.start_time).getTime() === new Date(slot.start_time).getTime()
    );
    return blocked?.id;
  };

  const getDayBlockedSlots = () => {
    if (!selectedDate) return [];
    return blockedSlots.filter(bs => {
      const bsDate = new Date(bs.start_time).toDateString();
      const selDate = selectedDate.toDateString();
      return bsDate === selDate;
    });
  };

  const buildScheduleSlots = () => {
    const slotMap = new Map();

    slots.forEach(slot => {
      slotMap.set(new Date(slot.start_time).getTime(), {
        type: 'available',
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot
      });
    });

    bookedAppointments.forEach(appointment => {
      slotMap.set(new Date(appointment.start_time).getTime(), {
        type: 'booked',
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        appointment
      });
    });

    getDayBlockedSlots().forEach(blockedSlot => {
      const key = new Date(blockedSlot.start_time).getTime();
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          type: 'blocked',
          start_time: blockedSlot.start_time,
          end_time: blockedSlot.end_time,
          blockedSlot
        });
      }
    });

    return Array.from(slotMap.values()).sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && isDayOff(date)) {
      return 'day-off-tile';
    }
    return null;
  };

  const currentDayOff = selectedDate ? isDayOff(selectedDate) : false;
  const scheduleSlots = buildScheduleSlots();

  if (!selectedDate) {
    return (
      <div className="admin-schedule-view">
        <div className="schedule-header">
          <h2>Керування розкладом</h2>
        </div>
        <div className="slots-loading">Пошук доступних дат...</div>
      </div>
    );
  }

  return (
    <div className="admin-schedule-view">
      {/* Working Hours Settings */}
      <div className="working-hours-section">
        <div className="section-header">
          <h3>⏰ Робочі години</h3>
          {!editingHours && scheduleConfig && (
            <button onClick={() => setEditingHours(true)} className="btn-edit-hours">
              Редагувати
            </button>
          )}
        </div>

        {editingHours ? (
          <form onSubmit={handleUpdateHours} className="hours-form">
            <div className="form-row">
              <div className="form-field">
                <label>Початок роботи</label>
                <input
                  type="time"
                  value={hoursForm.start_time}
                  onChange={(e) => setHoursForm({...hoursForm, start_time: e.target.value})}
                  required
                />
              </div>

              <div className="form-field">
                <label>Кінець роботи</label>
                <input
                  type="time"
                  value={hoursForm.end_time}
                  onChange={(e) => setHoursForm({...hoursForm, end_time: e.target.value})}
                  required
                />
              </div>

              <div className="form-field">
                <label>Тривалість слоту (хв)</label>
                <select
                  value={hoursForm.slot_duration}
                  onChange={(e) => setHoursForm({...hoursForm, slot_duration: parseInt(e.target.value)})}
                  required
                >
                  <option value="30">30 хвилин</option>
                  <option value="45">45 хвилин</option>
                  <option value="60">60 хвилин (1 год)</option>
                  <option value="90">90 хвилин (1.5 год)</option>
                  <option value="120">120 хвилин (2 год)</option>
                  <option value="180">180 хвилин (3 год)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">Зберегти</button>
              <button type="button" onClick={() => setEditingHours(false)} className="btn-cancel">
                Скасувати
              </button>
            </div>
          </form>
        ) : scheduleConfig ? (
          <div className="hours-display">
            <div className="hours-info">
              <span className="hours-label">Початок:</span>
              <span className="hours-value">{scheduleConfig.start_time}</span>
            </div>
            <div className="hours-info">
              <span className="hours-label">Кінець:</span>
              <span className="hours-value">{scheduleConfig.end_time}</span>
            </div>
            <div className="hours-info">
              <span className="hours-label">Слот:</span>
              <span className="hours-value">{scheduleConfig.slot_duration} хв</span>
            </div>
          </div>
        ) : (
          <div className="hours-loading">Завантаження...</div>
        )}
      </div>

      <div className="schedule-layout">
        <div className="calendar-section">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="uk-UA"
              tileClassName={tileClassName}
            />

            <div className="calendar-controls-overlay">
              <div className="week-block-button">
                <button
                  onClick={toggleWeek}
                  className={`btn-week-toggle ${isWholeWeekBlocked() ? 'blocked' : ''}`}
                  title="Заблокувати/розблокувати весь тиждень"
                >
                  {isWholeWeekBlocked() ? '✓ Розблокувати тиждень' : '✕ Заблокувати тиждень'}
                </button>
              </div>
              <div className="recurring-buttons-compact">
                <button
                  onClick={() => blockRecurringDayOfWeek(1)}
                  className={`btn-day ${isDayOfWeekBlocked(1) ? 'blocked' : ''}`}
                  title="Понеділок"
                >
                  Пн
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(2)}
                  className={`btn-day ${isDayOfWeekBlocked(2) ? 'blocked' : ''}`}
                  title="Вівторок"
                >
                  Вт
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(3)}
                  className={`btn-day ${isDayOfWeekBlocked(3) ? 'blocked' : ''}`}
                  title="Середа"
                >
                  Ср
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(4)}
                  className={`btn-day ${isDayOfWeekBlocked(4) ? 'blocked' : ''}`}
                  title="Четвер"
                >
                  Чт
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(5)}
                  className={`btn-day ${isDayOfWeekBlocked(5) ? 'blocked' : ''}`}
                  title="П'ятниця"
                >
                  Пт
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(6)}
                  className={`btn-day ${isDayOfWeekBlocked(6) ? 'blocked' : ''}`}
                  title="Субота"
                >
                  Сб
                </button>
                <button
                  onClick={() => blockRecurringDayOfWeek(0)}
                  className={`btn-day ${isDayOfWeekBlocked(0) ? 'blocked' : ''}`}
                  title="Неділя"
                >
                  Нд
                </button>
              </div>
            </div>
          </div>

          <div className="day-controls">
            <h3>Керування днем: {format(selectedDate, 'dd MMMM yyyy', { locale: uk })}</h3>
            {currentDayOff ? (
              <button onClick={() => unblockDay(selectedDate)} className="btn-enable-day">
                ✓ Включити робочий день
              </button>
            ) : (
              <button onClick={() => blockDay(selectedDate)} className="btn-disable-day">
                ✕ Зробити вихідним
              </button>
            )}
          </div>
        </div>

        <div className="slots-section">
          <div className="slots-header">
            <h3>Слоти на {format(selectedDate, 'dd MMMM yyyy', { locale: uk })}</h3>
            {currentDayOff && (
              <div className="day-off-notice">
                <span className="notice-icon">🚫</span>
                Цей день позначений як вихідний
              </div>
            )}
          </div>

          {loading ? (
            <div className="slots-loading">Завантаження...</div>
          ) : (
            <>
              {scheduleSlots.length > 0 && (
                <div className="slots-grid">
                  {scheduleSlots.map((scheduleSlot, index) => {
                    const blocked = scheduleSlot.type === 'blocked' || isSlotBlocked(scheduleSlot);
                    const booked = scheduleSlot.type === 'booked';
                    const blockedId = scheduleSlot.blockedSlot?.id || getSlotBlockedId(scheduleSlot);
                    const appointment = scheduleSlot.appointment;

                    return (
                      <div
                        key={index}
                        className={`slot-card ${booked ? 'booked' : blocked ? 'blocked' : 'available'}`}
                      >
                        <div className="slot-time">
                          {format(new Date(scheduleSlot.start_time), 'HH:mm')} - {format(new Date(scheduleSlot.end_time), 'HH:mm')}
                        </div>
                        <div className="slot-status">
                          {booked ? 'Заброньовано' : blocked ? 'Заблоковано' : 'Доступний'}
                        </div>
                        {booked && appointment?.user && (
                          <div className="slot-patient">
                            <strong>{appointment.user.name}</strong>
                            <span>{appointment.user.phone}</span>
                            {appointment.notes && <span>{appointment.notes}</span>}
                          </div>
                        )}
                        <div className="slot-actions">
                          {!blocked && !booked && (
                            <button
                              className="slot-action book"
                              onClick={() => openBookingForm(scheduleSlot)}
                            >
                              Записати
                            </button>
                          )}
                          {!booked && (
                            <button
                              className={`slot-action ${blocked ? 'unblock' : 'block'}`}
                              onClick={() => blocked ? unblockSlot(blockedId) : blockSlot(scheduleSlot)}
                            >
                              {blocked ? 'Розблокувати' : 'Заблокувати'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {scheduleSlots.length === 0 && (
                <div className="no-slots">
                  <p>Немає слотів на цю дату</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {bookingSlot && (
        <div className="appointment-modal-backdrop" onClick={() => closeBookingForm()}>
          <form className="appointment-modal" onSubmit={createAppointment} onClick={(e) => e.stopPropagation()}>
            <div className="appointment-modal-header">
              <h3>Новий запис</h3>
              <button type="button" className="modal-close" onClick={() => closeBookingForm()} aria-label="Закрити">
                ×
              </button>
            </div>

            <div className="appointment-slot-summary">
              {format(new Date(bookingSlot.start_time), 'dd MMMM yyyy, HH:mm', { locale: uk })} - {format(new Date(bookingSlot.end_time), 'HH:mm')}
            </div>

            <div className="form-field">
              <label>Ім'я пацієнта</label>
              <input
                type="text"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                minLength="2"
                maxLength="100"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Телефон</label>
              <input
                type="tel"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                placeholder="+380XXXXXXXXX"
                pattern="\+380[0-9]{9}"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={bookingSubmitting}>
                {bookingSubmitting ? 'Створення...' : 'Створити запис'}
              </button>
              <button type="button" onClick={() => closeBookingForm()} className="btn-cancel" disabled={bookingSubmitting}>
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminScheduleView;
