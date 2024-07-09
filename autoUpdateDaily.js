// GitHub 設置
const GITHUB_USERNAME = '';
const GITHUB_REPO = '';
const GITHUB_FILE_PATH = '';
const GITHUB_TOKEN = '';

// Google Sheets 設置
const SPREADSHEET_ID = '';
const SHEET_NAME = ''; // 更改為您的表單名稱

// 主函數
function main() {
  const date = getCurrentDateFormatted();
  const content = getMarkdownContentFromGitHub();
  if (content) {
    const parsedContent = parseMarkdownContent(content, date);
    if (parsedContent) {
      updateSheet(parsedContent);
    } else {
      Logger.log(`No content found for the date: ${date}`);
    }
  }
}

// 獲取當前日期格式化
function getCurrentDateFormatted() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() 返回的月份是從 0 開始的，所以需要加 1
  return `${month}/${day}`;
}

// 從 GitHub 獲取 .md 文件的內容
function getMarkdownContentFromGitHub() {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
  const options = {
    method: 'get',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  };
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return response.getContentText();
  } else {
    Logger.log('Error fetching file from GitHub:', response.getContentText());
    return null;
  }
}

// 更新 Google Sheets
function updateSheet(parsedContent) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet with name ${SHEET_NAME} not found`);
    return;
  }
  sheet.insertRowBefore(2);
  sheet.getRange('A2').setValue(parsedContent.date);
  sheet.getRange('B2').setValue(parsedContent.alexContent);
  sheet.getRange('C2').setValue(parsedContent.rickyContent);
}

function parseMarkdownContent(content, date) {
  const lines = content.split('\n');
  const startKeyword = `# ${date}`;
  let isDateFound = false;
  let alexContent = '';
  let rickyContent = '';
  let currentSection = '';

  for (const line of lines) {
    if (isDateFound) {
      if (line.startsWith('# ')) break;
      if (line.startsWith('### Alex')) {
        currentSection = 'Alex';
      } else if (line.startsWith('### Ricky')) {
        currentSection = 'Ricky';
      } else if (currentSection === 'Alex') {
        alexContent += line.replace(/#### /g, '') + '\n';
      } else if (currentSection === 'Ricky') {
        rickyContent += line.replace(/#### /g, '') + '\n';
      }
    }
    if (line.startsWith(startKeyword)) {
      isDateFound = true;
    }
  }

  return {
    date: date,
    alexContent: alexContent.trim(),
    rickyContent: rickyContent.trim(),
  };
}

// 設置定時觸發器
function createTrigger() {
  ScriptApp.newTrigger('main')
    .timeBased()
    .atHour(9)
    .nearMinute(45)
    .everyDays(1)
    .create();
}
