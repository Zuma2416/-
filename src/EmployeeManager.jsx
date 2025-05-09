import React, { useContext } from 'react';
import { AppContext } from './Context';

const EmployeeManager = () => {
  const { employees, setEmployees } = useContext(AppContext);

  // 職員の追加・編集・削除のロジック

  return (
    <div>
      {/* 職員管理UI */}
    </div>
  );
};

export default EmployeeManager; 