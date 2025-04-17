import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const SankeyFlowChart = ({ allData }) => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!allData || allData.length === 0) return;

    const labelSet = new Set();
    const transitionCounts = {};
    const nodeTypes = {}; // 각 노드의 단계 저장

    const COLOR_BY_LEVEL = {
      platform: '#4E79A7',
      event_type: '#59A14F',
      data_type: '#F28E2B',
      behavior: '#E15759',
      default: '#AAAAAA'
    };

    allData.forEach(event => {
      const platform = event.platform || 'Unknown Platform';
      const eventType = event.event_type || 'Unknown Event';

      let dataType = 'Unknown Type';
      let behavior = 'Unknown Behavior';

      if (event.content) {
        const parts = event.content.split('_');
        if (parts.length >= 2) {
          dataType = parts.slice(0, -1).join('_');
          behavior = parts[parts.length - 1];
        } else {
          dataType = event.content;
        }
      }

      const path = [platform, eventType, dataType, behavior];
      const pathTypes = ['platform', 'event_type', 'data_type', 'behavior'];

      for (let i = 0; i < path.length; i++) {
        const label = path[i];
        const type = pathTypes[i];
        nodeTypes[label] = type;
        labelSet.add(label);
      }

      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const key = `${from}__${to}`;
        transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      }
    });

    const labels = Array.from(labelSet);
    const labelIndexMap = {};
    labels.forEach((label, i) => {
      labelIndexMap[label] = i;
    });

    const sankeyLinks = Object.entries(transitionCounts).map(([key, value]) => {
      const [from, to] = key.split('__');
      return {
        source: labelIndexMap[from],
        target: labelIndexMap[to],
        value
      };
    });

    const nodeColors = labels.map(label => {
      const type = nodeTypes[label] || 'default';
      return COLOR_BY_LEVEL[type];
    });

    setNodes({ labels, colors: nodeColors });
    setLinks(sankeyLinks);
  }, [allData]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '40px' }}>
      <h3 style={{ textAlign: 'center' }}>Sankey Flow: Platform → Event Type → Data Type → Behavior</h3>
      {Array.isArray(nodes.labels) && links.length > 0 && (
        <Plot
          data={[{
            type: 'sankey',
            orientation: 'h',
            node: {
              pad: 15,
              thickness: 20,
              line: {
                color: 'black',
                width: 0.3
              },
              label: nodes.labels,
              color: nodes.colors
            },
            link: {
              source: links.map(link => link.source),
              target: links.map(link => link.target),
              value: links.map(link => link.value)
            }
          }]}
          layout={{
            title: 'Behavior Flow Sankey Diagram',
            font: { size: 11 },
            height: 500
          }}
          config={{ responsive: true }}
        />
      )}
    </div>
  );
};

export default SankeyFlowChart;