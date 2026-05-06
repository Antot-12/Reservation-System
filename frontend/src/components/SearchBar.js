import React, { useState, useEffect } from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({
  onSearch,
  placeholder = 'Пошук...',
  debounceMs = 500
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={handleClear}
          aria-label="Очистити"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
