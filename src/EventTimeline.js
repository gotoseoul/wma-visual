import React, { useEffect, useState } from 'react';
import moment from 'moment';

const EVENT_TYPE_COLORS = {
  System: '#4E79A7',
  Peripheral: '#F28E2B',
  Network: '#59A14F',
  Application: '#E15759',
  Unknown: '#AAAAAA'
};

const PLATFORM_ICONS = {
  macOS: '/icons/apple.png',
  Android: '/icons/android.png',
  Windows: '/icons/windows.png'
};

const EventTimeline = ({ allData }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    if (!allData || allData.length === 0) return;

    const dates = Array.from(
      new Set(allData.map(event => moment(event.timestamp).format('YYYY-MM-DD')))
    );
    dates.sort();
    setAvailableDates(dates);
    setSelectedDate(dates[0]);
  }, [allData]);

  useEffect(() => {
    if (!selectedDate || allData.length === 0) return;

    const filtered = allData
      .filter(event => moment(event.timestamp).format('YYYY-MM-DD') === selectedDate)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    setFilteredEvents(filtered);
  }, [selectedDate, allData]);

  const getColor = (eventType) => EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.Unknown;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <h3 style={{ textAlign: 'center' }}>Event Sequence Timeline</h3>

      {/* 날짜 선택 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      {/* 타임라인 */}
      <div style={{ paddingLeft: '45px', fontFamily: 'Sans-serif' }}>
        {filteredEvents.map((event, index) => {
          const time = moment(event.timestamp).format('HH:mm:ss');
          const eventType = event.event_type || 'Unknown';
          const color = getColor(eventType);
          const content = event.content || 'No Content';
          const raw = event.raw_data || 'No Raw Data';

          return (
            <div key={index} style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start' }}>
              {/* 왼쪽: 아이콘 + 점 */}
              <div style={{ display: 'flex', alignItems: 'center', width: '60px' }}>
                <img
                  src={PLATFORM_ICONS[event.platform] || ''}
                  alt={event.platform}
                  style={{
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain',
                    marginRight: '8px'
                  }}
                />
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: `0 0 0 2px ${color}`
                  }}
                />
              </div>

              {/* 오른쪽: 텍스트 영역 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                flex: 1
              }}>
                {/* 시간 + 행동 */}
                <div style={{ flex: '0 0 220px', fontSize: '14px' }}>
                  {time} — {content}
                </div>

                {/* 로그 */}
                <div style={{
                  flex: 1,
                  background: '#f5f5f5',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontFamily: 'consolas',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4
                }}>
                  {raw}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventTimeline;