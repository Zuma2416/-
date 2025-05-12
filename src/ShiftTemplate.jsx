import React, { useState, useEffect } from 'react';
import { useShift } from './ShiftManager';

const initialTemplate = {
  id: Date.now(),
  name: "日勤・昼番2枠テンプレート",
  shifts: {},
  shiftCounts: {
    "①朝番": 1,
    "②日勤": 2,
    "③昼番": 2,
    "④夜勤": 1,
    "⑤夜番": 1,
    "⑥夜支": 1
  },
  createdAt: new Date().toISOString()
};

const defaultTemplate = {
  id: Date.now() + 1,
  name: "基本テンプレート",
  shifts: {},
  shiftCounts: {
    "①朝番": 1,
    "②日勤": 1,
    "③昼番": 1,
    "④夜勤": 1,
    "⑤夜番": 1,
    "⑥夜支": 1
  },
  createdAt: new Date().toISOString()
};

export function ShiftTemplate() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const { applyTemplate } = useShift();

  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('shiftTemplates') || '[]');
    if (savedTemplates.length === 0) {
      // 初期テンプレートが存在しない場合のみ追加
      savedTemplates.push(initialTemplate, defaultTemplate);
      localStorage.setItem('shiftTemplates', JSON.stringify(savedTemplates));
    }
    setTemplates(savedTemplates);
  }, []);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    // シフト数の上限チェック
    const shiftCounts = {
      "①朝番": 1,
      "②日勤": 2,
      "③昼番": 2,
      "④夜勤": 1,
      "⑤夜番": 1,
      "⑥夜支": 1
    };

    // 各シフトの枠数が4を超えていないかチェック
    const hasExceededLimit = Object.values(shiftCounts).some(count => count > 4);
    if (hasExceededLimit) {
      alert('シフト枠は最大4つまでです');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName,
      shifts: {},
      shiftCounts,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('shiftTemplates', JSON.stringify(updatedTemplates));
    setTemplateName('');
  };

  const handleDeleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('shiftTemplates', JSON.stringify(updatedTemplates));
  };

  const handleApplyTemplate = (template) => {
    applyTemplate(template);
    setSelectedTemplate(template);
    alert(`${template.name}を適用しました`);
  };

  return (
    <div className="template-container">
      <div className="template-input">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="テンプレート名を入力"
          className="template-name-input"
        />
        <button onClick={handleSaveTemplate} className="save-template-btn">
          テンプレートを保存
        </button>
      </div>

      <div className="template-list">
        <h3>保存済みテンプレート</h3>
        {templates.map((template) => (
          <div key={template.id} className="template-item">
            <div className="template-info">
              <span className="template-name">{template.name}</span>
              <span className="template-date">
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="template-actions">
              <button
                onClick={() => handleApplyTemplate(template)}
                className="apply-btn"
              >
                適用
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="delete-btn"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>
        {`
          .template-container {
            padding: 1rem;
          }

          .template-input {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .template-name-input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }

          .save-template-btn {
            padding: 0.5rem 1rem;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .save-template-btn:hover {
            background: #1565c0;
          }

          .template-list {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1rem;
          }

          .template-list h3 {
            margin: 0 0 1rem 0;
            color: #333;
          }

          .template-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #eee;
          }

          .template-item:last-child {
            border-bottom: none;
          }

          .template-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .template-name {
            font-weight: 500;
            color: #333;
          }

          .template-date {
            font-size: 0.875rem;
            color: #666;
          }

          .template-actions {
            display: flex;
            gap: 0.5rem;
          }

          .apply-btn,
          .delete-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
          }

          .apply-btn {
            background: #4caf50;
            color: white;
          }

          .apply-btn:hover {
            background: #43a047;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .apply-btn:active {
            transform: translateY(1px);
            box-shadow: none;
          }

          .apply-btn::after,
          .delete-btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 0;
            border-radius: 100%;
            transform: scale(1, 1) translate(-50%);
            transform-origin: 50% 50%;
          }

          .apply-btn:active::after,
          .delete-btn:active::after {
            animation: ripple 0.6s ease-out;
          }

          @keyframes ripple {
            0% {
              transform: scale(0, 0);
              opacity: 0.5;
            }
            100% {
              transform: scale(20, 20);
              opacity: 0;
            }
          }

          .delete-btn {
            background: #f44336;
            color: white;
          }

          .delete-btn:hover {
            background: #e53935;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .delete-btn:active {
            transform: translateY(1px);
            box-shadow: none;
          }
        `}
      </style>
    </div>
  );
} 