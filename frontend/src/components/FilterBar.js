import React from 'react';
import '../styles/FilterBar.css';

const FilterBar = ({ filters, onFilterChange }) => {
  return (
    <div className="filter-bar">
      {filters.map((filter) => (
        <div key={filter.name} className="filter-group">
          <label htmlFor={filter.name}>{filter.label}</label>
          {filter.type === 'select' ? (
            <select
              id={filter.name}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              className="filter-select"
            >
              <option value="">Всі</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : filter.type === 'date' ? (
            <input
              id={filter.name}
              type="date"
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              className="filter-input"
            />
          ) : (
            <input
              id={filter.name}
              type={filter.type || 'text'}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              placeholder={filter.placeholder}
              className="filter-input"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FilterBar;
