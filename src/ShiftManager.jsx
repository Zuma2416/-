import React, { createContext, useContext, useState, useEffect } from "react";

const ShiftContext = createContext();

export function ShiftProvider({ children }) {
  const [shifts, setShifts] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [employees, setEmployees] = useState([]);

  // ローカルストレージからシフトデータと職員データを読み込む
  const loadData = () => {
    try {
      const savedData = localStorage.getItem('currentShift');
      if (savedData) {
        const { shifts: savedShifts } = JSON.parse(savedData);
        setShifts(savedShifts);
      }

      const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      console.log('ShiftManager: 職員データ読み込み', savedEmployees);
      setEmployees(savedEmployees);
      
      // 職員データが空の場合は警告
      if (savedEmployees.length === 0) {
        console.warn('ShiftManager: 職員データが空です。職員設定タブで職員を追加してください。');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // 初期ロード
  useEffect(() => {
    loadData();
  }, []);

  // 定期的なデータ更新
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadData();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // シフトデータを保存
  const saveShifts = (newShifts) => {
    try {
      const data = {
        shifts: newShifts,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('currentShift', JSON.stringify(data));
      setShifts(newShifts);
    } catch (error) {
      console.error('Error saving shifts:', error);
    }
  };

  // 職員データを保存
  const saveEmployees = (newEmployees) => {
    try {
      setEmployees(newEmployees);
      localStorage.setItem('employees', JSON.stringify(newEmployees));
    } catch (error) {
      console.error('Error saving employees:', error);
    }
  };

  // シフトに職員を追加
  const addEmployeeToShift = (dateKey, shiftLabel, employeeId) => {
    try {
      setShifts(prevShifts => {
        const newShifts = { ...prevShifts };
        if (!newShifts[dateKey]) {
          newShifts[dateKey] = {};
        }
        if (!newShifts[dateKey][shiftLabel]) {
          newShifts[dateKey][shiftLabel] = [];
        }
        if (!newShifts[dateKey][shiftLabel].includes(employeeId)) {
          newShifts[dateKey][shiftLabel] = [...newShifts[dateKey][shiftLabel], employeeId];
        }
        saveShifts(newShifts);
        return newShifts;
      });
    } catch (error) {
      console.error('Error adding employee to shift:', error);
    }
  };

  // シフトから職員を削除
  const removeEmployeeFromShift = (dateKey, shiftLabel, employeeId) => {
    try {
      setShifts(prevShifts => {
        const newShifts = { ...prevShifts };
        if (newShifts[dateKey]?.[shiftLabel]) {
          newShifts[dateKey][shiftLabel] = newShifts[dateKey][shiftLabel].filter(id => id !== employeeId);
          // シフトが空になった場合はそのシフトを削除
          if (newShifts[dateKey][shiftLabel].length === 0) {
            delete newShifts[dateKey][shiftLabel];
          }
          // 日付のシフトがすべて空になった場合はその日付を削除
          if (Object.keys(newShifts[dateKey]).length === 0) {
            delete newShifts[dateKey];
          }
        }
        saveShifts(newShifts);
        return newShifts;
      });
    } catch (error) {
      console.error('Error removing employee from shift:', error);
    }
  };

  const clearShifts = (year, month) => {
    try {
      const newShifts = { ...shifts };
      
      // 指定された月の日付をすべて取得
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        delete newShifts[dateKey];
      }

      saveShifts(newShifts);
    } catch (error) {
      console.error('Error clearing shifts:', error);
    }
  };

  // ヘルパー関数: 職員が特定の日に勤務可能かチェック
  const canEmployeeWorkOnDate = (employee, date, dateKey, employeeSettings) => {
    const settings = employeeSettings[employee.id];
    if (!settings) return true;

    // 特定日の休み希望をチェック
    if (settings.unavailableDates && settings.unavailableDates.includes(dateKey)) {
      return false;
    }

    // 曜日の希望休をチェック
    const dayOfWeek = date.getDay();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayName = dayNames[dayOfWeek];
    if (settings.preferredDaysOff && settings.preferredDaysOff[dayName]) {
      return false;
    }

    return true;
  };

  // ヘルパー関数: 連続勤務日数をチェック
  const getConsecutiveWorkDays = (employeeId, dateKey, shifts) => {
    const date = new Date(dateKey);
    let consecutive = 0;

    // 前日から遡って連続勤務日数をカウント
    for (let i = 1; i <= 10; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      if (!shifts[checkDateKey]) break;

      const isWorking = Object.values(shifts[checkDateKey]).some(shiftEmployees =>
        shiftEmployees && shiftEmployees.includes(employeeId)
      );

      if (isWorking) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  };

  // ヘルパー関数: シフトの時間を取得
  const getShiftHours = (shiftId) => {
    const shiftHours = {
      'morning': 5,      // 6:00-11:00
      'day': 10,         // 9:00-19:00
      'afternoon': 5,    // 11:00-16:00
      'night': 17,       // 16:00-翌9:00
      'evening': 3,      // 19:00-22:00
      'night_support': 8 // 22:00-翌6:00
    };
    return shiftHours[shiftId] || 0;
  };

  // ヘルパー関数: 職員の週間勤務時間を計算
  const getWeeklyWorkHours = (employeeId, dateKey, shifts) => {
    const date = new Date(dateKey);
    let totalHours = 0;

    // 過去6日間の勤務時間を計算（今日を含めて7日間）
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

      if (shifts[checkDateKey]) {
        Object.entries(shifts[checkDateKey]).forEach(([shiftLabel, shiftEmployees]) => {
          if (shiftEmployees && shiftEmployees.includes(employeeId)) {
            const shiftId = shiftLabel.includes('朝番') ? 'morning' :
                          shiftLabel.includes('日勤') ? 'day' :
                          shiftLabel.includes('昼番') ? 'afternoon' :
                          shiftLabel.includes('夜勤') ? 'night' :
                          shiftLabel.includes('夜番') ? 'evening' : 'night_support';
            totalHours += getShiftHours(shiftId);
          }
        });
      }
    }

    return totalHours;
  };

  // 自動シフト生成（改善版）
  const generateAutoShifts = (year, month) => {
    try {
      console.log('=== 自動シフト生成開始（改善版） ===');
      console.log('対象年月:', year, month);

      // データの存在確認
      console.log('職員データ:', employees);
      const employeeSettings = JSON.parse(localStorage.getItem('employeeSettings') || '{}');
      console.log('職員設定:', employeeSettings);

      if (employees.length === 0) {
        return {
          success: false,
          error: '職員データが登録されていません。職員設定タブで職員を追加してください。'
        };
      }

      // 生活支援員の確認
      const lifeSupportEmployees = employees.filter(emp => emp.employmentType === 'life_support');
      console.log('生活支援員:', lifeSupportEmployees);

      if (lifeSupportEmployees.length === 0) {
        return {
          success: false,
          error: '生活支援員が登録されていません。職員設定で雇用形態を「生活支援員」に設定してください。'
        };
      }

      clearShifts(year, month);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const shiftLabels = [
        { id: 'morning', label: '①朝番' },
        { id: 'day', label: '②日勤' },
        { id: 'afternoon', label: '③昼番' },
        { id: 'night', label: '④夜勤' },
        { id: 'evening', label: '⑤夜番' },
        { id: 'night_support', label: '⑥夜支' }
      ];

      let newShifts = {};
      let assignmentLog = [];
      let constraintViolations = [];

      // 各日のシフト割り当て
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();

        newShifts[dateKey] = {};
        assignmentLog.push(`${day}日の割り当て開始`);

        // 1. 日勤（②日勤）の割り当て: life_supportのみ、基本2名
        const dayCandidates = employees.filter(emp => {
          const isLifeSupport = emp.employmentType === 'life_support';
          const priority = employeeSettings[emp.id]?.shiftPriorities?.day ?? 6;
          const canWork = priority !== 6;
          const canWorkOnDate = canEmployeeWorkOnDate(emp, date, dateKey, employeeSettings);

          // 連続勤務日数チェック
          const consecutiveDays = getConsecutiveWorkDays(emp.id, dateKey, newShifts);
          const maxConsecutive = employeeSettings[emp.id]?.maxConsecutiveDays ?? 5;
          const withinConsecutiveLimit = consecutiveDays < maxConsecutive;

          // 週間勤務時間チェック
          const weeklyHours = getWeeklyWorkHours(emp.id, dateKey, newShifts);
          const maxWeeklyHours = employeeSettings[emp.id]?.maxHoursPerWeek ?? 40;
          const withinWeeklyLimit = (weeklyHours + 10) <= maxWeeklyHours; // 日勤は10時間

          console.log(`${emp.name}: 生活支援員=${isLifeSupport}, 日勤優先度=${priority}, 勤務可能=${canWork}, 日付OK=${canWorkOnDate}, 連続=${consecutiveDays}/${maxConsecutive}, 週間時間=${weeklyHours}/${maxWeeklyHours}`);

          return isLifeSupport && canWork && canWorkOnDate && withinConsecutiveLimit && withinWeeklyLimit;
        });

        console.log(`${day}日 日勤候補:`, dayCandidates.map(emp => emp.name));

        // 優先度順でソート
        dayCandidates.sort((a, b) => {
          const priorityA = employeeSettings[a.id]?.shiftPriorities?.day ?? 6;
          const priorityB = employeeSettings[b.id]?.shiftPriorities?.day ?? 6;
          return priorityA - priorityB;
        });

        // 日勤に2名まで割り当て
        const dayShiftAssigned = [];
        for (let i = 0; i < Math.min(2, dayCandidates.length); i++) {
          const emp = dayCandidates[i];
          if (!newShifts[dateKey]['②日勤']) {
            newShifts[dateKey]['②日勤'] = [];
          }
          newShifts[dateKey]['②日勤'].push(emp.id);
          dayShiftAssigned.push(emp.id);
          assignmentLog.push(`  ②日勤: ${emp.name} (優先度${employeeSettings[emp.id]?.shiftPriorities?.day ?? 6})`);
        }

        if (dayCandidates.length < 2) {
          constraintViolations.push(`${day}日: 日勤の人数が不足しています（${dayCandidates.length}/2名）`);
        }

        // 2. その他のシフトの割り当て
        const otherShifts = shiftLabels.filter(shift => shift.label !== '②日勤');

        for (let shift of otherShifts) {
          // 勤務可能な職員を取得（優先度6以外）
          let candidates = employees.filter(emp => {
            const priority = employeeSettings[emp.id]?.shiftPriorities?.[shift.id] ?? 6;
            const canWorkOnDate = canEmployeeWorkOnDate(emp, date, dateKey, employeeSettings);

            // 連続勤務日数チェック
            const consecutiveDays = getConsecutiveWorkDays(emp.id, dateKey, newShifts);
            const maxConsecutive = employeeSettings[emp.id]?.maxConsecutiveDays ?? 5;
            const withinConsecutiveLimit = consecutiveDays < maxConsecutive;

            // 週間勤務時間チェック
            const weeklyHours = getWeeklyWorkHours(emp.id, dateKey, newShifts);
            const maxWeeklyHours = employeeSettings[emp.id]?.maxHoursPerWeek ?? 40;
            const shiftHours = getShiftHours(shift.id);
            const withinWeeklyLimit = (weeklyHours + shiftHours) <= maxWeeklyHours;

            return priority !== 6 && canWorkOnDate && withinConsecutiveLimit && withinWeeklyLimit;
          });

          // 優先度順でソート
          candidates.sort((a, b) => {
            const priorityA = employeeSettings[a.id]?.shiftPriorities?.[shift.id] ?? 6;
            const priorityB = employeeSettings[b.id]?.shiftPriorities?.[shift.id] ?? 6;
            return priorityA - priorityB;
          });

          // シフトごとの割り当てロジック
          let assigned = false;

          for (let emp of candidates) {
            const priority = employeeSettings[emp.id]?.shiftPriorities?.[shift.id] ?? 6;

            // 夜勤の特別ルール：その日他のシフトに入っていない人のみ
            if (shift.label === '④夜勤') {
              const isAlreadyAssigned = Object.values(newShifts[dateKey]).some(shiftEmployees =>
                shiftEmployees && shiftEmployees.includes(emp.id)
              );

              if (!isAlreadyAssigned) {
                if (!newShifts[dateKey][shift.label]) {
                  newShifts[dateKey][shift.label] = [];
                }
                newShifts[dateKey][shift.label].push(emp.id);
                assigned = true;
                assignmentLog.push(`  ${shift.label}: ${emp.name} (優先度${priority})`);
                break; // 夜勤は1名のみ
              }
              continue;
            }

            // 既に同じシフトに割り当て済みかチェック
            if (newShifts[dateKey][shift.label] && newShifts[dateKey][shift.label].includes(emp.id)) {
              continue;
            }

            // 1日の勤務シフト数制限チェック
            const currentShiftCount = Object.values(newShifts[dateKey]).reduce((count, shiftEmployees) => {
              return count + (shiftEmployees && shiftEmployees.includes(emp.id) ? 1 : 0);
            }, 0);

            // 優先度1（最優先）の場合：1日2シフトまで可能
            if (priority === 1 && currentShiftCount < 2) {
              if (!newShifts[dateKey][shift.label]) {
                newShifts[dateKey][shift.label] = [];
              }
              newShifts[dateKey][shift.label].push(emp.id);
              assigned = true;
              assignmentLog.push(`  ${shift.label}: ${emp.name} (優先度${priority})`);
              break;
            }

            // 優先度2（優先）の場合：他に最優先職員がいなければ、1日2シフトまで可能
            if (priority === 2 && currentShiftCount < 2) {
              const hasHigherPriority = candidates.some(otherEmp => {
                const otherPriority = employeeSettings[otherEmp.id]?.shiftPriorities?.[shift.id] ?? 6;
                const otherCurrentShiftCount = Object.values(newShifts[dateKey]).reduce((count, shiftEmployees) => {
                  return count + (shiftEmployees && shiftEmployees.includes(otherEmp.id) ? 1 : 0);
                }, 0);
                return otherPriority === 1 && otherCurrentShiftCount < 2 && otherEmp.id !== emp.id;
              });

              if (!hasHigherPriority) {
                if (!newShifts[dateKey][shift.label]) {
                  newShifts[dateKey][shift.label] = [];
                }
                newShifts[dateKey][shift.label].push(emp.id);
                assigned = true;
                assignmentLog.push(`  ${shift.label}: ${emp.name} (優先度${priority})`);
                break;
              }
            }

            // 優先度3以下の場合：1日1シフトまで
            if (priority >= 3 && currentShiftCount === 0) {
              // より高い優先度の職員が利用可能かチェック
              const hasHigherPriority = candidates.some(otherEmp => {
                const otherPriority = employeeSettings[otherEmp.id]?.shiftPriorities?.[shift.id] ?? 6;
                const otherCurrentShiftCount = Object.values(newShifts[dateKey]).reduce((count, shiftEmployees) => {
                  return count + (shiftEmployees && shiftEmployees.includes(otherEmp.id) ? 1 : 0);
                }, 0);
                return otherPriority < priority &&
                       ((otherPriority === 1 && otherCurrentShiftCount < 2) ||
                        (otherPriority === 2 && otherCurrentShiftCount < 2) ||
                        (otherPriority >= 3 && otherCurrentShiftCount === 0)) &&
                       otherEmp.id !== emp.id;
              });

              if (!hasHigherPriority) {
                if (!newShifts[dateKey][shift.label]) {
                  newShifts[dateKey][shift.label] = [];
                }
                newShifts[dateKey][shift.label].push(emp.id);
                assigned = true;
                assignmentLog.push(`  ${shift.label}: ${emp.name} (優先度${priority})`);
                break;
              }
            }
          }

          if (!assigned && candidates.length === 0) {
            constraintViolations.push(`${day}日 ${shift.label}: 制約条件を満たす職員がいません`);
          } else if (!assigned && candidates.length > 0) {
            assignmentLog.push(`  ${shift.label}: 割り当て不可 (候補${candidates.length}名)`);
          }
        }
      }

      // 3. 被り修正と最適化
      newShifts = optimizeShiftAssignments(newShifts, employees, employeeSettings, year, month);

      console.log('割り当てログ:', assignmentLog);
      console.log('制約違反:', constraintViolations);
      console.log('生成されたシフト:', newShifts);

      saveShifts(newShifts);

      let resultMessage = `自動シフトを生成しました`;
      if (constraintViolations.length > 0) {
        resultMessage += `\n\n⚠️ 制約違反:\n${constraintViolations.slice(0, 5).join('\n')}${constraintViolations.length > 5 ? `\n...他${constraintViolations.length - 5}件` : ''}`;
      }

      return {
        success: true,
        message: resultMessage,
        violations: constraintViolations
      };
    } catch (error) {
      console.error('Error generating auto shifts:', error);
      return {
        success: false,
        error: `シフトの生成中にエラーが発生しました: ${error.message}`
      };
    }
  };

  // シフト割り当ての最適化関数
  const optimizeShiftAssignments = (shifts, employees, employeeSettings, year, month) => {
    const optimizedShifts = JSON.parse(JSON.stringify(shifts)); // Deep copy
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 各職員の月間勤務日数をカウント
    const monthlyWorkCount = {};
    employees.forEach(emp => {
      monthlyWorkCount[emp.id] = 0;
    });

    // 現在の割り当てから勤務日数をカウント
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (optimizedShifts[dateKey]) {
        Object.values(optimizedShifts[dateKey]).forEach(shiftEmployees => {
          if (shiftEmployees) {
            shiftEmployees.forEach(empId => {
              monthlyWorkCount[empId] = (monthlyWorkCount[empId] || 0) + 1;
            });
          }
        });
      }
    }

    // 勤務日数の偏りを調整
    const maxWorkDays = Math.max(...Object.values(monthlyWorkCount));
    const minWorkDays = Math.min(...Object.values(monthlyWorkCount));
    
    // 偏りが大きい場合は調整を試行
    if (maxWorkDays - minWorkDays > 3) {
      // 勤務日数が多い職員から少ない職員へのシフト移動を試行
      // （実装は複雑になるため、基本的な枠組みのみ）
      console.log('勤務日数の偏りを検出しました。調整を検討してください。', {
        最大勤務日数: maxWorkDays,
        最小勤務日数: minWorkDays
      });
    }

    return optimizedShifts;
  };

  return (
    <ShiftContext.Provider value={{
      shifts,
      employees,
      saveEmployees,
      setCurrentMonth,
      addEmployeeToShift,
      removeEmployeeFromShift,
      clearShifts,
      generateAutoShifts
    }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
} 