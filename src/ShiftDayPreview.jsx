import React from 'react';

const shiftTimes = {
  '①朝番': { start: 6, end: 11, color: '#FF9800' },
  '②日勤': { start: 9, end: 19, color: '#4CAF50' },
  '③昼番': { start: 11, end: 16, color: '#2196F3' },
  '④夜勤': { start: 16, end: 33, color: '#9C27B0' }, // 翌9時=24+9=33
  '⑤夜番': { start: 19, end: 22, color: '#FF5722' },
  '⑥夜支': { start: 22, end: 30, color: '#607D8B' }  // 翌6時=24+6=30
};

const employmentTypeLabels = {
  life_support: '生活支援員',
  part_time: 'パート',
  dispatch: '派遣',
  kaiteku: 'カイテク',
  facility_director: '施設長',
  deputy_director: '副施設長',
  service_manager: 'サビ管',
  counselor: '相談員',
};

// 共通定数
const HEADER_HEIGHT = 80;
const TIME_SLOT_HEIGHT = 25;
const TIME_AXIS_WIDTH = 70;

export default function ShiftDayPreview({
  date,
  shifts,
  employees,
  onClose
}) {
  // 日付文字列を読みやすい形式に変換
  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  };

  // シフト枠別にデータを整理
  const shiftColumns = {};
  
  // 全てのシフト枠を初期化
  Object.keys(shiftTimes).forEach(shiftLabel => {
    shiftColumns[shiftLabel] = {
      label: shiftLabel,
      ...shiftTimes[shiftLabel],
      employees: []
    };
  });

  // 各シフトに配置された職員を収集
  if (shifts) {
    Object.entries(shifts).forEach(([shiftLabel, empIds]) => {
      if (shiftColumns[shiftLabel]) {
        // empIdsが配列であることを確認
        const employeeIds = Array.isArray(empIds) ? empIds : [];
        employeeIds.forEach(empId => {
          const employee = employees.find(e => e.id === empId);
          if (employee) {
            shiftColumns[shiftLabel].employees.push(employee);
          }
        });
      }
    });
  }

  // 時間軸の生成（6:00〜翌9:00、1時間刻み）
  const timeSlots = [];
  for (let h = 6; h <= 33; h += 1) {
    const displayHour = h >= 24 ? h - 24 : h;
    const isNextDay = h >= 24;
    timeSlots.push({
      hour: h,
      displayHour,
      isNextDay,
      label: `${String(displayHour).padStart(2, '0')}:00${isNextDay ? '+1' : ''}`
    });
  }

  // 時間表示用のフォーマット関数
  const formatTime = (hour) => {
    const displayHour = hour >= 24 ? hour - 24 : hour;
    return `${String(displayHour).padStart(2, '0')}:00`;
  };

  // 指定時間にシフトが稼働中かチェック
  const isShiftActive = (shiftColumn, hour) => {
    return hour >= shiftColumn.start && hour < shiftColumn.end;
  };

  return (
    <div className="shift-preview-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h3>{formatDisplayDate(date)} のシフトスケジュール</h3>
        </div>
        
        <div className="table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="time-header">時間</th>
                {Object.values(shiftColumns).map(shiftColumn => (
                  <th key={shiftColumn.label} className="shift-header">
                    <div className="shift-name">{shiftColumn.label}</div>
                    <div className="shift-time">
                      {formatTime(shiftColumn.start)}-{formatTime(shiftColumn.end)}
                    </div>
                    <div className="employee-count">({shiftColumn.employees.length}名)</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.hour} className={slot.isNextDay ? 'next-day-row' : ''}>
                  <td className="time-cell">{slot.label}</td>
                  {Object.values(shiftColumns).map(shiftColumn => (
                    <td key={shiftColumn.label} className="shift-cell">
                      {isShiftActive(shiftColumn, slot.hour) && (
                        <div 
                          className="shift-active"
                          style={{ backgroundColor: shiftColumn.color }}
                        >
                          {slot.hour === shiftColumn.start && (
                            <div className="employee-list">
                              {shiftColumn.employees.map((employee, index) => (
                                <div key={employee.id} className="employee-item">
                                  <span className="employee-name">{employee.name}</span>
                                  <span className="employee-type">
                                    {employmentTypeLabels[employee.employmentType] || employee.employmentType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 凡例 */}
        <div className="legend">
          <h4>シフト凡例</h4>
          <div className="legend-items">
            {Object.entries(shiftTimes).map(([label, info]) => (
              <div key={label} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: info.color }}
                ></div>
                <span>{label} ({formatTime(info.start)}-{formatTime(info.end)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .shift-preview-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          padding: 1rem;
          width: 80vw;
          height: 80vh;
          min-width: 600px;
          min-height: 400px;
          max-width: 80vw;
          max-height: 80vh;
          overflow: hidden;
          position: relative;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          animation: slideUp 0.3s ease-out;
          display: flex;
          flex-direction: column;
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #f1f5f9;
          border: none;
          border-radius: 12px;
          width: 36px;
          height: 36px;
          font-size: 1.2rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-btn:hover {
          background: #e2e8f0;
          color: #475569;
          transform: scale(1.05);
        }
        
        .modal-header {
          flex-shrink: 0;
          margin-bottom: 0.5rem;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          letter-spacing: -0.025em;
        }
        
        .table-container {
          margin-top: 0;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.55rem;
          background: #ffffff;
          height: 100%;
        }
        
        .time-header {
          width: 40px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: #ffffff;
          padding: 4px 1px;
          text-align: center;
          font-weight: 600;
          font-size: 0.5rem;
          border-right: 1px solid #e2e8f0;
          letter-spacing: 0.025em;
        }
        
        .shift-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 4px 1px;
          text-align: center;
          border-right: 1px solid #e2e8f0;
          min-width: 60px;
          position: relative;
        }
        
        .shift-header:last-child {
          border-right: none;
        }
        
        .shift-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--shift-color, #64748b);
        }
        
        .shift-name {
          font-weight: 700;
          font-size: 0.55rem;
          margin-bottom: 1px;
          color: #1e293b;
          letter-spacing: -0.025em;
        }
        
        .shift-time {
          font-size: 0.45rem;
          color: #64748b;
          margin-bottom: 1px;
          font-weight: 500;
        }
        
        .employee-count {
          font-size: 0.5rem;
          color: #475569;
          font-weight: 600;
          background: #e2e8f0;
          padding: 0px 2px;
          border-radius: 3px;
          display: inline-block;
        }
        
        .time-cell {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1px;
          text-align: center;
          font-size: 0.45rem;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-weight: 600;
          position: relative;
        }
        
        .next-day-row .time-cell {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          border-bottom: 1px solid #fbbf24;
        }
        
        .next-day-row .time-cell::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #f59e0b;
        }
        
        .shift-cell {
          padding: 0;
          border-right: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          height: 14px;
          position: relative;
          background: #ffffff;
          transition: all 0.2s ease;
        }
        
        .shift-cell:hover {
          background: #f8fafc;
        }
        
        .shift-cell:last-child {
          border-right: none;
        }
        
        .shift-active {
          height: 100%;
          width: 100%;
          position: relative;
          background: var(--shift-color);
          border-left: 3px solid var(--shift-color-dark);
          transition: all 0.2s ease;
        }
        
        .shift-active:hover {
          filter: brightness(1.05);
          transform: scale(1.02);
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .employee-list {
          position: absolute;
          top: 0;
          left: 1px;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .employee-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1px;
          background: rgba(0, 0, 0, 0.5);
          padding: 0px 1px;
          border-radius: 2px;
          backdrop-filter: blur(2px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .employee-item:last-child {
          margin-bottom: 0;
        }
        
        .employee-name {
          font-size: 0.55rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.025em;
          color: #ffffff;
        }
        
        .employee-type {
          font-size: 0.45rem;
          opacity: 0.9;
          line-height: 1;
          font-weight: 500;
          color: #ffffff;
        }
        
        .legend {
          margin-top: 0.5rem;
          padding: 0.4rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        
        .legend h4 {
          margin: 0 0 0.3rem 0;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.025em;
          text-align: center;
        }
        
        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          justify-content: center;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.65rem;
          padding: 2px 4px;
          background: #ffffff;
          border-radius: 3px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .legend-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .legend-color {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }
        
        /* シフト別カラー設定 */
        .shift-header:nth-child(2) { --shift-color: #FF9800; }
        .shift-header:nth-child(3) { --shift-color: #4CAF50; }
        .shift-header:nth-child(4) { --shift-color: #2196F3; }
        .shift-header:nth-child(5) { --shift-color: #9C27B0; }
        .shift-header:nth-child(6) { --shift-color: #FF5722; }
        .shift-header:nth-child(7) { --shift-color: #607D8B; }
        
        /* シフトアクティブ時のカラー */
        .shift-cell:nth-child(2) .shift-active { 
          --shift-color: rgba(255, 152, 0, 0.9);
          --shift-color-dark: #E65100;
        }
        .shift-cell:nth-child(3) .shift-active { 
          --shift-color: rgba(76, 175, 80, 0.9);
          --shift-color-dark: #2E7D32;
        }
        .shift-cell:nth-child(4) .shift-active { 
          --shift-color: rgba(33, 150, 243, 0.9);
          --shift-color-dark: #1565C0;
        }
        .shift-cell:nth-child(5) .shift-active { 
          --shift-color: rgba(156, 39, 176, 0.9);
          --shift-color-dark: #6A1B9A;
        }
        .shift-cell:nth-child(6) .shift-active { 
          --shift-color: rgba(255, 87, 34, 0.9);
          --shift-color-dark: #D84315;
        }
        .shift-cell:nth-child(7) .shift-active { 
          --shift-color: rgba(96, 125, 139, 0.9);
          --shift-color-dark: #37474F;
        }
        
        /* スクロールバーのスタイリング */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 768px) {
          .modal-content {
            min-width: 95vw;
            padding: 1.5rem;
          }
          
          .modal-content h3 {
            font-size: 1.5rem;
          }
          
          .legend-items {
            flex-wrap: wrap;
          }
          
          .shift-header {
            min-width: 120px;
            padding: 12px 8px;
          }
        }
      `}</style>
    </div>
  );
} 