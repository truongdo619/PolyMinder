// BetterVisExample.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';
import axiosInstance from '../../polyminder/src/axiosSetup';
import { GlobalContext } from '../../polyminder/src/GlobalState';

const TreeVisualizationExample: React.FC<{ highlightId: string }> = ({ highlightId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [network, setNetwork] = useState<Network | null>(null);

  const globalContext = useContext(GlobalContext);
  if (!globalContext) {
    throw new Error('GlobalContext is undefined');
  }
  const { documentId, updateId } = globalContext;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const payload = {
          document_id: documentId,
          update_id: updateId,
          id: highlightId,
        };

        const response = await axiosInstance.post(
          `${import.meta.env.VITE_BACKEND_URL}/get-nodes-and-edges`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { nodes, edges, options } = response.data;


        const networkInstance = new Network(containerRef.current!, { nodes: nodes, edges: edges }, options);

        networkInstance.once('stabilizationIterationsDone', () => {
          networkInstance.setOptions({ physics: false });
          networkInstance.fit({ animation: true });
        });

        setNetwork(networkInstance);
      } catch (err) {
        console.error('Error fetching graph data:', err);
      }
    };

    fetchData();

    return () => network?.destroy();
  }, [documentId, updateId, highlightId]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#f8f9fa' }} />
    </div>
  );
};

export default TreeVisualizationExample;
