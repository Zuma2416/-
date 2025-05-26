import React, { useState, useEffect } from 'react';

const initialEmployees = [
  { id: 1, name: "山田 太郎", employmentType: "life_support" },
  { id: 2, name: "佐藤 花子", employmentType: "life_support" },
  { id: 3, name: "鈴木 次郎", employmentType: "life_support" },
  { id: 4, name: "田中 美咲", employmentType: "life_support" },
  { id: 5, name: "高橋 健一", employmentType: "part_time" },
  { id: 6, name: "渡辺 由美", employmentType: "dispatch" },
];

const shiftTypes = [
  { id: "morning", label: "①朝番", time: "6:00-11:00" },
  { id: "day", label: "②日勤", time: "9:00-19:00" },
  { id: "afternoon", label: "③昼番", time: "11:00-16:00" },
  { id: "night", label: "④夜勤", time: "16:00-翌9:00" },
  { id: "evening", label: "⑤夜番", time: "19:00-22:00" },
  { id: "night_support", label: "⑥夜支", time: "22:00-翌6:00" }
];

const employmentTypes = [
  { id: "facility_director", label: "施設長", canWorkNight: true, maxHoursPerDay: 8, maxDaysPerMonth: 22 },
  { id: "deputy_director", label: "副施設長", canWorkNight: true, maxHoursPerDay: 8, maxDaysPerMonth: 22 },
  { id: "service_manager", label: "サビ管", canWorkNight: false, maxHoursPerDay: 8, maxDaysPerMonth: 22 },
  { id: "counselor", label: "相談員", canWorkNight: false, maxHoursPerDay: 8, maxDaysPerMonth: 22 },
  { id: "life_support", label: "生活支援員", canWorkNight: true, maxHoursPerDay: 8, maxDaysPerMonth: 22 },
  { id: "part_time", label: "パートアルバイト", canWorkNight: false, maxHoursPerDay: 6, maxDaysPerMonth: 15 },
  { id: "dispatch", label: "派遣", canWorkNight: true, maxHoursPerDay: 8, maxDaysPerMonth: 20 },
  { id: "kaiteku", label: "カイテク", canWorkNight: true, maxHoursPerDay: 8, maxDaysPerMonth: 15 }
];

const priorityLabels = {
  1: "最優先",
  2: "優先",
  3: "普通",
  4: "低優先",
  5: "最低優先",
  6: "不可"
};

const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

const initialEmployeeSettings = {
  1: { // 山田 太郎
    shiftPriorities: {
      morning: 2, day: 1, afternoon: 3, night: 4, evening: 5, night_support: 6
    },
    preferredDaysOff: { '土': true, '日': false },
    maxConsecutiveDays: 5,
    minDaysOff: 8,
    targetWorkDays: 20,
    maxHoursPerWeek: 40,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: true,
      preferredStartTime: 9,
      preferredEndTime: 18
    },
    notes: "リーダー職のため日勤優先"
  },
  2: { // 佐藤 花子
    shiftPriorities: {
      morning: 1, day: 2, afternoon: 2, night: 3, evening: 4, night_support: 5
    },
    preferredDaysOff: { '日': true, '水': true },
    maxConsecutiveDays: 4,
    minDaysOff: 9,
    targetWorkDays: 18,
    maxHoursPerWeek: 35,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: true,
      preferredStartTime: 6,
      preferredEndTime: 19
    },
    notes: "朝番得意、夜勤も可能"
  },
  3: { // 鈴木 次郎
    shiftPriorities: {
      morning: 3, day: 1, afternoon: 1, night: 2, evening: 3, night_support: 4
    },
    preferredDaysOff: { '月': true, '金': true },
    maxConsecutiveDays: 6,
    minDaysOff: 6,
    targetWorkDays: 22,
    maxHoursPerWeek: 40,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: true,
      preferredStartTime: 11,
      preferredEndTime: 22
    },
    notes: "昼番・夜勤メイン"
  },
  4: { // 田中 美咲
    shiftPriorities: {
      morning: 2, day: 2, afternoon: 3, night: 1, evening: 2, night_support: 3
    },
    preferredDaysOff: { '火': true, '木': true },
    maxConsecutiveDays: 3,
    minDaysOff: 10,
    targetWorkDays: 16,
    maxHoursPerWeek: 32,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: true,
      preferredStartTime: 16,
      preferredEndTime: 9
    },
    notes: "夜勤専門、短時間勤務希望"
  },
  5: { // 高橋 健一（パート）
    shiftPriorities: {
      morning: 2, day: 6, afternoon: 1, night: 6, evening: 2, night_support: 6
    },
    preferredDaysOff: { '土': true, '日': true },
    maxConsecutiveDays: 3,
    minDaysOff: 15,
    targetWorkDays: 12,
    maxHoursPerWeek: 24,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: false,
      preferredStartTime: 11,
      preferredEndTime: 19
    },
    notes: "パート、平日のみ、夜勤不可"
  },
  6: { // 渡辺 由美（派遣）
    shiftPriorities: {
      morning: 1, day: 6, afternoon: 2, night: 6, evening: 1, night_support: 6
    },
    preferredDaysOff: { '水': true },
    maxConsecutiveDays: 5,
    minDaysOff: 8,
    targetWorkDays: 18,
    maxHoursPerWeek: 35,
    unavailableDates: [],
    workTimeRestrictions: {
      canWorkMorning: true,
      canWorkEvening: true,
      canWorkNight: false,
      preferredStartTime: 6,
      preferredEndTime: 22
    },
    notes: "派遣、朝番・夜番メイン"
  }
};

export function EmployeeSettings() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSettings, setEmployeeSettings] = useState({});
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employmentType: "life_support"
  });
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || JSON.stringify(initialEmployees));
    const savedSettings = JSON.parse(localStorage.getItem('employeeSettings') || JSON.stringify(initialEmployeeSettings));
    
    if (!localStorage.getItem('employees')) {
      localStorage.setItem('employees', JSON.stringify(initialEmployees));
    }
    if (!localStorage.getItem('employeeSettings')) {
      localStorage.setItem('employeeSettings', JSON.stringify(initialEmployeeSettings));
    }
    
    setEmployees(savedEmployees);
    setEmployeeSettings(savedSettings);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('employeeSettings', JSON.stringify(employeeSettings));
    alert('設定を保存しました');
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name.trim()) {
      alert('職員名を入力してください');
      return;
    }

    const newId = Math.max(0, ...employees.map(emp => emp.id)) + 1;
    const employee = {
      id: newId,
      name: newEmployee.name,
      employmentType: newEmployee.employmentType
    };

    const defaultSettings = {
      shiftPriorities: {
        morning: 3, day: 3, afternoon: 3, night: 3, evening: 3, night_support: 3
      },
      preferredDaysOff: {},
      maxConsecutiveDays: 5,
      minDaysOff: 8,
      targetWorkDays: 20,
      maxHoursPerWeek: 40,
      unavailableDates: [],
      workTimeRestrictions: {
        canWorkMorning: true,
        canWorkEvening: true,
        canWorkNight: true,
        preferredStartTime: 9,
        preferredEndTime: 18
      },
      notes: ""
    };

    setEmployees([...employees, employee]);
    setEmployeeSettings(prev => ({
      ...prev,
      [newId]: defaultSettings
    }));
    setNewEmployee({ name: "", employmentType: "life_support" });
  };

  const handleDeleteEmployee = (id) => {
    if (!confirm('この職員を削除してもよろしいですか？')) return;
    
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    const newSettings = { ...employeeSettings };
    delete newSettings[id];
    setEmployeeSettings(newSettings);
    if (selectedEmployee?.id === id) {
      setSelectedEmployee(null);
    }
  };

  const updateEmployeeSetting = (employeeId, path, value) => {
    setEmployeeSettings(prev => {
      const newSettings = { ...prev };
      if (!newSettings[employeeId]) {
        newSettings[employeeId] = {};
      }
      
      const keys = path.split('.');
      let current = newSettings[employeeId];
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleEmploymentTypeChange = (employeeId, newType) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, employmentType: newType } : emp
    ));
    
    const typeInfo = employmentTypes.find(t => t.id === newType);
    if (typeInfo) {
      updateEmployeeSetting(employeeId, 'maxHoursPerWeek', typeInfo.maxHoursPerDay * 5);
      updateEmployeeSetting(employeeId, 'targetWorkDays', typeInfo.maxDaysPerMonth);
      updateEmployeeSetting(employeeId, 'workTimeRestrictions.canWorkNight', typeInfo.canWorkNight);
    }
  };

  const togglePreferredDayOff = (employeeId, day) => {
    const currentSettings = employeeSettings[employeeId]?.preferredDaysOff || {};
    updateEmployeeSetting(employeeId, 'preferredDaysOff', {
      ...currentSettings,
      [day]: !currentSettings[day]
    });
  };

  const addUnavailableDate = (employeeId, date) => {
    const currentDates = employeeSettings[employeeId]?.unavailableDates || [];
    if (!currentDates.includes(date)) {
      updateEmployeeSetting(employeeId, 'unavailableDates', [...currentDates, date]);
    }
  };

  const removeUnavailableDate = (employeeId, date) => {
    const currentDates = employeeSettings[employeeId]?.unavailableDates || [];
    updateEmployeeSetting(employeeId, 'unavailableDates', currentDates.filter(d => d !== date));
  };

  const validateAndTest = () => {
    const issues = [];
    
    employees.forEach(emp => {
      const settings = employeeSettings[emp.id];
      if (!settings) {
        issues.push(`${emp.name}: 設定が未完了`);
        return;
      }
      
      if (emp.employmentType === 'life_support' && settings.shiftPriorities?.day === 6) {
        issues.push(`${emp.name}: 生活支援員ですが日勤が「不可」に設定されています`);
      }
      
      if (emp.employmentType === 'part_time' && settings.workTimeRestrictions?.canWorkNight) {
        issues.push(`${emp.name}: パートですが夜勤が可能に設定されています`);
      }
      
      const preferredDaysOffCount = Object.values(settings.preferredDaysOff || {}).filter(Boolean).length;
      const maxPossibleWorkDays = 30 - preferredDaysOffCount * 4;
      if (settings.targetWorkDays > maxPossibleWorkDays) {
        issues.push(`${emp.name}: 希望休が多すぎて目標勤務日数を達成できません`);
      }
    });
    
    if (issues.length > 0) {
      alert(`設定に問題があります:\n\n${issues.join('\n')}`);
    } else {
      alert('設定に問題ありません。自動シフト生成が可能です。');
    }
  };

  const getCurrentSettings = (employeeId) => {
    return employeeSettings[employeeId] || {};
  };

  const getEmploymentTypeInfo = (typeId) => {
    return employmentTypes.find(t => t.id === typeId) || {};
  };

  return (
    <div className="employee-settings">
      <div className="settings-header">
        <h2>職員設定管理</h2>
        <div className="header-actions">
          <button onClick={validateAndTest} className="validate-btn">
            設定検証
          </button>
          <button onClick={saveSettings} className="save-btn">
            設定を保存
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="employee-list-panel">
          <div className="add-employee-section">
            <h3>新しい職員を追加</h3>
            <div className="add-employee-form">
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="職員名"
                className="employee-input"
              />
              <select
                value={newEmployee.employmentType}
                onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
                className="employment-select"
              >
                {employmentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <button onClick={handleAddEmployee} className="add-btn">
                追加
              </button>
            </div>
          </div>

          <div className="employee-list">
            <h3>職員一覧</h3>
            {employees.map(employee => {
              const typeInfo = getEmploymentTypeInfo(employee.employmentType);
              const settings = getCurrentSettings(employee.id);
              const isComplete = settings.shiftPriorities && Object.keys(settings.shiftPriorities).length > 0;
              
              return (
                <div 
                  key={employee.id} 
                  className={`employee-item ${selectedEmployee?.id === employee.id ? 'selected' : ''} ${!isComplete ? 'incomplete' : ''}`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="employee-info">
                    <span className="employee-name">{employee.name}</span>
                    <span className="employee-type">{typeInfo.label}</span>
                    {!isComplete && <span className="incomplete-badge">未設定</span>}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(employee.id);
                    }}
                    className="delete-btn"
                  >
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="employee-details-panel">
          {selectedEmployee ? (
            <div className="employee-details">
              <div className="details-header">
                <h3>{selectedEmployee.name} の設定</h3>
                <div className="employment-type-selector">
                  <label>雇用形態:</label>
                  <select
                    value={selectedEmployee.employmentType}
                    onChange={(e) => handleEmploymentTypeChange(selectedEmployee.id, e.target.value)}
                    className="employment-select"
                  >
                    {employmentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="tab-navigation">
                <button 
                  className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  基本設定
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  シフト優先度
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'restrictions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('restrictions')}
                >
                  勤務制限
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  備考・特記事項
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'basic' && (
                  <div className="basic-settings">
                    <div className="setting-group">
                      <h4>勤務日数・時間の目標</h4>
                      <div className="setting-row">
                        <label>月間目標勤務日数:</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={getCurrentSettings(selectedEmployee.id).targetWorkDays || 20}
                          onChange={(e) => updateEmployeeSetting(selectedEmployee.id, 'targetWorkDays', parseInt(e.target.value))}
                        />
                        <span>日</span>
                      </div>
                      <div className="setting-row">
                        <label>週間最大勤務時間:</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={getCurrentSettings(selectedEmployee.id).maxHoursPerWeek || 40}
                          onChange={(e) => updateEmployeeSetting(selectedEmployee.id, 'maxHoursPerWeek', parseInt(e.target.value))}
                        />
                        <span>時間</span>
                      </div>
                      <div className="setting-row">
                        <label>最低休日数:</label>
                        <input
                          type="number"
                          min="4"
                          max="15"
                          value={getCurrentSettings(selectedEmployee.id).minDaysOff || 8}
                          onChange={(e) => updateEmployeeSetting(selectedEmployee.id, 'minDaysOff', parseInt(e.target.value))}
                        />
                        <span>日/月</span>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h4>連続勤務制限</h4>
                      <div className="setting-row">
                        <label>最大連続勤務日数:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={getCurrentSettings(selectedEmployee.id).maxConsecutiveDays || 5}
                          onChange={(e) => updateEmployeeSetting(selectedEmployee.id, 'maxConsecutiveDays', parseInt(e.target.value))}
                        />
                        <span>日</span>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h4>希望休（曜日）</h4>
                      <div className="weekday-preferences">
                        {weekDays.map(day => (
                          <label key={day} className="weekday-option">
                            <input
                              type="checkbox"
                              checked={getCurrentSettings(selectedEmployee.id).preferredDaysOff?.[day] || false}
                              onChange={() => togglePreferredDayOff(selectedEmployee.id, day)}
                            />
                            <span>{day}曜日</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="schedule-settings">
                    <div className="setting-group">
                      <h4>シフト別優先度</h4>
                      <div className="shift-priorities">
                        {shiftTypes.map(shift => (
                          <div key={shift.id} className="shift-priority-row">
                            <div className="shift-info">
                              <span className="shift-label">{shift.label}</span>
                              <span className="shift-time">{shift.time}</span>
                            </div>
                            <select
                              value={getCurrentSettings(selectedEmployee.id).shiftPriorities?.[shift.id] || 6}
                              onChange={(e) => updateEmployeeSetting(
                                selectedEmployee.id, 
                                `shiftPriorities.${shift.id}`, 
                                parseInt(e.target.value)
                              )}
                              className="priority-select"
                            >
                              {Object.entries(priorityLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'restrictions' && (
                  <div className="restriction-settings">
                    <div className="setting-group">
                      <h4>勤務時間制限</h4>
                      <div className="time-restrictions">
                        <label className="restriction-option">
                          <input
                            type="checkbox"
                            checked={getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.canWorkMorning !== false}
                            onChange={(e) => updateEmployeeSetting(
                              selectedEmployee.id, 
                              'workTimeRestrictions.canWorkMorning', 
                              e.target.checked
                            )}
                          />
                          <span>早朝勤務可能（6:00-11:00）</span>
                        </label>
                        <label className="restriction-option">
                          <input
                            type="checkbox"
                            checked={getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.canWorkEvening !== false}
                            onChange={(e) => updateEmployeeSetting(
                              selectedEmployee.id, 
                              'workTimeRestrictions.canWorkEvening', 
                              e.target.checked
                            )}
                          />
                          <span>夜間勤務可能（19:00-22:00）</span>
                        </label>
                        <label className="restriction-option">
                          <input
                            type="checkbox"
                            checked={getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.canWorkNight !== false}
                            onChange={(e) => updateEmployeeSetting(
                              selectedEmployee.id, 
                              'workTimeRestrictions.canWorkNight', 
                              e.target.checked
                            )}
                          />
                          <span>夜勤可能（16:00-翌9:00, 22:00-翌6:00）</span>
                        </label>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h4>希望勤務時間</h4>
                      <div className="preferred-time">
                        <div className="time-input-group">
                          <label>希望開始時刻:</label>
                          <select
                            value={getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.preferredStartTime || 9}
                            onChange={(e) => updateEmployeeSetting(
                              selectedEmployee.id, 
                              'workTimeRestrictions.preferredStartTime', 
                              parseInt(e.target.value)
                            )}
                          >
                            {Array.from({length: 24}, (_, i) => (
                              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        </div>
                        <div className="time-input-group">
                          <label>希望終了時刻:</label>
                          <select
                            value={getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.preferredEndTime || 18}
                            onChange={(e) => updateEmployeeSetting(
                              selectedEmployee.id, 
                              'workTimeRestrictions.preferredEndTime', 
                              parseInt(e.target.value)
                            )}
                          >
                            {Array.from({length: 24}, (_, i) => (
                              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h4>特定日の休み希望</h4>
                      <div className="unavailable-dates">
                        <div className="date-input-section">
                          <input
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                addUnavailableDate(selectedEmployee.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <span>休み希望日を追加</span>
                        </div>
                        <div className="unavailable-list">
                          {(getCurrentSettings(selectedEmployee.id).unavailableDates || []).map(date => (
                            <div key={date} className="unavailable-item">
                              <span>{date}</span>
                              <button 
                                onClick={() => removeUnavailableDate(selectedEmployee.id, date)}
                                className="remove-date-btn"
                              >
                                削除
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="notes-settings">
                    <div className="setting-group">
                      <h4>備考・特記事項</h4>
                      <textarea
                        value={getCurrentSettings(selectedEmployee.id).notes || ''}
                        onChange={(e) => updateEmployeeSetting(selectedEmployee.id, 'notes', e.target.value)}
                        placeholder="特別な配慮事項、スキル、制限事項などを記入してください"
                        className="notes-textarea"
                        rows="6"
                      />
                    </div>
                    
                    <div className="setting-group">
                      <h4>設定サマリー</h4>
                      <div className="settings-summary">
                        <div className="summary-item">
                          <strong>雇用形態:</strong> {getEmploymentTypeInfo(selectedEmployee.employmentType).label}
                        </div>
                        <div className="summary-item">
                          <strong>目標勤務日数:</strong> {getCurrentSettings(selectedEmployee.id).targetWorkDays || 20}日/月
                        </div>
                        <div className="summary-item">
                          <strong>最大連続勤務:</strong> {getCurrentSettings(selectedEmployee.id).maxConsecutiveDays || 5}日
                        </div>
                        <div className="summary-item">
                          <strong>希望休曜日:</strong> 
                          {Object.entries(getCurrentSettings(selectedEmployee.id).preferredDaysOff || {})
                            .filter(([_, isOff]) => isOff)
                            .map(([day, _]) => day)
                            .join(', ') || 'なし'}
                        </div>
                        <div className="summary-item">
                          <strong>夜勤可能:</strong> 
                          {getCurrentSettings(selectedEmployee.id).workTimeRestrictions?.canWorkNight !== false ? 'はい' : 'いいえ'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>職員を選択して設定を編集してください</p>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .employee-settings {
            padding: 1rem;
            max-width: 1400px;
            margin: 0 auto;
          }

          .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e0e0e0;
          }

          .settings-header h2 {
            margin: 0;
            color: #333;
          }

          .header-actions {
            display: flex;
            gap: 1rem;
          }

          .validate-btn, .save-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
          }

          .validate-btn {
            background: #ff9800;
            color: white;
          }

          .validate-btn:hover {
            background: #f57c00;
          }

          .save-btn {
            background: #4caf50;
            color: white;
          }

          .save-btn:hover {
            background: #45a049;
          }

          .settings-content {
            display: flex;
            gap: 2rem;
            min-height: 600px;
          }

          .employee-list-panel {
            flex: 0 0 350px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1rem;
          }

          .add-employee-section {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e0e0e0;
          }

          .add-employee-section h3 {
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1.1rem;
          }

          .add-employee-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .employee-input, .employment-select {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
          }

          .add-btn {
            padding: 0.5rem;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }

          .add-btn:hover {
            background: #1976d2;
          }

          .employee-list h3 {
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1.1rem;
          }

          .employee-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .employee-item:hover {
            background: #f5f5f5;
          }

          .employee-item.selected {
            background: #e3f2fd;
            border-color: #2196f3;
          }

          .employee-item.incomplete {
            border-left: 4px solid #ff9800;
          }

          .employee-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .employee-name {
            font-weight: bold;
            color: #333;
          }

          .employee-type {
            font-size: 0.8rem;
            color: #666;
          }

          .incomplete-badge {
            font-size: 0.7rem;
            background: #ff9800;
            color: white;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
          }

          .delete-btn {
            padding: 0.25rem 0.5rem;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8rem;
          }

          .delete-btn:hover {
            background: #d32f2f;
          }

          .employee-details-panel {
            flex: 1;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1rem;
          }

          .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e0e0e0;
          }

          .details-header h3 {
            margin: 0;
            color: #333;
          }

          .employment-type-selector {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .employment-type-selector label {
            font-weight: bold;
            color: #666;
          }

          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #e0e0e0;
            margin-bottom: 1rem;
          }

          .tab-btn {
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: bold;
            color: #666;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }

          .tab-btn:hover {
            background: #f5f5f5;
          }

          .tab-btn.active {
            color: #2196f3;
            border-bottom-color: #2196f3;
          }

          .tab-content {
            min-height: 400px;
          }

          .setting-group {
            margin-bottom: 2rem;
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }

          .setting-group h4 {
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1.1rem;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 0.5rem;
          }

          .setting-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }

          .setting-row label {
            min-width: 150px;
            font-weight: bold;
            color: #555;
          }

          .setting-row input, .setting-row select {
            padding: 0.25rem;
            border: 1px solid #ddd;
            border-radius: 3px;
          }

          .weekday-preferences {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
          }

          .weekday-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .weekday-option:hover {
            background: #f5f5f5;
          }

          .shift-priorities {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .shift-priority-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }

          .shift-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .shift-label {
            font-weight: bold;
            color: #333;
          }

          .shift-time {
            font-size: 0.8rem;
            color: #666;
          }

          .priority-select {
            padding: 0.25rem;
            border: 1px solid #ddd;
            border-radius: 3px;
            min-width: 120px;
          }

          .time-restrictions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .restriction-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            cursor: pointer;
          }

          .restriction-option:hover {
            background: #f5f5f5;
          }

          .preferred-time {
            display: flex;
            gap: 2rem;
          }

          .time-input-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .time-input-group label {
            font-weight: bold;
            color: #555;
          }

          .unavailable-dates {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .date-input-section {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .unavailable-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .unavailable-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.5rem;
            background: #f5f5f5;
            border-radius: 4px;
            border: 1px solid #ddd;
          }

          .remove-date-btn {
            padding: 0.1rem 0.3rem;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.7rem;
          }

          .notes-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            resize: vertical;
          }

          .settings-summary {
            background: #f9f9f9;
            padding: 1rem;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
          }

          .summary-item {
            margin-bottom: 0.5rem;
            padding: 0.25rem 0;
            border-bottom: 1px solid #e0e0e0;
          }

          .summary-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }

          .no-selection {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 400px;
            color: #666;
            font-size: 1.1rem;
          }
        `}
      </style>
    </div>
  );
} 