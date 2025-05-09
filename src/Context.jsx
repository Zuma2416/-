import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);

  return (
    <AppContext.Provider value={{ employees, setEmployees, shifts, setShifts }}>
      {children}
    </AppContext.Provider>
  );
};