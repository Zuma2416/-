import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ShiftDisplay } from "./ShiftDisplay";
import { useShift } from "./ShiftManager";
import ShiftDayPreview from './ShiftDayPreview';

const shiftLabels = [
  "①朝番",
  "②日勤",
  "③昼番",
  "④夜勤",
  "⑤夜番",
  "⑥夜支"
];

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

function ShiftCalendar() {
  const [value, setValue] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const { shifts, employees, addEmployeeToShift, setCurrentMonth, clearShifts, generateAutoShifts } = useShift();
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousEmployee, setContinuousEmployee] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAutoShiftConfirm, setShowAutoShiftConfirm] = useState(false);
  const [showDayPreview, setShowDayPreview] = useState(false);
  const [previewDate, setPreviewDate] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  // 月が変更されたときに呼び出される関数
  const handleMonthChange = (newDate) => {
    const date = new Date(newDate);
    setValue(date);
    setActiveStartDate(date);
    setCurrentMonth(date.getMonth());
  };

  // カレンダーの表示月が変更されたときの処理
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setActiveStartDate(activeStartDate);
    setValue(activeStartDate);
    setCurrentMonth(activeStartDate.getMonth());
  };

  // 初期化時に現在の月を設定
  useEffect(() => {
    const now = new Date();
    setValue(now);
    setActiveStartDate(now);
    setCurrentMonth(now.getMonth());
  }, []);

  const handleSave = () => {
    const data = {
      shifts,
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
      createdAt: new Date().toISOString()
    };

    const savedTemplates = JSON.parse(localStorage.getItem('shiftTemplates') || '[]');
    savedTemplates.push(data);
    localStorage.setItem('shiftTemplates', JSON.stringify(savedTemplates));
    alert('テンプレートとして保存しました');
  };

  const handleBulkInput = () => {
    if (!selectedEmployee || !selectedShift || selectedDays.length === 0) {
      alert('職員、シフト、曜日を選択してください');
      return;
    }

    const currentDate = new Date(activeStartDate);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = weekDays[date.getDay()];
      
      if (selectedDays.includes(dayOfWeek)) {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        addEmployeeToShift(dateKey, selectedShift, parseInt(selectedEmployee));
      }
    }

    setShowBulkInput(false);
    setSelectedEmployee('');
    setSelectedShift('');
    setSelectedDays([]);
  };

  const toggleDaySelection = (day) => {
    setSelectedDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // 日付クリック時のプレビュー表示
  const handleDayClick = (date) => {
    setPreviewDate(date);
    setShowDayPreview(true);
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <ShiftDisplay 
      date={date} 
      isSelected={value && 
        value.getDate() === date.getDate() && 
        value.getMonth() === date.getMonth() && 
        value.getFullYear() === date.getFullYear()}
          onShiftClick={handleContinuousInput}
          continuousMode={continuousMode}
        />
      </div>
    );
  };

  // 日付のダブルクリック処理
  const handleDateDoubleClick = (date) => {
    setClickCount(prev => prev + 1);
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    const timer = setTimeout(() => {
      if (clickCount + 1 >= 2) {
        // ダブルクリック
        handleDayClick(date);
      }
      setClickCount(0);
      setClickTimer(null);
    }, 300);
    
    setClickTimer(timer);
  };

  // パターンの保存
  const savePattern = () => {
    if (!selectedEmployee || !selectedShift || selectedDays.length === 0) {
      alert('職員、シフト、曜日を選択してください');
      return;
    }

    const pattern = {
      employeeId: parseInt(selectedEmployee),
      shift: selectedShift,
      days: selectedDays,
      name: patternName || `${employees.find(emp => emp.id === parseInt(selectedEmployee))?.name}のパターン`
    };

    const savedPatterns = JSON.parse(localStorage.getItem('shiftPatterns') || '[]');
    savedPatterns.push(pattern);
    localStorage.setItem('shiftPatterns', JSON.stringify(savedPatterns));

    setShowPatternModal(false);
    setPatternName('');
    alert('パターンを保存しました');
  };

  // パターンの読み込み
  const loadPattern = (pattern) => {
    setSelectedEmployee(pattern.employeeId.toString());
    setSelectedShift(pattern.shift);
    setSelectedDays(pattern.days);
    setShowPatternModal(false);
  };

  // パターンの削除
  const deletePattern = (patternToDelete) => {
    const savedPatterns = JSON.parse(localStorage.getItem('shiftPatterns') || '[]');
    const updatedPatterns = savedPatterns.filter(p => 
      !(p.employeeId === patternToDelete.employeeId && 
        p.shift === patternToDelete.shift && 
        JSON.stringify(p.days) === JSON.stringify(patternToDelete.days))
    );
    localStorage.setItem('shiftPatterns', JSON.stringify(updatedPatterns));
  };

  const handleContinuousInput = (date, shift) => {
    if (!continuousMode || !continuousEmployee) return;
    
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    addEmployeeToShift(dateKey, shift, parseInt(continuousEmployee));
  };

  const toggleContinuousMode = () => {
    if (continuousMode) {
      setContinuousMode(false);
      setContinuousEmployee('');
    } else {
      setContinuousMode(true);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    const currentDate = new Date(activeStartDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 現在の月のシフトをクリア
    clearShifts(year, month);
    setShowResetConfirm(false);
  };

  const handleAutoShift = () => {
    setShowAutoShiftConfirm(true);
  };

  const confirmAutoShift = () => {
    const currentDate = new Date(activeStartDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const result = generateAutoShifts(year, month);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.error);
    }
    setShowAutoShiftConfirm(false);
  };

  return (
      <div className="calendar-page">
        <div className="calendar-actions-panel">
        <div className={`panel-content ${continuousMode ? 'continuous-mode' : ''}`}>
          <button 
            onClick={handleSave} 
            className={`save-btn ${continuousMode ? 'disabled' : ''}`}
            disabled={continuousMode}
          >
            保存
          </button>
          <button 
            onClick={handleSaveAsTemplate} 
            className={`save-template-btn ${continuousMode ? 'disabled' : ''}`}
            disabled={continuousMode}
          >
            テンプレート
          </button>
          <button 
            onClick={() => setShowBulkInput(true)} 
            className={`bulk-input-btn ${continuousMode ? 'disabled' : ''}`}
            disabled={continuousMode}
          >
            一括入力
          </button>
          <button 
            onClick={handleAutoShift}
            className={`auto-shift-btn ${continuousMode ? 'disabled' : ''}`}
            disabled={continuousMode}
          >
            自動シフト
          </button>
          <button 
            onClick={toggleContinuousMode} 
            className={`continuous-btn ${continuousMode ? 'active' : ''}`}
          >
            {continuousMode ? '連続入力中' : '連続入力'}
          </button>
          <button 
            onClick={handleReset}
            className={`reset-btn ${continuousMode ? 'disabled' : ''}`}
            disabled={continuousMode}
          >
            リセット
          </button>
          {continuousMode && (
            <select
              value={continuousEmployee}
              onChange={(e) => setContinuousEmployee(e.target.value)}
              className="continuous-select"
            >
              <option value="">職員を選択</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {showResetConfirm && (
        <div className="reset-confirm-modal">
          <div className="modal-content">
            <h3>シフトのリセット</h3>
            <p>現在の月のシフトをすべて削除します。この操作は取り消せません。</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowResetConfirm(false)}
              >
                キャンセル
              </button>
              <button 
                className="reset-confirm-btn"
                onClick={confirmReset}
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutoShiftConfirm && (
        <div className="auto-shift-confirm-modal">
          <div className="modal-content">
            <h3>自動シフト生成</h3>
            <p>現在の月のシフトを自動生成します。既存のシフトはすべて削除されます。</p>
            <p>※社員（日勤者）のシフトのみ自動生成されます。</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowAutoShiftConfirm(false)}
              >
                キャンセル
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmAutoShift}
              >
                生成
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkInput && (
        <div className="bulk-input-modal">
          <div className="modal-content">
            <h3>一括入力</h3>
            <div className="bulk-input-form">
              <div className="form-group">
                <label>職員</label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>シフト</label>
                <select 
                  value={selectedShift} 
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {shiftLabels.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>曜日</label>
                <div className="weekday-selector">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      className={`weekday-btn ${selectedDays.includes(day) ? 'selected' : ''}`}
                      onClick={() => toggleDaySelection(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pattern-actions">
                <button 
                  className="pattern-btn"
                  onClick={() => setShowPatternModal(true)}
                >
                  パターンを保存
                </button>
                <button 
                  className="pattern-btn"
                  onClick={() => {
                    const savedPatterns = JSON.parse(localStorage.getItem('shiftPatterns') || '[]');
                    const employeePatterns = savedPatterns.filter(p => p.employeeId === parseInt(selectedEmployee));
                    if (employeePatterns.length > 0) {
                      loadPattern(employeePatterns[0]);
                    } else {
                      alert('保存されたパターンがありません');
                    }
                  }}
                >
                  パターンを読み込み
                </button>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowBulkInput(false);
                    setSelectedEmployee('');
                    setSelectedShift('');
                    setSelectedDays([]);
                  }}
                >
                  キャンセル
                </button>
                <button 
                  className="apply-btn"
                  onClick={handleBulkInput}
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPatternModal && (
        <div className="pattern-modal">
          <div className="modal-content">
            <h3>パターンの保存</h3>
            <div className="pattern-form">
              <div className="form-group">
                <label>パターン名</label>
                <input
                  type="text"
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  placeholder="パターン名を入力"
                  className="pattern-input"
                />
              </div>

              <div className="saved-patterns">
                <h4>保存済みパターン</h4>
                {JSON.parse(localStorage.getItem('shiftPatterns') || '[]')
                  .filter(p => p.employeeId === parseInt(selectedEmployee))
                  .map((pattern, index) => (
                    <div key={index} className="pattern-item">
                      <div className="pattern-info">
                        <span className="pattern-name">{pattern.name}</span>
                        <span className="pattern-details">
                          {pattern.shift} - {pattern.days.join(',')}
                        </span>
                      </div>
                      <div className="pattern-buttons">
                        <button
                          className="load-btn"
                          onClick={() => loadPattern(pattern)}
                        >
                          読み込み
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deletePattern(pattern)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowPatternModal(false);
                    setPatternName('');
                  }}
                >
                  キャンセル
            </button>
                <button 
                  className="save-btn"
                  onClick={savePattern}
                >
                  保存
            </button>
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="calendar-panel">
          <div className="panel-content">
          <div className="calendar-header">
            <div className="month-display">
              <button 
                className="month-nav-btn" 
                onClick={() => handleMonthChange(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth() - 1, 1))}
              >
                ◀
              </button>
              <div className="month-year">
                <span className="month">{activeStartDate.toLocaleDateString("ja-JP", { month: "long" })}</span>
                <span className="year">{activeStartDate.getFullYear()}</span>
              </div>
              <button 
                className="month-nav-btn" 
                onClick={() => handleMonthChange(new Date(activeStartDate.getFullYear(), activeStartDate.getMonth() + 1, 1))}
              >
                ▶
              </button>
            </div>
          </div>
            <Calendar
            onChange={handleMonthChange}
              value={value}
            activeStartDate={activeStartDate}
            onActiveStartDateChange={handleActiveStartDateChange}
              locale="ja-JP"
              formatDay={(locale, date) => date.toLocaleDateString("ja-JP", { day: "numeric" })}
              tileContent={tileContent}
              className="shift-calendar"
            showNavigation={false}
            onClickDay={handleDateDoubleClick}
            />
          </div>
        </div>

        {showDayPreview && previewDate && (
          <ShiftDayPreview
            date={`${previewDate.getFullYear()}-${String(previewDate.getMonth() + 1).padStart(2, '0')}-${String(previewDate.getDate()).padStart(2, '0')}`}
            shifts={shifts[`${previewDate.getFullYear()}-${String(previewDate.getMonth() + 1).padStart(2, '0')}-${String(previewDate.getDate()).padStart(2, '0')}`]}
            employees={employees}
            onClose={() => setShowDayPreview(false)}
          />
        )}

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
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            align-items: center;
            }

            .save-btn,
          .save-template-btn,
          .bulk-input-btn,
          .auto-shift-btn,
          .continuous-btn,
          .reset-btn {
            padding: 0.5rem 1rem;
              border: none;
            border-radius: 4px;
              cursor: pointer;
            font-size: 0.9rem;
              font-weight: 500;
              transition: all 0.2s ease;
            white-space: nowrap;
            }

            .save-btn {
              background: #1976d2;
              color: white;
            min-width: 60px;
            }

          .save-template-btn {
            background: #4caf50;
            color: white;
            min-width: 80px;
          }

          .bulk-input-btn {
            background: #ff9800;
            color: white;
            min-width: 80px;
          }

          .auto-shift-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            background: #2196f3;
            color: white;
            min-width: 80px;
          }

          .auto-shift-btn:hover {
            background: #1976d2;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

          .auto-shift-btn:active {
              transform: translateY(1px);
              box-shadow: none;
            }

          .save-btn:hover,
          .save-template-btn:hover,
          .bulk-input-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

          .save-btn:active,
          .save-template-btn:active,
          .bulk-input-btn:active {
              transform: translateY(1px);
              box-shadow: none;
            }

          .continuous-btn {
            background: #9c27b0;
            color: white;
            min-width: 90px;
            position: relative;
            z-index: 2;
          }

          .continuous-select {
            padding: 0.5rem;
            border: 1px solid #9c27b0;
            border-radius: 4px;
            font-size: 0.9rem;
            background: white;
            color: #333;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            z-index: 2;
            min-width: 120px;
            }

            .shift-calendar {
              width: 100%;
              border: none;
              font-size: 1rem;
            }

            .react-calendar__tile {
            padding: 0.25rem;
              min-height: 140px;
              position: relative;
              transition: all 0.2s ease;
            }

          .react-calendar__month-view__days__day {
            padding: 0;
            margin: 0;
            border: none;
          }

          .react-calendar__month-view__days__day--neighboringMonth {
            color: #ccc;
          }

          .react-calendar__month-view__weekdays {
            margin-bottom: 0;
          }

          .react-calendar__month-view__weekdays__weekday {
            padding: 0.25rem;
            text-align: center;
            font-weight: 500;
            color: #666;
          }

          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none;
            border-bottom: none;
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

          .calendar-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 0 1rem;
          }

          .month-display {
              display: flex;
            align-items: center;
            gap: 16px;
            background: #f5f7fa;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

          .month-year {
              display: flex;
            align-items: baseline;
            gap: 8px;
            min-width: 200px;
            text-align: center;
            }

          .month-display .month {
            color: #1976d2;
            font-size: 1.8rem;
            font-weight: 600;
          }

          .month-display .year {
            color: #666;
            font-size: 1.4rem;
            font-weight: 500;
          }

          .month-nav-btn {
            width: 36px;
            height: 36px;
              display: flex;
              align-items: center;
            justify-content: center;
            border: none;
            border-radius: 6px;
            background: white;
            color: #1976d2;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .month-nav-btn:hover {
            background: #e3f2fd;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }

          .month-nav-btn:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .shift-calendar {
            width: 100%;
            border: none;
            font-size: 1rem;
          }

          .react-calendar__navigation {
            display: none;
          }

          .weekday-selector {
            display: flex;
            gap: 0.5rem;
          }

          .weekday-btn {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
              transition: all 0.2s ease;
            }

          .weekday-btn.selected {
            background: #1976d2;
            color: white;
            border-color: #1976d2;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1rem;
          }

          .cancel-btn,
          .apply-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
              cursor: pointer;
            font-size: 1rem;
              transition: all 0.2s ease;
          }

          .cancel-btn {
            background: #f5f5f5;
            color: #666;
          }

          .cancel-btn:hover {
            background: #e0e0e0;
          }

          .apply-btn {
            background: #1976d2;
            color: white;
          }

          .apply-btn:hover {
            background: #1565c0;
          }

          .pattern-actions {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            }

          .pattern-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #1976d2;
            border-radius: 4px;
            background: white;
            color: #1976d2;
            cursor: pointer;
            transition: all 0.2s ease;
            }

          .pattern-btn:hover {
              background: #e3f2fd;
            }

          .pattern-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            }

          .pattern-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .pattern-input {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            width: 100%;
          }

          .saved-patterns {
            max-height: 300px;
            overflow-y: auto;
          }

          .pattern-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border-bottom: 1px solid #eee;
          }

          .pattern-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .pattern-name {
            font-weight: 500;
            color: #333;
            }

          .pattern-details {
            font-size: 0.875rem;
            color: #666;
          }

          .pattern-buttons {
            display: flex;
            gap: 0.5rem;
          }

          .load-btn,
          .delete-btn {
            padding: 0.25rem 0.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
              transition: all 0.2s ease;
          }

          .load-btn {
            background: #1976d2;
            color: white;
          }

          .load-btn:hover {
            background: #1565c0;
          }

          .delete-btn {
            background: #f44336;
            color: white;
          }

          .delete-btn:hover {
            background: #d32f2f;
          }

          .panel-content.continuous-mode {
            position: relative;
            }

          .panel-content.continuous-mode::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.7);
            z-index: 1;
            pointer-events: none;
          }

          .continuous-btn.active {
            background: #6a1b9a;
            box-shadow: 0 0 0 2px #fff, 0 0 0 4px #9c27b0;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(156, 39, 176, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(156, 39, 176, 0);
            }
          }

          .reset-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            background: #f44336;
            color: white;
            min-width: 70px;
          }

          .reset-btn:hover {
            background: #d32f2f;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .reset-btn:active {
            transform: translateY(1px);
            box-shadow: none;
          }

          .reset-confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            z-index: 1100;
          }

          .reset-confirm-modal .modal-content {
              background: white;
            padding: 1.5rem;
            border-radius: 8px;
            min-width: 300px;
            max-width: 90%;
          }

          .reset-confirm-modal h3 {
            margin: 0 0 1rem 0;
            color: #f44336;
            font-size: 1.2rem;
          }

          .reset-confirm-modal p {
            margin: 0 0 1.5rem 0;
            color: #666;
            line-height: 1.5;
          }

          .reset-confirm-modal .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
          }

          .reset-confirm-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            background: #f44336;
            color: white;
              cursor: pointer;
            font-size: 0.9rem;
              transition: all 0.2s ease;
            }

          .reset-confirm-btn:hover {
            background: #d32f2f;
          }

          .reset-btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
          }

          .reset-btn.disabled:hover {
            transform: none;
            box-shadow: none;
          }

          .auto-shift-confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
          }

          .auto-shift-confirm-modal .modal-content {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            min-width: 300px;
            max-width: 90%;
          }

          .auto-shift-confirm-modal h3 {
            margin: 0 0 1rem 0;
            color: #2196f3;
            font-size: 1.2rem;
          }

          .auto-shift-confirm-modal p {
            margin: 0 0 1rem 0;
            color: #666;
            line-height: 1.5;
            }

          .auto-shift-confirm-modal .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .auto-shift-confirm-modal .confirm-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            background: #2196f3;
            color: white;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          }

          .auto-shift-confirm-modal .confirm-btn:hover {
            background: #1976d2;
            }

          .react-calendar__tile {
            position: relative;
            }
          `}
        </style>
      </div>
  );
}

export default ShiftCalendar; 