const fs = require('fs');
const path = require('path');

async function importData() {
  try {
    const filePath = path.join(__dirname, 'insight_radar_result.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    console.log('Sending data to API...');
    
    // API 요청 (Next.js 로컬 서버가 3000포트에서 실행 중이어야 함)
    const response = await fetch('http://localhost:3000/api/companies/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Import 성공:', result.results);
    } else {
      console.error('❌ Import 실패:', result.error);
    }
  } catch (error) {
    console.error('실행 중 오류 발생:', error);
    console.log('※ 참고: 이 스크립트를 실행하기 전에 npm run dev로 Next.js 서버를 켜주세요.');
  }
}

importData();
