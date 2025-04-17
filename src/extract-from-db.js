const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const moment = require('moment');

// DB 파일 경로
const dbPath = process.argv[2];
const outputPath = 'public/data.json';

if (!dbPath) {
  console.error('❗ 사용법: node extract-from-db.js your.db');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ DB 열기 실패:', err.message);
    return;
  }

  console.log('✅ DB 연결 완료:', dbPath);

  const query = `
    SELECT 
      timestamp,
      platform,
      category AS event_type,
      data_type_user_behavior AS content,
      source,
      raw_data,
      source_table,
      source_rowid
    FROM lv2_all_user_activity_logs
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ 쿼리 실패:', err.message);
      return;
    }

    const parsed = rows.map(row => {
      let adjustedTimestamp = row.timestamp;

      if (['Windows'].includes(row.platform)) {
        adjustedTimestamp = moment(row.timestamp).add(9, 'hours').format('YYYY-MM-DD HH:mm:ss');
      }  else if (row.platform === 'Android') {
        adjustedTimestamp = moment(row.timestamp).subtract(9, 'hours').format('YYYY-MM-DD HH:mm:ss');
      }

      return {
        timestamp: adjustedTimestamp,
        platform: row.platform || 'Unknown',
        event_type: row.event_type || 'Unknown',
        content: row.content || '',
        source: row.source || '',
        raw_data: row.raw_data || '',
        source_table: row.source_table || '',
        source_rowid: row.source_rowid
      };
    });

    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log(`✅ ${parsed.length}개의 항목이 ${outputPath}에 저장되었습니다.`);

    db.close();
  });
});
