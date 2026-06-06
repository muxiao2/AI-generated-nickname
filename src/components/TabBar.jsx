import React from 'react';

export default function TabBar({ options, value, onChange, className = 'tab' }) {
  return options.map((option) => (
    <button
      key={option}
      className={value === option ? `${className} active` : className}
      onClick={() => onChange(option)}
    >
      {option}
    </button>
  ));
}
