import React from 'react';
import ReactFlow, { Controls, Background, MiniMap, MarkerType, type Node, type Edge } from 'reactflow'; // Changed MarkerType and type for Node/Edge
import 'reactflow/dist/style.css';
import type { CustomNodeData, CustomEdgeData } from '../automata/automatonTypes'; // Changed


interface GraphDisplayProps {
  nodes: Node<CustomNodeData>[];
  edges: Edge<CustomEdgeData>[];
  onNodesChange: (changes: any) => void; // Simplified, React Flow handles specifics
  onEdgesChange: (changes: any) => void; // Simplified
  onConnect: (connection: any) => void;  // For manually adding edges via graph interaction (optional)
}

const GraphDisplay: React.FC<GraphDisplayProps> = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect }) => {
  return (
    <div className="graph-display-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect} // Enable if you want to draw edges manually
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background gap={16} color="#333" />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;