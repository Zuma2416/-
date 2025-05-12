import React, { useState, useRef, useEffect } from 'react';
import { useShift } from './ShiftManager';

const shiftLabels = [
  "①朝番",
  "②日勤",
  "③昼番",
  "④夜勤",
  "⑤夜番",
  "⑥夜支"
];

// 仮の職員データ
const initialEmployees = [
  { id: 1, name: "山田 太郎" },
  { id: 2, name: "佐藤 花子" },
  { id: 3, name: "鈴木 次郎" },
];

export function ShiftDisplay({ date, isSelected }) {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const settingsRef = useRef(null);
  const { shifts, shiftCounts, handleShiftChange, handleAddShift, handleRemoveShift } = useShift();

  const handleMouseEnter = () => {
    if (isSelected) {
      setIsSettingsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsSettingsVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dateStr = date.toISOString().split("T")[0];
  const dayShifts = shifts[dateStr] || {};
  const dayShiftCounts = shiftCounts[dateStr] || {};

  return (
    <div className="shift-badges">
      {shiftLabels.map((label, idx) => {
        const count = dayShiftCounts[label] || 1;
        return (
          <div key={idx} className="shift-group" style={{ flexDirection: count === 1 ? 'column' : 'row' }}>
            {Array.from({ length: count }).map((_, i) => (
              <div 
                key={i} 
                className="shift-badge"
                style={{ width: count === 1 ? '100%' : 'calc(50% - 1px)' }}
              >
                <select
                  value={dayShifts[`${label}-${i}`] || ""}
                  onChange={(e) => handleShiftChange(date, `${label}-${i}`, e.target.value)}
                  className="shift-select"
                  style={{
                    width: isSettingsVisible && isSelected ? 'calc(100% - 24px)' : '100%'
                  }}
                >
                  <option value="">{label} {count > 1 ? `${i + 1}` : ""}</option>
                  {initialEmployees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                {isSelected && (
                  <div 
                    ref={settingsRef}
                    className="shift-settings"
                    style={{
                      opacity: isSettingsVisible ? 1 : 0,
                      width: isSettingsVisible ? '20px' : '0',
                      marginLeft: isSettingsVisible ? '4px' : '0'
                    }}
                  >
                    {i === 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddShift(date, label);
                        }}
                        className="add-shift-btn"
                        title="シフト枠を追加"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveShift(date, label, i);
                        }}
                        className="remove-shift-btn"
                        title="シフト枠を削除"
                      >
                        -
                      </button>
                    )}
                  </div>
                )}
                {isSelected && (
                  <div 
                    className="hover-area"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: '33%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
} 