import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';

const generateColor = (eventType) => {
  const colorMap = {
    System: '#4E79A7',
    Peripheral: '#F28E2B',
    Network: '#59A14F',
    Application: '#E15759',
    Unknown: '#AAAAAA'
  };
  return colorMap[eventType] || colorMap.Unknown;
};

const HeatmapView = ({ allData }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [yTypes, setYTypes] = useState([]);

  useEffect(() => {
    const dates = Array.from(new Set(allData.map(row => moment(row.timestamp).format('YYYY-MM-DD'))));
    dates.sort();
    setAvailableDates(dates);
    if (dates.length > 0) setSelectedDate(dates[0]);

    const allTypes = Array.from(
      new Set(
        allData.map(row => (row.content || '').split('_')[0] || 'Unknown')
      )
    ).sort();

    const eventTypeMap = {};
    allTypes.forEach(type => {
      const eventType = allData.find(row => row.content?.startsWith(type))?.event_type || 'Unknown';
      eventTypeMap[type] = generateColor(eventType);
    });

    setColorMap(eventTypeMap);
    setYTypes(allTypes);
  }, [allData]);

  useEffect(() => {
    if (!selectedDate || yTypes.length === 0) return;

    const filtered = allData.filter(row => moment(row.timestamp).format('YYYY-MM-DD') === selectedDate);

    const heatmap = {};
    yTypes.forEach(type => {
      heatmap[type] = Array(24).fill(0);
    });

    filtered.forEach(row => {
      const hour = moment(row.timestamp).hour();
      const type = (row.content || '').split('_')[0] || 'Unknown';

      if (!heatmap[type]) heatmap[type] = Array(24).fill(0);
      heatmap[type][hour]++;
    });

    const seriesData = yTypes.map(type => ({
      name: type,
      data: heatmap[type] || Array(24).fill(0),
      color: colorMap[type] || '#CCCCCC'
    }));

    setSeries(seriesData);
  }, [allData, selectedDate, yTypes, colorMap]);

  const options = {
    chart: {
      type: 'heatmap',
      width: '100%',
      height: '100%',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const dataType = series[config.seriesIndex].name;
          const hour = config.dataPointIndex;

          const filtered = allData.filter(row => moment(row.timestamp).format('YYYY-MM-DD') === selectedDate);

          const clickedLogs = filtered.filter(row => {
            const rowType = (row.content || '').split('_')[0] || 'Unknown';
            const rowHour = moment(row.timestamp).hour();
            return rowType === dataType && rowHour === hour;
          });

          setSelectedLogs(clickedLogs);
        }
      }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.1,
        useFillColorAsStroke: false,
        distributed: true,
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#000']
          }
        },
        cell: {
          height: 15,
          width: 15
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      enabled: true
    }
  };

  const legendStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px'
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px'
  };

  const legendColors = {
    System: '#4E79A7',
    Peripheral: '#F28E2B',
    Network: '#59A14F',
    Application: '#E15759'
  };

  return (
    <div style={{ paddingTop: '40px' }}>
      <h3 style={{ textAlign: 'center' }}>Hourly Activity Heatmap (Event Type Colors)</h3>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      <div style={legendStyle}>
        {Object.entries(legendColors).map(([label, color]) => (
          <div key={label} style={legendItemStyle}>
            <div style={{ width: '12px', height: '12px', backgroundColor: color, borderRadius: '3px' }}></div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ReactApexChart options={options} series={series} type="heatmap" height={300} />

      {selectedLogs.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4>📋 Selected Cell Logs</h4>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Platform</th>
                <th style={thStyle}>Event Type</th>
                <th style={thStyle}>Content</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Raw Data</th>
                <th style={thStyle}>Source Table</th>
                <th style={thStyle}>Row ID</th>
              </tr>
            </thead>
            <tbody>
              {selectedLogs.map((log, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{log.timestamp}</td>
                  <td style={tdStyle}>{log.platform}</td>
                  <td style={tdStyle}>{log.event_type}</td>
                  <td style={tdStyle}>{log.content}</td>
                  <td style={tdStyle}>{log.source}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'pre-wrap' }}>{log.raw_data}</td>
                  <td style={tdStyle}>{log.source_table}</td>
                  <td style={tdStyle}>{log.source_rowid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  borderBottom: '1px solid #ccc',
  padding: '4px',
  textAlign: 'left'
};

const tdStyle = {
  borderBottom: '1px solid #eee',
  padding: '4px'
};

export default HeatmapView;
