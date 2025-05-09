import React, { useState } from 'react';
import { AppProvider } from './Context';
import EmployeeManager from './EmployeeManager.jsx';
import ShiftCalendar from './Calendar.jsx';
import ShiftTimeSlots from './ShiftTimeSlots.jsx';

const App = () => {
  const [value, setValue] = useState(new Date());
  const [shifts, setShifts] = useState({});

  return (
    <AppProvider>
      <div>
        <EmployeeManager />
        <ShiftCalendar shifts={shifts} setShifts={setShifts} value={value} setValue={setValue} />
        <ShiftTimeSlots />
      </div>
    </AppProvider>
  );
};

export default App; 