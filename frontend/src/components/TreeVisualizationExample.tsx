import React, { useState, useEffect, useContext } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axiosInstance from '../../example/src/axiosSetup'; 

import MyCustomNode from './MyCustomNode'; // Import your custom node component
import { GlobalContext } from '../../example/src/GlobalState'; // if used in your project

interface TreeVisualizationExampleProps {
  highlightId: string;
}

// 1) Our custom node types mapping
const nodeTypes = {
  myCustomNode: MyCustomNode,
};

// 2) A custom FloatingEdge component for rendering edges with labels.
//    This is similar to the "simple-floating-edges" example from React Flow docs.
function FloatingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const markerId = `arrowhead-${id}`; // unique for each edge

  return (
    <g>
      {/* Define a bigger custom arrow marker */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#777" />
        </marker>
      </defs>

      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{ stroke: '#777', strokeWidth: 1 }}
      />

      {label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12 }}
            startOffset="50%"
            textAnchor="middle"
          >
            {label}
          </textPath>
        </text>
      )}
    </g>
  );
}


// 3) Register that custom edge under an edgeTypes object
const edgeTypes = {
  floating: FloatingEdge,
};



function TreeVisualizationExample({ highlightId }: TreeVisualizationExampleProps) {
  // If you're using a global context:
  const globalContext = useContext(GlobalContext);
  if (!globalContext) {
    throw new Error("GlobalContext is undefined");
  }
  const { documentId, updateId } = globalContext;
  
  const [fetchedNodes, setFetchedNodes] = useState<any[]>([]);
  const [fetchedEdges, setFetchedEdges] = useState<any[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState(fetchedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fetchedEdges);

  useEffect(() => {
    const fetchGraphData = async () => {
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
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const { initialNodes, initialEdges } = response.data;

        // --- Transform the edges to include a markerEnd arrow and our custom edge type
        const updatedEdges = (initialEdges || []).map((edge: any) => ({
          ...edge,
          // make sure we're using the floating edge so that our custom Edge component is used
          type: 'floating',
          // add the arrow marker
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }));

        
        setFetchedNodes(initialNodes || []);
        setFetchedEdges(updatedEdges);
        setNodes(initialNodes || []);
        setEdges(updatedEdges);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    fetchGraphData();
  }, [documentId, updateId, highlightId, setNodes, setEdges]);

  // // Manage nodes/edges in local state
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}  // register our custom node
        edgeTypes={edgeTypes}  // register our custom floating edge
        fitView
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
        {/* <MiniMap /> optionally */}
      </ReactFlow>
    </div>
  );
}

export default TreeVisualizationExample;
