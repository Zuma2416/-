import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// シフト情報をテキスト形式に変換
function formatShiftsForAI(shifts, employees, employeeSettings) {
  let formatted = '# 現在のシフト情報\n\n';

  // 職員情報
  formatted += '## 職員一覧\n';
  employees.forEach(emp => {
    const settings = employeeSettings[emp.id] || {};
    formatted += `- ID: ${emp.id}, 名前: ${emp.name}, 雇用形態: ${emp.employmentType}\n`;

    if (settings.shiftPriorities) {
      formatted += `  シフト優先度: ${JSON.stringify(settings.shiftPriorities)}\n`;
    }

    if (settings.preferredDaysOff) {
      const daysOff = Object.entries(settings.preferredDaysOff)
        .filter(([day, value]) => value)
        .map(([day]) => day);
      if (daysOff.length > 0) {
        formatted += `  希望休曜日: ${daysOff.join(', ')}\n`;
      }
    }

    if (settings.unavailableDates && settings.unavailableDates.length > 0) {
      formatted += `  特定日の休み希望: ${settings.unavailableDates.join(', ')}\n`;
    }

    if (settings.targetWorkDays) {
      formatted += `  目標勤務日数: ${settings.targetWorkDays}日/月\n`;
    }

    formatted += '\n';
  });

  // シフト情報
  formatted += '## シフト割り当て\n\n';
  const sortedDates = Object.keys(shifts).sort();

  sortedDates.forEach(dateKey => {
    const date = new Date(dateKey);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    formatted += `### ${dateKey} (${dayOfWeek})\n`;

    const dayShifts = shifts[dateKey];
    Object.entries(dayShifts).forEach(([shiftType, empIds]) => {
      if (empIds && empIds.length > 0) {
        const empNames = empIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.name : `ID:${id}`;
        });
        formatted += `- ${shiftType}: ${empNames.join(', ')}\n`;
      }
    });
    formatted += '\n';
  });

  return formatted;
}

// AIの応答からシフト変更を抽出
function parseShiftChanges(aiResponse, shifts, employees) {
  // AIの応答をパースして、シフト変更の指示を抽出
  const changes = {
    modified: false,
    newShifts: JSON.parse(JSON.stringify(shifts)), // Deep copy
    actions: [],
    explanation: ''
  };

  try {
    // JSONレスポンスとして返される場合
    if (aiResponse.includes('{') && aiResponse.includes('}')) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.shifts) {
          changes.newShifts = parsed.shifts;
          changes.modified = true;
        }

        if (parsed.actions) {
          changes.actions = parsed.actions;
        }

        if (parsed.explanation) {
          changes.explanation = parsed.explanation;
        }
      }
    }
  } catch (error) {
    console.error('シフト変更のパースエラー:', error);
  }

  return changes;
}

// シフト修正を処理
export async function handleShiftModification({ message, shifts, employees, employeeSettings, conversationHistory }) {
  try {
    console.log('AI処理開始:', message);

    // シフト情報をフォーマット
    const formattedShifts = formatShiftsForAI(shifts, employees, employeeSettings);

    // システムプロンプト
    const systemPrompt = `あなたはシフト管理の専門家AIアシスタントです。ユーザーからの自然言語の指示を理解し、シフトを適切に修正します。

あなたの役割：
1. ユーザーの要望を正確に理解する
2. 現在のシフト情報と職員情報を考慮する
3. 職員の制約条件（希望休、優先度、連続勤務制限など）を尊重する
4. シフトの変更案を提示する
5. 変更の理由を説明する

応答形式：
{
  "shifts": { /* 修正後のシフトデータ（変更がある場合のみ） */ },
  "actions": [
    "具体的な変更内容1",
    "具体的な変更内容2"
  ],
  "explanation": "変更の理由と考慮した点の説明",
  "warnings": ["注意点があれば記載"]
}

シフトデータの形式：
{
  "YYYY-MM-DD": {
    "①朝番": [職員ID1, 職員ID2],
    "②日勤": [職員ID1, 職員ID2],
    "③昼番": [職員ID1],
    "④夜勤": [職員ID1],
    "⑤夜番": [職員ID1],
    "⑥夜支": [職員ID1]
  }
}

重要な制約：
- 日勤は生活支援員のみが担当可能
- 夜勤はその日他のシフトに入っていない人のみ
- 優先度6は「勤務不可」を意味する
- 希望休曜日と特定日の休み希望を尊重する
- 連続勤務日数の制限を守る
- 週間勤務時間の上限を守る`;

    // 会話履歴を構築
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: `${formattedShifts}\n\n---\n\nユーザーの要望:\n${message}\n\n上記の要望に基づいてシフトを修正してください。`
      }
    ];

    console.log('Claude APIに問い合わせ中...');

    // Claude APIを呼び出し
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    });

    console.log('Claude APIからの応答受信');

    const aiResponse = response.content[0].text;
    console.log('AI応答:', aiResponse);

    // シフト変更を抽出
    const changes = parseShiftChanges(aiResponse, shifts, employees);

    // 応答を返す
    return {
      success: true,
      message: aiResponse,
      shifts: changes.newShifts,
      modified: changes.modified,
      actions: changes.actions,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]
    };

  } catch (error) {
    console.error('AI処理エラー:', error);

    // エラーの詳細をログに出力
    if (error.response) {
      console.error('APIエラーレスポンス:', error.response.data);
    }

    throw new Error(`AI処理に失敗しました: ${error.message}`);
  }
}

// シフトの提案を生成
export async function generateShiftSuggestions({ employees, employeeSettings, year, month, constraints }) {
  try {
    const systemPrompt = `あなたはシフト管理の専門家です。職員情報と制約条件を基に、最適なシフトを提案してください。`;

    const userPrompt = `
職員情報:
${JSON.stringify(employees, null, 2)}

職員設定:
${JSON.stringify(employeeSettings, null, 2)}

対象年月: ${year}年${month + 1}月

制約条件:
${JSON.stringify(constraints, null, 2)}

上記の情報を基に、月間のシフト案を作成してください。
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    return {
      success: true,
      suggestion: response.content[0].text
    };

  } catch (error) {
    console.error('シフト提案生成エラー:', error);
    throw error;
  }
}
