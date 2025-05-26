import React, { useState, useEffect } from 'react';
import ShiftCalendar from './Calendar';
import { ShiftTemplate } from './ShiftTemplate';
import { EmployeeSettings } from './EmployeeSettings';
import { Tabs, Tab, TabPanel } from './TabPanel';
import { ShiftProvider } from './ShiftManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [key, setKey] = useState(0); // コンポーネントの強制再レンダリング用

  // タブ切り替え時にコンポーネントを強制的に再レンダリング
  const handleTabChange = (newTabIndex) => {
    setActiveTab(newTabIndex);
    setKey(prev => prev + 1); // キーを更新して強制再レンダリング
  };

  return (
    <ShiftProvider>
      <div className="app-container">
        <main className="app-main">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              label="カレンダー"
              value={0}
              selected={activeTab === 0}
              onClick={() => handleTabChange(0)}
            />
            <Tab
              label="テンプレート"
              value={1}
              selected={activeTab === 1}
              onClick={() => handleTabChange(1)}
            />
            <Tab
              label="職員設定"
              value={2}
              selected={activeTab === 2}
              onClick={() => handleTabChange(2)}
            />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <div className="calendar-section" key={`calendar-${key}`}>
              <ShiftCalendar />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <div className="template-section" key={`template-${key}`}>
              <ShiftTemplate />
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <div className="employee-settings-section" key={`employee-settings-${key}`}>
              <EmployeeSettings />
            </div>
          </TabPanel>
        </main>

        <style>
          {`
            .app-container {
              min-height: 100vh;
              background: #f5f5f5;
              padding: 1rem;
            }

            .app-main {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }

            .calendar-section,
            .template-section,
            .employee-settings-section {
              padding: 0.5rem;
            }

            .tabs-container {
              margin-bottom: 0;
            }
          `}
        </style>
      </div>
    </ShiftProvider>
  );
}

export default App; 