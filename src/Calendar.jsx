import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ShiftProvider } from "./ShiftManager";
import { ShiftDisplay } from "./ShiftDisplay";
import { useShift } from "./ShiftManager";

const shiftLabels = [
  "①朝番",
  "②日勤",
  "③昼番",
  "④夜勤",
  "⑤夜番",
  "⑥夜支"
];

// 仮の職員データ（後で職員管理機能を実装する際に置き換えます）
const initialEmployees = [
  { id: 1, name: "山田 太郎" },
  { id: 2, name: "佐藤 花子" },
  { id: 3, name: "鈴木 次郎" },
];

function ShiftCalendar() {
  const [value, setValue] = useState(new Date());
  const { shifts, shiftCounts } = useShift();

  const handleSave = () => {
    const data = {
      shifts,
      shiftCounts,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('currentShift', JSON.stringify(data));
    alert('シフトを保存しました');
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('テンプレート名を入力してください');
    if (!templateName) return;

    const data = {
      id: Date.now(),
      name: templateName,
      shifts,
      shiftCounts,
      createdAt: new Date().toISOString()
    };

    const savedTemplates = JSON.parse(localStorage.getItem('shiftTemplates') || '[]');
    savedTemplates.push(data);
    localStorage.setItem('shiftTemplates', JSON.stringify(savedTemplates));
    alert('テンプレートとして保存しました');
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const currentMonth = value.getMonth();
    if (date.getMonth() !== currentMonth) return null;
    
    return <ShiftDisplay 
      date={date} 
      isSelected={value && 
        value.getDate() === date.getDate() && 
        value.getMonth() === date.getMonth() && 
        value.getFullYear() === date.getFullYear()}
    />;
  };

  return (
    <ShiftProvider>
      <div className="calendar-page">
        <div className="calendar-actions-panel">
          <div className="panel-content">
            <button onClick={handleSave} className="save-btn">
              保存する
            </button>
            <button onClick={handleSaveAsTemplate} className="save-template-btn">
              テンプレートとして保存
            </button>
          </div>
        </div>

        <div className="calendar-panel">
          <div className="panel-content">
            <Calendar
              onChange={setValue}
              value={value}
              locale="ja-JP"
              formatDay={(locale, date) => date.toLocaleDateString("ja-JP", { day: "numeric" })}
              tileContent={tileContent}
              className="shift-calendar"
            />
          </div>
        </div>

        <style>
          {`
            .calendar-page {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              padding: 0.5rem;
            }

            .calendar-actions-panel,
            .calendar-panel {
              background: #fff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              overflow: hidden;
            }

            .panel-content {
              padding: 1.5rem;
            }

            .calendar-actions-panel .panel-content {
              display: flex;
              gap: 1rem;
              padding: 0.5rem 1.5rem;
            }

            .save-btn,
            .save-template-btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 500;
              transition: all 0.2s ease;
              position: relative;
              overflow: hidden;
            }

            .save-btn {
              background: #1976d2;
              color: white;
            }

            .save-btn:hover {
              background: #1565c0;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .save-btn:active {
              transform: translateY(1px);
              box-shadow: none;
            }

            .save-btn::after,
            .save-template-btn::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 5px;
              height: 5px;
              background: rgba(255, 255, 255, 0.5);
              opacity: 0;
              border-radius: 100%;
              transform: scale(1, 1) translate(-50%);
              transform-origin: 50% 50%;
            }

            .save-btn:active::after,
            .save-template-btn:active::after {
              animation: ripple 0.6s ease-out;
            }

            @keyframes ripple {
              0% {
                transform: scale(0, 0);
                opacity: 0.5;
              }
              100% {
                transform: scale(20, 20);
                opacity: 0;
              }
            }

            .save-template-btn {
              background: #4caf50;
              color: white;
            }

            .save-template-btn:hover {
              background: #43a047;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .save-template-btn:active {
              transform: translateY(1px);
              box-shadow: none;
            }

            .shift-calendar {
              width: 100%;
              border: none;
              font-size: 1rem;
            }

            .react-calendar__tile {
              padding: 0.5rem;
              min-height: 100px;
              position: relative;
              transition: all 0.2s ease;
            }

            .react-calendar__tile--now {
              background: none;
            }

            .react-calendar__tile--now:enabled:hover,
            .react-calendar__tile--now:enabled:focus {
              background: #e3f2fd;
            }

            .react-calendar__tile--active {
              background: none !important;
              color: #1976d2 !important;
              font-weight: 600;
            }

            .react-calendar__tile--active::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border: 2px solid #1976d2;
              border-radius: 8px;
              pointer-events: none;
              animation: fadeIn 0.2s ease;
            }

            .react-calendar__tile:enabled:hover,
            .react-calendar__tile:enabled:focus {
              background: #e3f2fd;
              border-radius: 8px;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .shift-badges {
              display: flex;
              flex-direction: column;
              gap: 2px;
              margin-top: 4px;
            }

            .shift-group {
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              gap: 2px;
            }

            .shift-badge {
              display: flex;
              align-items: center;
              transition: all 0.2s ease;
            }

            .shift-select {
              padding: 2px 4px;
              font-size: 0.8rem;
              border: 1px solid #ddd;
              border-radius: 3px;
              background: #f5f7fa;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 100%;
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
            }

            .shift-select::-ms-expand {
              display: none;
            }

            .shift-select:hover {
              background: #e3f2fd;
            }

            .shift-select option {
              background: white;
            }

            .shift-select option:first-child {
              color: #666;
              font-weight: 500;
            }

            .shift-settings {
              transition: all 0.2s ease;
              overflow: hidden;
            }

            .add-shift-btn,
            .remove-shift-btn {
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #ddd;
              border-radius: 2px;
              background: white;
              cursor: pointer;
              font-size: 0.8rem;
              padding: 0;
              color: #666;
              transition: all 0.2s ease;
            }

            .add-shift-btn:hover {
              background: #e3f2fd;
              border-color: #1976d2;
              color: #1976d2;
            }

            .remove-shift-btn:hover {
              background: #ffebee;
              border-color: #d32f2f;
              color: #d32f2f;
            }
          `}
        </style>
      </div>
    </ShiftProvider>
  );
}

export default ShiftCalendar; 