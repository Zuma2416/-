import React, { createContext, useState, useContext, useEffect } from 'react';

const ShiftContext = createContext();

export function ShiftProvider({ children }) {
  const [shifts, setShifts] = useState({});
  const [shiftCounts, setShiftCounts] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState({});

  // シフト数の同期を確認する関数
  const syncShiftCounts = (dateStr, label, expectedCount) => {
    const actualCount = Object.keys(shifts[dateStr] || {})
      .filter(key => key.startsWith(`${label}-`))
      .length;

    if (actualCount !== expectedCount) {
      // 実際のシフト情報を新しい数に合わせて調整
      const newShifts = { ...shifts };
      if (!newShifts[dateStr]) {
        newShifts[dateStr] = {};
      }

      // 既存のシフト情報を保持
      const existingShifts = Object.entries(newShifts[dateStr])
        .filter(([key]) => key.startsWith(`${label}-`))
        .sort(([a], [b]) => {
          const aIndex = parseInt(a.split('-')[1]);
          const bIndex = parseInt(b.split('-')[1]);
          return aIndex - bIndex;
        });

      // 新しいシフト情報オブジェクトを作成
      const updatedShifts = {};
      existingShifts.forEach(([key, value], index) => {
        if (index < expectedCount) {
          updatedShifts[`${label}-${index}`] = value;
        }
      });

      // 更新されたシフト情報を設定
      Object.keys(newShifts[dateStr])
        .filter(key => key.startsWith(`${label}-`))
        .forEach(key => delete newShifts[dateStr][key]);

      Object.assign(newShifts[dateStr], updatedShifts);
      setShifts(newShifts);
    }
  };

  // テンプレート適用用の関数を追加
  const applyTemplate = (template) => {
    // シフト数を更新
    setShiftCounts(template.shiftCounts);

    // 各日付のシフト数を同期
    Object.entries(template.shiftCounts).forEach(([label, count]) => {
      Object.keys(shifts).forEach(dateStr => {
        syncShiftCounts(dateStr, label, count);
      });
    });
  };

  const handleShiftChange = (date, shiftIndex, value) => {
    const dateStr = date.toISOString().split("T")[0];
    setShifts(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [shiftIndex]: value
      }
    }));
  };

  const handleAddShift = (date, label) => {
    const dateStr = date.toISOString().split("T")[0];
    const currentCount = shiftCounts[dateStr]?.[label] || 1;
    
    // 上限チェックを追加
    if (currentCount >= 4) {
      alert('シフト枠は最大4つまでです');
      return;
    }

    const newCount = currentCount + 1;

    // まずシフト数を更新
    setShiftCounts(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [label]: newCount
      }
    }));

    // 更新を待機リストに追加
    setPendingUpdates(prev => ({
      ...prev,
      [`${dateStr}-${label}`]: newCount
    }));
  };

  const handleRemoveShift = (date, label, index) => {
    const dateStr = date.toISOString().split("T")[0];
    const newCount = (shiftCounts[dateStr]?.[label] || 1) - 1;
    
    // まずシフト数を更新
    setShiftCounts(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [label]: newCount
      }
    }));

    // 更新を待機リストに追加
    setPendingUpdates(prev => ({
      ...prev,
      [`${dateStr}-${label}`]: newCount
    }));
  };

  // シフト数の同期を監視
  useEffect(() => {
    Object.entries(pendingUpdates).forEach(([key, expectedCount]) => {
      const [dateStr, label] = key.split('-');
      syncShiftCounts(dateStr, label, expectedCount);
    });
    setPendingUpdates({});
  }, [pendingUpdates, shifts]);

  return (
    <ShiftContext.Provider value={{
      shifts,
      shiftCounts,
      setShiftCounts,
      handleShiftChange,
      handleAddShift,
      handleRemoveShift,
      applyTemplate
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