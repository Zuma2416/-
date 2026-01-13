import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { handleShiftModification } from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'シフト管理AIサーバーが稼働中です' });
});

// AI対話エンドポイント
app.post('/api/chat', async (req, res) => {
  try {
    const { message, shifts, employees, employeeSettings, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'メッセージが必要です' });
    }

    console.log('AI対話リクエスト受信:', {
      message,
      shiftsCount: Object.keys(shifts || {}).length,
      employeesCount: (employees || []).length
    });

    // AIサービスを呼び出してシフトを修正
    const result = await handleShiftModification({
      message,
      shifts: shifts || {},
      employees: employees || [],
      employeeSettings: employeeSettings || {},
      conversationHistory: conversationHistory || []
    });

    res.json(result);
  } catch (error) {
    console.error('AI対話エラー:', error);
    res.status(500).json({
      error: 'AI処理中にエラーが発生しました',
      details: error.message
    });
  }
});

// シフト分析エンドポイント
app.post('/api/analyze-shifts', async (req, res) => {
  try {
    const { shifts, employees, employeeSettings, year, month } = req.body;

    // シフトの統計情報を計算
    const analysis = analyzeShifts(shifts, employees, employeeSettings, year, month);

    res.json(analysis);
  } catch (error) {
    console.error('シフト分析エラー:', error);
    res.status(500).json({
      error: 'シフト分析中にエラーが発生しました',
      details: error.message
    });
  }
});

// シフト分析関数
function analyzeShifts(shifts, employees, employeeSettings, year, month) {
  const analysis = {
    employees: [],
    summary: {
      totalShifts: 0,
      coverage: {},
      warnings: []
    }
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const shiftTypes = ['①朝番', '②日勤', '③昼番', '④夜勤', '⑤夜番', '⑥夜支'];

  // 各シフトタイプのカバー率を計算
  shiftTypes.forEach(shiftType => {
    let coveredDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (shifts[dateKey]?.[shiftType]?.length > 0) {
        coveredDays++;
      }
    }
    analysis.summary.coverage[shiftType] = {
      covered: coveredDays,
      total: daysInMonth,
      percentage: Math.round((coveredDays / daysInMonth) * 100)
    };
  });

  // 各職員の勤務統計を計算
  employees.forEach(emp => {
    const empStats = {
      id: emp.id,
      name: emp.name,
      workDays: 0,
      shifts: {},
      totalHours: 0,
      maxConsecutiveDays: 0,
      violations: []
    };

    let currentConsecutive = 0;
    let lastWorked = false;

    // 各日をチェック
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      let workedToday = false;
      if (shifts[dateKey]) {
        Object.entries(shifts[dateKey]).forEach(([shiftType, empIds]) => {
          if (empIds && empIds.includes(emp.id)) {
            workedToday = true;
            empStats.shifts[shiftType] = (empStats.shifts[shiftType] || 0) + 1;

            // 勤務時間を計算
            const shiftHours = {
              '①朝番': 5,
              '②日勤': 10,
              '③昼番': 5,
              '④夜勤': 17,
              '⑤夜番': 3,
              '⑥夜支': 8
            };
            empStats.totalHours += shiftHours[shiftType] || 0;
          }
        });
      }

      if (workedToday) {
        empStats.workDays++;
        if (lastWorked) {
          currentConsecutive++;
        } else {
          currentConsecutive = 1;
        }
        empStats.maxConsecutiveDays = Math.max(empStats.maxConsecutiveDays, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
      lastWorked = workedToday;
    }

    // 設定との照合
    const settings = employeeSettings[emp.id];
    if (settings) {
      // 目標勤務日数チェック
      if (settings.targetWorkDays && Math.abs(empStats.workDays - settings.targetWorkDays) > 3) {
        empStats.violations.push(
          `目標勤務日数（${settings.targetWorkDays}日）から${Math.abs(empStats.workDays - settings.targetWorkDays)}日ずれています`
        );
      }

      // 最大連続勤務日数チェック
      if (settings.maxConsecutiveDays && empStats.maxConsecutiveDays > settings.maxConsecutiveDays) {
        empStats.violations.push(
          `最大連続勤務日数（${settings.maxConsecutiveDays}日）を超えています（${empStats.maxConsecutiveDays}日）`
        );
      }

      // 最低休日数チェック
      const actualDaysOff = daysInMonth - empStats.workDays;
      if (settings.minDaysOff && actualDaysOff < settings.minDaysOff) {
        empStats.violations.push(
          `最低休日数（${settings.minDaysOff}日）を下回っています（${actualDaysOff}日）`
        );
      }
    }

    analysis.employees.push(empStats);
    analysis.summary.totalShifts += empStats.workDays;

    if (empStats.violations.length > 0) {
      analysis.summary.warnings.push({
        employee: emp.name,
        violations: empStats.violations
      });
    }
  });

  return analysis;
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║   シフト管理AIサーバーが起動しました          ║
  ║   ポート: ${PORT}                              ║
  ║   URL: http://localhost:${PORT}                ║
  ╚════════════════════════════════════════════════╝
  `);

  // Claude API キーの確認
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  警告: ANTHROPIC_API_KEY が設定されていません');
    console.warn('   .env ファイルに ANTHROPIC_API_KEY を設定してください');
  }
});
