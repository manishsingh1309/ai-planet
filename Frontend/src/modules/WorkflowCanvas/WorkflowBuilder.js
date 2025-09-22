import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { useWorkflowStore } from '../../shared/stores';
import UserQueryNode from './nodes/UserQueryNode';
import KnowledgeBaseNode from './nodes/KnowledgeBaseNode';
import LLMEngineNode from './nodes/LLMEngineNode';
import OutputNode from './nodes/OutputNode';
import './WorkflowBuilder.css';

const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
};

const WorkflowBuilder = ({ onNodeSelect }) => {
  const { 
    nodes: storeNodes, 
    edges: storeEdges, 
    setNodes: setStoreNodes, 
    setEdges: setStoreEdges,
    setSelectedNode,
    addEdge: addStoreEdge,
    isExecuting
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync with store
  React.useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  React.useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  React.useEffect(() => {
    setStoreNodes(nodes);
  }, [nodes, setStoreNodes]);

  React.useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addStoreEdge(newEdge);
    },
    [setEdges, addStoreEdge]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  }, [setSelectedNode, onNodeSelect]);

  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  const proOptions = {
    hideAttribution: true,
  };

  return (
    <div className="workflow-builder">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultViewport={defaultViewport}
        proOptions={proOptions}
        fitView
        attributionPosition="bottom-left"
      >
        <Background 
          color="#374151" 
          gap={20} 
          size={1}
          variant="dots"
        />
        <Controls 
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap 
          nodeColor="#6366f1"
          maskColor="rgba(15, 15, 35, 0.8)"
          position="bottom-left"
        />
        
        <Panel position="top-center">
          <motion.div 
            className="workflow-status"
            animate={{ scale: isExecuting ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1, repeat: isExecuting ? Infinity : 0 }}
          >
            {isExecuting ? (
              <div className="status-executing">
                <div className="status-dot executing"></div>
                Executing Workflow...
              </div>
            ) : nodes.length === 0 ? (
              <div className="status-empty">
                <div className="status-dot empty"></div>
                Drag components from the left panel to build your workflow
              </div>
            ) : (
              <div className="status-ready">
                <div className="status-dot ready"></div>
                Workflow Ready • {nodes.length} Components • {edges.length} Connections
              </div>
            )}
          </motion.div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default WorkflowBuilder;
