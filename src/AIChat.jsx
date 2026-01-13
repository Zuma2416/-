import React, { useState, useEffect, useRef } from 'react';
import { useShift } from './ShiftManager';

export default function AIChat() {
  const { shifts, employees } = useShift();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // メッセージリストを最下部にスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // サーバーの状態をチェック
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // メッセージを送信
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // 職員設定を取得
      const employeeSettings = JSON.parse(localStorage.getItem('employeeSettings') || '{}');

      // APIリクエスト
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          shifts,
          employees,
          employeeSettings,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('サーバーエラーが発生しました');
      }

      const data = await response.json();

      // AIの応答を追加
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        modified: data.modified,
        actions: data.actions
      }]);

      // 会話履歴を更新
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // シフトが修正された場合はLocalStorageを更新
      if (data.modified && data.shifts) {
        const shiftData = {
          shifts: data.shifts,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('currentShift', JSON.stringify(shiftData));

        // 成功メッセージを追加
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'シフトが更新されました。カレンダータブで確認してください。',
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: `エラーが発生しました: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enterキーで送信
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 会話をクリア
  const clearConversation = () => {
    if (window.confirm('会話履歴をクリアしますか?')) {
      setMessages([]);
      setConversationHistory([]);
    }
  };

  // サーバーステータス表示
  const ServerStatusBadge = () => {
    const statusConfig = {
      checking: { text: 'チェック中...', color: '#FFA500', icon: '🔄' },
      online: { text: 'サーバー稼働中', color: '#4CAF50', icon: '✓' },
      offline: { text: 'サーバーオフライン', color: '#f44336', icon: '✗' }
    };

    const config = statusConfig[serverStatus];

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: config.color + '22',
        color: config.color,
        fontSize: '12px',
        fontWeight: '500'
      }}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: 'calc(100vh - 120px)',
      backgroundColor: '#f5f5f5'
    }}>
      {/* ヘッダー */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
            AI シフトアシスタント
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            自然言語でシフトを修正できます
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ServerStatusBadge />
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              会話をクリア
            </button>
          )}
          <button
            onClick={checkServerStatus}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            再接続
          </button>
        </div>
      </div>

      {/* サーバーオフライン警告 */}
      {serverStatus === 'offline' && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderBottom: '1px solid #ffc107',
          color: '#856404'
        }}>
          <strong>⚠️ サーバーに接続できません</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            バックエンドサーバーを起動してください: <code>npm run server</code>
          </p>
        </div>
      )}

      {/* メッセージリスト */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ margin: '0 0 12px 0', color: '#666' }}>会話を始めましょう</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              例: 「15日の日勤に山田さんを追加して」<br />
              「来週の夜勤を佐藤さんから鈴木さんに変更して」<br />
              「月曜日の朝番を2名体制にして」
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            {/* アイコン */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: msg.role === 'user' ? '#2196F3' : msg.role === 'error' ? '#f44336' : msg.role === 'system' ? '#4CAF50' : '#673AB7',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? '👤' : msg.role === 'error' ? '⚠️' : msg.role === 'system' ? '✓' : '🤖'}
            </div>

            {/* メッセージ内容 */}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#2196F3' : msg.role === 'error' ? '#ffebee' : msg.role === 'system' ? '#e8f5e9' : '#fff',
              color: msg.role === 'user' ? 'white' : msg.role === 'error' ? '#c62828' : '#333',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              wordBreak: 'break-word'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

              {/* アクション表示 */}
              {msg.actions && msg.actions.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <strong>実行したアクション:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    {msg.actions.map((action, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* タイムスタンプ */}
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                opacity: 0.7
              }}>
                {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* ローディング表示 */}
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#673AB7',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#673AB7', animation: 'pulse 1.4s infinite' }}></div>
                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#673AB7', animation: 'pulse 1.4s infinite 0.2s' }}></div>
                <div className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#673AB7', animation: 'pulse 1.4s infinite 0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderTop: '1px solid #ddd'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="シフトの修正指示を入力してください... (Enterで送信、Shift+Enterで改行)"
            disabled={serverStatus === 'offline' || isLoading}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '60px',
              maxHeight: '200px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || serverStatus === 'offline' || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading || !inputMessage.trim() || serverStatus === 'offline' ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading || !inputMessage.trim() || serverStatus === 'offline' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              minWidth: '80px'
            }}
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#999'
        }}>
          💡 ヒント: 「○日の○番に誰々を追加/削除/変更して」のように指示してください
        </div>
      </div>

      {/* アニメーション用CSS */}
      <style>{`
        @keyframes pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
