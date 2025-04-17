// DotPlotD3.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import moment from 'moment';

const EVENT_TYPE_COLORS = {
  System: '#4E79A7',
  Peripheral: '#F28E2B',
  Network: '#59A14F',
  Application: '#E15759',
  Unknown: '#AAAAAA'
};

const DotPlotD3 = ({ allData }) => {
  const svgRef = useRef();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [availableDates, setAvailableDates] = useState([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [showBehaviorFilter, setShowBehaviorFilter] = useState(false);

  useEffect(() => {
    const dates = Array.from(new Set(allData.map(row => moment(row.timestamp).format('YYYY-MM-DD')))).sort();
    setAvailableDates(dates);
    if (dates.length > 0) setSelectedDate(dates[0]);
  }, [allData]);

  const behaviors = Array.from(new Set(allData.map(row => {
    const content = row.data_type_user_behavior || row.content || '';
    return content.split('_')[1] || 'Unknown';
  }))).sort();

  const behaviorTypes = Object.fromEntries(
    allData.map(row => {
      const content = row.data_type_user_behavior || row.content || '';
      const [type, behavior] = content.split('_');
      return [behavior || 'Unknown', type || 'Unknown'];
    })
  );

  useEffect(() => {
    if (!allData || allData.length === 0 || !selectedDate) return;

    const container = d3.select(svgRef.current);
    container.selectAll('*').remove();
    d3.select('#dot-tooltip').remove();

    const width = container.node().parentElement.offsetWidth;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 40, left: 120 };

    const svg = container.attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filtered = allData.filter(row => {
      const dateMatch = moment(row.timestamp).format('YYYY-MM-DD') === selectedDate;
      const platformMatch = selectedPlatform === 'All' || row.platform === selectedPlatform;
      const content = row.data_type_user_behavior || row.content || '';
      const behavior = content.split('_')[1] || 'Unknown';
      const behaviorMatch = selectedBehaviors.length === 0 || selectedBehaviors.includes(behavior);
      return dateMatch && platformMatch && behaviorMatch;
    });

    const dots = filtered.map(row => {
      const content = row.data_type_user_behavior || row.content || '';
      const [type, behavior] = content.split('_');
      const momentObj = moment(row.timestamp);
      return {
        hour: +momentObj.format('H'),
        jitter: (momentObj.minutes() * 60 + momentObj.seconds()) / 3600,
        label: type || 'Unknown',
        behavior: behavior || 'Unknown',
        eventType: row.event_type || 'Unknown',
        platform: row.platform || 'Unknown',
        timestamp: momentObj.format('HH:mm:ss')
      };
    });

    const yLabels = Array.from(new Set(dots.map(d => d.label))).sort();
    const xScale = d3.scaleLinear().domain([0, 23]).range([0, innerWidth]);
    const yScale = d3.scalePoint().domain(yLabels).range([0, innerHeight]).padding(0.5);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(24).tickFormat(d => `${d.toString().padStart(2, '0')}:00`));

    g.append('g').call(d3.axisLeft(yScale));

    const tooltip = d3.select('body')
      .append('div')
      .attr('id', 'dot-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.75)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('display', 'none')
      .style('z-index', 1000);

    const dotsGroup = g.append('g').attr('class', 'dots');

    dotsGroup.selectAll('circle')
      .data(dots)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.hour + d.jitter))
      .attr('cy', d => yScale(d.label))
      .attr('r', 6)
      .attr('fill', d => EVENT_TYPE_COLORS[d.eventType] || EVENT_TYPE_COLORS.Unknown)
      .attr('opacity', 0.6)
      .on('mouseover', function (event, d) {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`)
          .style('display', 'block')
          .html(`🧠 <b>${d.behavior}</b><br/>🕒 ${d.timestamp}`);
      })
      .on('mouseout', () => tooltip.style('display', 'none'))
      .on('click', (event, d) => {
        alert(`🕒 ${d.timestamp}\n📂 ${d.label}\n🧠 Behavior: ${d.behavior}`);
      });

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [innerWidth, innerHeight]])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on("zoom", (event) => {
        const transform = event.transform;
        const newX = transform.rescaleX(xScale);
        xAxis.call(d3.axisBottom(newX).ticks(24).tickFormat(d => `${d.toString().padStart(2, '0')}:00`));
        dotsGroup.selectAll('circle')
          .attr('cx', d => newX(d.hour + d.jitter));
      });

    svg.call(zoom);
  }, [allData, selectedDate, selectedPlatform, selectedBehaviors]);

  useEffect(() => {
    if (!autoPlay || availableDates.length === 0) return;
    const currentIndex = availableDates.indexOf(selectedDate);
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % availableDates.length;
      setSelectedDate(availableDates[nextIndex]);
    }, 1500);
    return () => clearTimeout(timer);
  }, [autoPlay, selectedDate, availableDates]);

  const legendStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px'
  };

  const platforms = ['All', ...Array.from(new Set(allData.map(d => d.platform))).sort()];

  return (
    <div style={{ paddingTop: '40px', position: 'relative' }}>
      <h3 style={{ textAlign: 'center' }}>🔘 D3.js Dot Plot by Data Type</h3>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
        <select value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)} style={{ marginLeft: '10px' }}>
          {platforms.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button onClick={() => setAutoPlay(prev => !prev)} style={{ marginLeft: '10px' }}>
          {autoPlay ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => setShowBehaviorFilter(prev => !prev)} style={{ marginLeft: '10px' }}>
          🎯 Select Behaviors
        </button>
      </div>

      {showBehaviorFilter && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', maxWidth: '800px', background: '#fefefe', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {behaviors.map(behavior => (
              <label key={behavior} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', background: '#f9f9f9' }}>
                <input
                  type="checkbox"
                  checked={selectedBehaviors.includes(behavior)}
                  onChange={(e) => {
                    setSelectedBehaviors(prev => e.target.checked
                      ? [...prev, behavior]
                      : prev.filter(b => b !== behavior));
                  }}
                />
                <span><b>{behavior}</b> <span style={{ color: '#999' }}>({behaviorTypes[behavior] || 'Unknown'})</span></span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={legendStyle}>
        {Object.entries(EVENT_TYPE_COLORS).filter(([key]) => key !== 'Unknown').map(([label, color]) => (
          <div key={label} style={legendItemStyle}>
            <div style={{ width: '12px', height: '12px', backgroundColor: color, borderRadius: '50%' }}></div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DotPlotD3;
