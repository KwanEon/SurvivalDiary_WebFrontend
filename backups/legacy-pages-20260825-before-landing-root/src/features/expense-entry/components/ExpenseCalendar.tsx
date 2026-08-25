import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ExpenseCalendarProps {
  selectedDate: string;
  firstDate: string;
  lastDate: string;
  onChange: (date: string) => void;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function dateValue(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function monthParts(value: string) {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

function moveMonth(value: string, offset: number) {
  const { year, month } = monthParts(value);
  const next = new Date(year, month - 1 + offset, 1);
  return monthValue(next.getFullYear(), next.getMonth() + 1);
}

function ExpenseCalendar({ selectedDate, firstDate, lastDate, onChange }: ExpenseCalendarProps) {
  const firstMonth = firstDate.slice(0, 7);
  const lastMonth = lastDate.slice(0, 7);
  const [displayedMonth, setDisplayedMonth] = useState(selectedDate.slice(0, 7));

  useEffect(() => {
    setDisplayedMonth(selectedDate.slice(0, 7));
  }, [selectedDate]);

  const { year, month } = monthParts(displayedMonth);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingEmptyDays = new Date(year, month - 1, 1).getDay();
  const years = useMemo(() => {
    const firstYear = Number(firstDate.slice(0, 4));
    const lastYear = Number(lastDate.slice(0, 4));
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  }, [firstDate, lastDate]);

  const selectYear = (nextYear: number) => {
    const first = monthParts(firstMonth);
    const last = monthParts(lastMonth);
    let nextMonth = month;

    if (nextYear === first.year && nextMonth < first.month) nextMonth = first.month;
    if (nextYear === last.year && nextMonth > last.month) nextMonth = last.month;
    setDisplayedMonth(monthValue(nextYear, nextMonth));
  };

  return (
    <div className="expense-entry-calendar" aria-label="지출 날짜 선택 달력">
      <div className="expense-entry-calendar__controls">
        <button
          type="button"
          aria-label="이전 달"
          disabled={displayedMonth <= firstMonth}
          onClick={() => setDisplayedMonth(moveMonth(displayedMonth, -1))}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="expense-entry-calendar__month">
          <select
            value={year}
            aria-label="연도 선택"
            onChange={(event) => selectYear(Number(event.target.value))}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}년
              </option>
            ))}
          </select>
          <strong>{month}월</strong>
        </div>

        <button
          type="button"
          aria-label="다음 달"
          disabled={displayedMonth >= lastMonth}
          onClick={() => setDisplayedMonth(moveMonth(displayedMonth, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="expense-entry-calendar__weekdays" aria-hidden="true">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="expense-entry-calendar__days">
        {Array.from({ length: leadingEmptyDays }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const value = dateValue(year, month, day);
          const isSelected = value === selectedDate;
          const isToday = value === lastDate;
          const isSelectable = value >= firstDate && value <= lastDate;

          return (
            <button
              type="button"
              className={`${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
              aria-label={`${year}년 ${month}월 ${day}일`}
              aria-pressed={isSelected}
              disabled={!isSelectable}
              key={value}
              onClick={() => onChange(value)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ExpenseCalendar;
