import React from 'react';
import HeatmapView from './HeatmapView';
import DotSeries from './Dotseries';
import SankeyFlowChart from './SankeyFlowChart';
import EventTimeline from './EventTimeline';
import PlatformTrafficChart from './PlatformTrafficChart';

function App() {
  const [allData, setAllData] = React.useState([]);

  React.useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => setAllData(data))
      .catch(err => console.error('데이터 로드 오류:', err));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>📊 Forensic Behavior Visualization Dashboard</h1>

      {/* 트래픽 그래프 (platform별 시간대 count) */}
      <PlatformTrafficChart allData={allData} />

      {/* Dot Series View (히트맵 및 점 기반 시각화) */}
      <DotSeries allData={allData} />

      {/* Sankey 차트 */}
      <SankeyFlowChart allData={allData} />

      {/* 시퀀스 타임라인 */}
      <EventTimeline allData={allData} />

      {/* 히트맵 뷰 (분리 사용 가능) */}
      <HeatmapView allData={allData} />
      
    </div>
  );
}

export default App;
