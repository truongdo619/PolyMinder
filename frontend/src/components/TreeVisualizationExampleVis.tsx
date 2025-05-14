// BetterVisExample.tsx
import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';

const HardCodedVisExample : React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* ---------- nodes & edges ---------- */
    const nodes = new DataSet([
      {
        id: 1,
        label: 'POLYMER: SPTES',
        shape: 'box',
        x: 0,
        y: 0,
        color: { background: '#e7f5ff', border: '#228be6' },
        font : { size: 18, bold: true },
      },
      { id: 2, label: 'PROP_NAME: volume packing density', shape: 'box' },
      { id: 3, label: 'PROP_NAME: ionic domain radius', shape: 'box' },
      {
        id: 4,
        label: 'Grandchild',
        shape: 'box',
        color: { background: '#fff3bf', border: '#fab005' },
      },
    ]);

    const edges = new DataSet([
      { from: 1, to: 2, label: 'has_property', arrows: 'to' },
      { from: 1, to: 3, label: 'has_property', arrows: 'to' },
      { from: 2, to: 4, label: 'edge‑C', arrows: 'to' },
      { from: 4, to: 1, label: 'edge‑D', arrows: 'to' }
    ]);

    /* ---------- options tuned for a neat, centred view ---------- */
    const options = {
      layout: { improvedLayout: true },      // vis‑network’s heuristic pre‑layout
      physics: {
        enabled: true,                       // run once, then we’ll disable it
        solver : 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity      : 0.005,
          springLength        : 140,
          springConstant      : 0.08,
          damping             : 0.4,
          avoidOverlap        : 1,
        },
        stabilization: { iterations: 200 },  // enough to settle the graph
      },
      interaction: {
        hover    : true,
        zoomView : true,
        dragView : true,
        dragNodes: true,
      },
      nodes: {
        shape: 'box',
        borderRadius: 6,
        font: { face: 'Roboto', size: 14 },
        color: {
          border   : '#2B7CE9',
          background: '#97C2FC',
          highlight : { border: '#2B7CE9', background: '#D2E5FF' },
          hover     : { border: '#2B7CE9', background: '#D2E5FF' },
        },
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.7 } },
        smooth: { type: 'cubicBezier', roundness: 0.4 },
        color : { color: '#848484', highlight: '#343434', hover: '#343434' },
        font  : { align: 'middle' },
      }
    };

    /* ---------- create & tidy‑up ---------- */
    const network = new Network(containerRef.current!, { nodes, edges }, options);

    /* After stabilization, freeze the layout so nothing keeps drifting */
    network.once('stabilizationIterationsDone', () => {
      network.setOptions({ physics: false });
      network.fit({ nodes: [1], animation: true }); // centre the root & zoom nicely
    });

    return () => network.destroy();
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#f8f9fa' }} />
    </div>
  );
};

export default HardCodedVisExample ;
