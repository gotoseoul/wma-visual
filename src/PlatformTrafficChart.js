import React, { useState, useEffect } from 'react';
import ApexCharts from 'react-apexcharts';
import moment from 'moment';

const PlatformTrafficChart = ({ allData }) => {
  const [platformSeries, setPlatformSeries] = useState([]);
  const [eventTypeSeries, setEventTypeSeries] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const eventTypeColors = {
    System: '#4E79A7',
    Peripheral: '#F28E2B',
    Network: '#59A14F',
    Application: '#E15759',
  };

  const platformColors = {
    Android: '#59A14F',
    macOS: '#888888',
    Windows: '#4E79A7'
  };

  const defaultColor = '#AAAAAA';

  useEffect(() => {
    if (!allData || allData.length === 0) return;

    const dates = Array.from(new Set(allData.map(event => moment(event.timestamp).format('YYYY-MM-DD')))).sort();
    setAvailableDates(dates);
    if (dates.length > 0) setSelectedDate(dates[0]);
  }, [allData]);

  useEffect(() => {
    if (!selectedDate || allData.length === 0) return;

    const filtered = allData.filter(event => moment(event.timestamp).format('YYYY-MM-DD') === selectedDate);

    const platformMap = {};
    const eventTypeMap = {};

    filtered.forEach(event => {
      const hour = moment(event.timestamp).hour();
      const platform = event.platform || 'Unknown';
      const eventType = event.event_type || 'Unknown';

      if (!platformMap[platform]) {
        platformMap[platform] = Array(24).fill(0);
      }
      platformMap[platform][hour]++;

      if (!eventTypeMap[eventType]) {
        eventTypeMap[eventType] = Array(24).fill(0);
      }
      eventTypeMap[eventType][hour]++;
    });

    const formattedPlatforms = Object.entries(platformMap).map(([platform, counts]) => ({
      name: platform,
      data: counts
    }));
    const formattedEvents = Object.entries(eventTypeMap).map(([eventType, counts]) => ({
      name: eventType,
      data: counts
    }));

    setPlatformSeries(formattedPlatforms);
    setEventTypeSeries(formattedEvents);
  }, [allData, selectedDate]);

  const baseOptions = {
    chart: {
      type: 'line',
      height: 300,
      zoom: { enabled: false }
    },
    stroke: { curve: 'smooth' },
    xaxis: {
      categories: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
      title: { text: 'Hour of Day' }
    },
    yaxis: {
      title: { text: 'Event Count' }
    },
    legend: {
      position: 'bottom'
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      <h3 style={{ textAlign: 'center' }}>Platform Traffic</h3>
      <ApexCharts
        options={{
          ...baseOptions,
          title: {
            text: `Platform Traffic - ${selectedDate}`,
            align: 'center'
          },
          colors: platformSeries.map(s => platformColors[s.name] || defaultColor)
        }}
        series={platformSeries}
        type="line"
        height={300}
      />

      <h3 style={{ textAlign: 'center', marginTop: '60px' }}>Event Type Traffic</h3>
      <ApexCharts
        options={{
          ...baseOptions,
          title: {
            text: `Event Type Traffic - ${selectedDate}`,
            align: 'center'
          },
          colors: eventTypeSeries.map(s => eventTypeColors[s.name] || defaultColor)
        }}
        series={eventTypeSeries}
        type="line"
        height={300}
      />
    </div>
  );
};

export default PlatformTrafficChart;
