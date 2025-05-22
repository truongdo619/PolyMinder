const initialNodes =  [
    {
      id: '1',
      data: { label: 'POLYMER: SPTES' },
      position: { x: 0, y: 0 },
      className: 'POLYMER',
      sourcePosition: 'right', // edges leaving this node come out of the right side
      targetPosition: 'left',  // edges entering this node come in from the left side
    },
    {
      id: '2',
      data: { label: 'POLYMER: Sulfonated polyarylenethioethersul' },
      position: { x: 250, y: 0 },
      className: 'POLYMER',
      sourcePosition: 'right', // edges leaving this node come out of the right side
      targetPosition: 'left',  // edges entering this node come in from the left side
    },
    {
      id: '3',
      data: { label: 'PROP_NAME: proton conductivity' },
      position: { x: 500, y: 0 },
      className: 'PROP_NAME',
      sourcePosition: 'right', // edges leaving this node come out of the right side
      targetPosition: 'left',  // edges entering this node come in from the left side
    },
    {
      id: '4',
      data: { label: 'PROP_VALUE: at 25C' },
      position: { x: 500, y: 100 },
      className: 'PROP_VALUE',
      sourcePosition: 'right', // edges leaving this node come out of the right side
      targetPosition: 'left',  // edges entering this node come in from the left side
    },
  ];
  
  const initialEdges = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'straight',
      label: "abbrev",
      markerEnd: {
        type: MarkerType.Arrow,
      },
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      type: 'straight',
      label: "has_property",
      markerEnd: {
        type: MarkerType.Arrow,
      },
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      type: 'straight',
      label: "has_value",
      markerEnd: {
        type: MarkerType.Arrow,
      },
    }
  ];