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

// 印刷ボタンコンポーネント
const PrintButton = () => (
  <button className="print-btn" onClick={() => window.print()}>印刷</button>
);

// シフト編集パネルコンポーネント
const SidePanel = ({ date, shifts }) => {
  const formatDate = (date) => date?.toISOString().split("T")[0];
  if (!date) {
    return (
      <div className="side-panel">
        <h3>シフト編集</h3>
        <div style={{ color: '#888', marginTop: '16px' }}>日付を選択してください</div>
      </div>
    );
  }
  const dateStr = formatDate(date);
  const dayShifts = shifts[dateStr] || {};
  return (
    <div className="side-panel">
      <h3>{dateStr} のシフト編集</h3>
      <ul>
        {shiftLabels.map((label, idx) => (
          <li key={idx}>{label}：{dayShifts[idx] || "(未設定)"}</li>
        ))}
      </ul>
    </div>
  );
};

// 職員別設定パネルコンポーネント
const StaffSettingsPanel = () => {
  // 仮の職員リスト
  const staffList = [
    { name: "山田 太郎", ngDays: "", maxDays: 20 },
    { name: "佐藤 花子", ngDays: "", maxDays: 18 },
    { name: "鈴木 次郎", ngDays: "", maxDays: 22 },
  ];
  return (
    <div className="staff-settings-panel">
      <h4>職員別設定</h4>
      <table>
        <thead>
          <tr>
            <th>氏名</th>
            <th>NG日</th>
            <th>最大出勤日数</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff, idx) => (
            <tr key={idx}>
              <td>{staff.name}</td>
              <td><input type="text" placeholder="例: 5,12,19" defaultValue={staff.ngDays} /></td>
              <td><input type="number" min="0" defaultValue={staff.maxDays} style={{ width: 60 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ShiftCalendar = () => {
  const [value, setValue] = useState(new Date());
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  // 日付をYYYY-MM-DD形式で管理
  const formatDate = (date) => date.toISOString().split("T")[0];

  // 各セルの勤務枠をクリックで編集
  const handleShiftClick = (date, idx) => {
    setSelectedDate(date);
  };

  // カレンダーの各セルに勤務枠を表示
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    // 当月以外は何も描画しない
    const currentMonth = value.getMonth();
    if (date.getMonth() !== currentMonth) return null;
    const dayShifts = shifts[formatDate(date)] || {};
    return (
      <div className="shift-badges">
        {shiftLabels.map((label, idx) => (
          <div
            key={idx}
            className={`shift-badge${dayShifts[idx] ? " filled" : ""}`}
            onClick={e => {
              e.stopPropagation();
              handleShiftClick(date, idx);
            }}
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
    <div className="calendar-flex">
      <div className="calendar-root">
        <div className="calendar-container">
          <Calendar
            onChange={setValue}
            value={value}
            locale="ja-JP"
            tileContent={tileContent}
          />
        </div>
      </div>
      <div className="side-panel-outer">
        <PrintButton />
        <SidePanel date={selectedDate} shifts={shifts} />
        <StaffSettingsPanel />
      </div>
      <style>
        {`
        .calendar-flex {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          height: 100%;
        }
        .calendar-root, .side-panel-outer {
          height: 100%;
        }
        .side-panel-outer {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 320px;
          max-width: 400px;
          margin-left: 32px;
        }
        .print-btn {
          margin-bottom: 16px;
          align-self: flex-end;
          display: block;
          padding: 8px 24px;
          font-size: 1.1em;
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .side-panel {
          width: 100%;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          padding: 24px 20px;
          font-size: 1.05em;
          overflow: auto;
        }
        .side-panel h3 {
          margin-top: 0;
          font-size: 1.2em;
          color: #1976d2;
        }
        .side-panel ul {
          padding-left: 1em;
        }
        .side-panel li {
          margin-bottom: 8px;
        }
        .calendar-root {
          font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
          background: #f7f9fb;
          min-height: 100vh;
          padding: 32px 0;
        }
        .calendar-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1976d2;
          margin-bottom: 24px;
          letter-spacing: 0.1em;
        }
        .calendar-container {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 32px 16px 16px 16px;
          max-width: 900px;
          max-height: 1270px;
          aspect-ratio: 1/1.41;
          margin: 0 auto;
        }
        .react-calendar {
          border: none;
          background: transparent;
          font-size: 1.1rem;
        }
        .react-calendar__month-view__days {
          border: 1px solid #e0e0e0;
          border-radius: 0;
        }
        .react-calendar__tile {
          border: 1px solid #e0e0e0;
          border-radius: 0;
          min-height: 48px;
          box-sizing: border-box;
          background: #fff;
          transition: background 0.2s;
        }
        .react-calendar__tile--active {
          background: #e3f2fd !important;
          color: #1976d2 !important;
        }
        .react-calendar__tile--now {
          background: none !important;
          border: none !important;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #e57373;
        }
        .react-calendar__tile--neighboringMonth {
          color: #bdbdbd !important;
          background: #fafafa !important;
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
          font-size: 0.78em;
          color: #1976d2;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .shift-badge.filled {
          background: #1976d2;
          color: #fff;
          border: 1px solid #1976d2;
          font-weight: 600;
        }
        .shift-badge:hover {
          background: #90caf9;
          color: #fff;
        }
        .shift-label {
          margin-right: 1px;
          font-size: 0.78em;
        }
        .shift-name {
          font-size: 0.78em;
          font-weight: 500;
        }
        @media print {
          .print-btn { display: none !important; }
        }
        .staff-settings-panel {
          width: 100%;
          margin-top: 32px;
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px 12px;
          font-size: 0.98em;
        }
        .staff-settings-panel h4 {
          margin-top: 0;
          color: #1976d2;
          font-size: 1.08em;
        }
        .staff-settings-panel table {
          width: 100%;
          border-collapse: collapse;
        }
        .staff-settings-panel th, .staff-settings-panel td {
          border: 1px solid #e0e0e0;
          padding: 6px 8px;
          text-align: center;
        }
        .staff-settings-panel th {
          background: #e3f2fd;
        }
        .staff-settings-panel input[type="text"], .staff-settings-panel input[type="number"] {
          width: 90%;
          padding: 2px 4px;
          border: 1px solid #bdbdbd;
          border-radius: 4px;
        }
        `}
      </style>
    </div>
  );
};

export default ShiftCalendar; 