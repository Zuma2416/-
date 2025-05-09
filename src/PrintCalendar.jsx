import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const shiftLabels = [
  "①朝番",
  "②日勤",
  "③昼番",
  "④夜勤",
  "⑤夜番",
  "⑥夜支"
];

const PrintCalendar = ({ shifts = {}, value = new Date() }) => {
  // 日付をYYYY-MM-DD形式で管理
  const formatDate = (date) => date.toISOString().split("T")[0];

  // カレンダーの各セルに勤務枠を表示（編集不可）
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const currentMonth = value.getMonth();
    if (date.getMonth() !== currentMonth) return null;
    const dayShifts = shifts[formatDate(date)] || {};
    return (
      <div className="shift-badges">
        {shiftLabels.map((label, idx) => (
          <div key={idx} className={`shift-badge${dayShifts[idx] ? " filled" : ""}`}
            title={label}
          >
            <span className="shift-label">{label}</span>
            <span className="shift-name">{dayShifts[idx] || ""}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="print-calendar-root">
      <h2 className="calendar-title">シフトカレンダー</h2>
      <button className="print-btn" onClick={() => window.print()}>印刷</button>
      <div className="print-calendar-container">
        <Calendar
          value={value}
          locale="ja-JP"
          tileContent={tileContent}
        />
      </div>
      <style>
        {`
        .print-btn {
          display: block;
          margin: 0 auto 12px auto;
          padding: 8px 24px;
          font-size: 1.1em;
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        @media print {
          .print-btn { display: none !important; }
          body, html, #root, .print-calendar-root {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: #fff !important;
          }
          .print-calendar-container {
            width: 190mm;
            height: 265mm;
            margin: 0 auto;
            padding: 0;
            background: #fff;
            box-shadow: none;
            border-radius: 0;
          }
          .react-calendar {
            width: 100% !important;
            height: 100% !important;
            font-size: 18px;
          }
          .react-calendar__tile {
            min-height: 32mm;
            border: 1px solid #888;
            border-radius: 0;
            box-sizing: border-box;
            background: #fff;
          }
          .shift-badges {
            gap: 2px;
          }
          .shift-badge {
            font-size: 1.1em;
            min-height: 6mm;
            padding: 0 2px;
          }
        }
        .print-calendar-root {
          font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
          background: #fff;
          min-height: 100vh;
          padding: 0;
        }
        .calendar-title {
          text-align: center;
          font-size: 2.2rem;
          font-weight: 700;
          color: #1976d2;
          margin-bottom: 12px;
          letter-spacing: 0.1em;
        }
        .print-calendar-container {
          background: #fff;
          border-radius: 0;
          box-shadow: none;
          padding: 0;
          max-width: 210mm;
          max-height: 297mm;
          aspect-ratio: 210/297;
          margin: 0 auto;
        }
        .react-calendar {
          border: none;
          background: transparent;
          font-size: 1.2rem;
        }
        .react-calendar__tile {
          border: 1px solid #888;
          border-radius: 0;
          min-height: 48px;
          box-sizing: border-box;
          background: #fff;
        }
        .shift-badges {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-top: 1px;
          flex-wrap: nowrap;
          justify-content: flex-start;
        }
        .shift-badge {
          display: flex;
          flex-direction: row;
          align-items: center;
          min-width: 36px;
          min-height: 16px;
          background: #f1f8fe;
          border-radius: 3px;
          border: 1px solid #bbdefb;
          padding: 0 2px;
          font-size: 0.95em;
          color: #1976d2;
        }
        .shift-badge.filled {
          background: #1976d2;
          color: #fff;
          border: 1px solid #1976d2;
          font-weight: 600;
        }
        .shift-label {
          margin-right: 1px;
          font-size: 0.95em;
        }
        .shift-name {
          font-size: 0.95em;
          font-weight: 500;
        }
        `}
      </style>
    </div>
  );
};

export default PrintCalendar; 