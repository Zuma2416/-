import React from 'react';

export function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{
        display: value === index ? 'block' : 'none',
        padding: '0.25rem 0'
      }}
    >
      {value === index && children}
    </div>
  );
}

export function Tabs({ value, onChange, children }) {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {children}
      </div>
      <style>
        {`
          .tabs-container {
            width: 100%;
          }

          .tabs-header {
            display: flex;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            border-radius: 8px 8px 0 0;
          }
        `}
      </style>
    </div>
  );
}

export function Tab({ label, value, selected, onClick }) {
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`tab-button ${selected ? 'selected' : ''}`}
    >
      {label}
      <style>
        {`
          .tab-button {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 1rem;
            color: #666;
            position: relative;
            transition: all 0.2s ease;
          }

          .tab-button:hover {
            color: #1976d2;
            background: rgba(25, 118, 210, 0.04);
          }

          .tab-button.selected {
            color: #1976d2;
            font-weight: 500;
          }

          .tab-button.selected::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #1976d2;
          }
        `}
      </style>
    </button>
  );
} 