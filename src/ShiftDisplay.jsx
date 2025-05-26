import React, { useState } from "react";
import { useShift } from "./ShiftManager";

const shiftLabels = [
  "①朝番",
  "②日勤",
  "③昼番",
  "④夜勤",
  "⑤夜番",
  "⑥夜支"
];

const priorityLabels = {
  1: "最優先",
  2: "優先",
  3: "普通",
  4: "低優先",
  5: "最低優先",
  6: "不可"
};

// 仮の職員データ
const initialEmployees = [
  { id: 1, name: "山田 太郎" },
  { id: 2, name: "佐藤 花子" },
  { id: 3, name: "鈴木 次郎" },
];

export function ShiftDisplay({ date, isSelected, onShiftClick, continuousMode }) {
  const { shifts, employees, addEmployeeToShift, removeEmployeeFromShift } = useShift();
  const [selectedShift, setSelectedShift] = useState(null);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);

  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const currentShifts = shifts[dateKey] || {};

  const handleShiftClick = (shift) => {
    if (continuousMode) {
      onShiftClick(date, shift);
      return;
    }

    setSelectedShift(shift);
    setShowEmployeeSelect(true);
  };

  const handleEmployeeSelect = (employeeId) => {
    if (selectedShift) {
      addEmployeeToShift(dateKey, selectedShift, employeeId);
    }
    setShowEmployeeSelect(false);
    setSelectedShift(null);
  };

  const handleRemoveEmployee = (shift, employeeId) => {
    removeEmployeeFromShift(dateKey, shift, employeeId);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : '';
  };

  const getEmployeeLastName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return '';
    const names = employee.name.split(' ');
    return names[names.length - 1];
  };

  const getShiftNumber = (shift) => {
    return shift.charAt(0);
  };

  return (
    <div className="shift-display">
      {shiftLabels.map((shift) => {
        const employeeCount = currentShifts[shift]?.length || 0;
        const hasEmployees = employeeCount > 0;
        const hasManyEmployees = employeeCount > 2;
        
        return (
          <div
            key={shift}
            className={`shift-slot ${hasEmployees ? 'has-employees' : ''} ${hasManyEmployees ? 'has-many-employees' : ''}`}
            onClick={() => handleShiftClick(shift)}
          >
            {hasEmployees ? (
              <div className="shift-content">
                <span className="shift-number">{getShiftNumber(shift)}</span>
                <div className="employee-list">
                  {currentShifts[shift].map((employeeId) => (
                    <div key={employeeId} className="employee-box">
                      <span className="employee-name">{getEmployeeLastName(employeeId)}</span>
                      {!continuousMode && (
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEmployee(shift, employeeId);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="shift-label">{shift}</span>
            )}
          </div>
        );
      })}

      {showEmployeeSelect && !continuousMode && (
        <div className="employee-select-modal">
          <div className="modal-content">
            <div className="employee-grid">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  className="employee-btn"
                  onClick={() => handleEmployeeSelect(employee.id)}
                >
                  {employee.name}
                </button>
              ))}
            </div>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowEmployeeSelect(false);
                setSelectedShift(null);
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          .shift-display {
            display: flex;
            flex-direction: column;
            gap: 1px;
            padding: 1px;
          }

          .shift-slot {
            min-height: 36px;
            padding: 2px 8px;
            background: #f5f5f5;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
            display: flex;
            align-items: stretch;
          }

          .shift-slot:hover {
            background: #e3f2fd;
          }

          .shift-slot.has-employees {
            background: #e3f2fd;
          }

          .shift-slot.has-many-employees {
            min-height: 70px;
          }

          .shift-content {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            height: 100%;
          }

          .shift-number {
            font-size: 1rem;
            font-weight: 500;
            color: #1976d2;
            min-width: 1.2em;
          }

          .employee-list {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            flex: 1;
            align-items: flex-start;
            height: 100%;
            align-content: flex-start;
          }

          .shift-slot.has-many-employees .employee-box {
            height: 30px;
            flex-basis: 85px;
            max-width: 85px;
            padding: 0 8px;
            gap: 2px;
          }

          .employee-box {
            height: 32px;
            padding: 0 8px;
            background: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 2px;
            font-size: 0.9rem;
            border: 1px solid #e0e0e0;
            min-width: 0;
            flex-shrink: 0;
            flex-basis: calc(48% - 1px);
            max-width: calc(48% - 1px);
            position: relative;
          }

          .employee-name {
            color: #333;
            font-weight: 600;
            white-space: nowrap;
            min-width: 0;
            flex: 1;
            padding-right: 8px;
            text-align: center;
          }

          .remove-btn {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            padding: 0;
            border: none;
            background: #e0e0e0;
            color: #999;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            line-height: 1;
            border-radius: 50%;
            opacity: 0.7;
            transition: all 0.2s ease;
          }

          .remove-btn:hover {
            opacity: 1;
            background: #bdbdbd;
            color: #666;
            transform: scale(1.1);
          }

          .shift-label {
            color: #666;
          }

          .employee-select-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            min-width: 300px;
            max-width: 90%;
          }

          .employee-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .employee-btn {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
          }

          .employee-btn:hover {
            background: #e3f2fd;
            border-color: #1976d2;
          }

          .cancel-btn {
            width: 100%;
            padding: 0.5rem;
            border: none;
            border-radius: 4px;
            background: #f5f5f5;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .cancel-btn:hover {
            background: #e0e0e0;
          }
        `}
      </style>
    </div>
  );
} 