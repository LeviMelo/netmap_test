/**
 * constructor.js
 * 
 * Implements Constructor Mode for graph editing.
 * 
 * Behavior in Constructor Mode:
 * - All nodes are frozen (un‑draggable) by default.
 * - In Edge Mode (default), dragging from a node initiates edge creation:
 *     • The initial click position is recorded.
 *     • (We no longer cancel based on movement; a release over a node creates an edge.)
 *     • On mouseup:
 *         – If released over a different node, an edge is created from the source node to that node.
 *         – If released on the background, a new node is created at that position and an edge is drawn from the source.
 * - Holding the Control key enables Drag Mode (nodes become draggable).
 * - Holding the Shift key enables Delete Mode (clicking a node or edge deletes it).
 * - Double-clicking in empty space creates a new node.
 * - Double-clicking on a node or edge (when Delete Mode is not active) allows editing of its label.
 */

let constructorMode = false;
// Mode variables are controlled by key holds:
let dragMode = false;    // Active while Control is held.
let deleteMode = false;  // Active while Shift is held.
// Edge mode is active when neither drag nor delete mode is active.
let edgeMode = true;     // Computed as: !dragMode && !deleteMode

let sourceNode = null;   // The node from which edge creation is initiated.
let startPos = null;     // Position where the mouse was pressed down.

/**
 * Toggles Constructor Mode.
 * When ON, nodes are frozen (unless Control is held).
 */
function toggleConstructorMode() {
  constructorMode = !constructorMode;
  const btn = document.getElementById("constructorModeBtn");
  btn.style.backgroundColor = constructorMode ? "green" : "gray";
  btn.textContent = constructorMode ? "Constructor Mode: ON" : "Constructor Mode: OFF";

  if (!cy) return;

  if (constructorMode) {
    // Freeze all nodes by default.
    cy.nodes().forEach((node) => node.ungrabify());
  } else {
    // Enable normal dragging.
    cy.nodes().forEach((node) => node.grabify());
  }
  
  // Clear any pending edge creation.
  sourceNode = null;
}

/**
 * Sets up the mouse event handlers for Constructor Mode.
 * Their behavior depends on the mode variables which are controlled by key holds.
 */
function setupConstructorEvents() {
  if (!cy) return;

  // MOUSEDOWN on a node:
  // - If Delete Mode is active, immediately delete the element.
  // - If Drag Mode is active, let Cytoscape’s built‑in dragging work.
  // - Otherwise (Edge Mode), record the source node and starting position.
  cy.on("mousedown", "node", function(evt) {
    if (!constructorMode) return;
    if (deleteMode) {
      evt.target.remove();
      updateJsonFromGraph();
      return;
    }
    if (dragMode) {
      // In drag mode, do nothing special here.
      return;
    }
    // In edge mode, start edge creation.
    sourceNode = evt.target;
    startPos = evt.position;
  });

  // MOUSEMOVE on a node:
  // (We no longer cancel edge creation based on movement, allowing natural dragging.)
  cy.on("mousemove", "node", function(evt) {
    if (!constructorMode || !sourceNode) return;
    if (!edgeMode) return;
    // No cancellation based on distance.
  });

  // MOUSEUP anywhere:
  // Finalize edge creation if applicable.
  cy.on("mouseup", function(evt) {
    if (!constructorMode) return;
    if (dragMode || !edgeMode) {
      sourceNode = null;
      return;
    }
    if (!sourceNode) return;
    const dropTarget = evt.target;
    const dropPos = evt.position;

    // If dropped on a different node (and not the source), create an edge.
    if (dropTarget !== cy && dropTarget.isNode() && dropTarget.id() !== sourceNode.id()) {
      createEdge(sourceNode, dropTarget);
    }
    // If dropped on the background, create a new node and an edge.
    else if (dropTarget === cy) {
      createNodeAndEdge(sourceNode, dropPos);
    }
    sourceNode = null;
  });

  // DOUBLE-CLICK HANDLERS

  // Double-click on the background creates a new node.
  cy.on("tap", function(evt) {
    if (!constructorMode) return;
    if (evt.target === cy && evt.originalEvent.detail === 2) {
      createNewNode(evt.position);
    }
  });

  // Double-click on a node or edge always edits its label (deletion is handled via single tap when Shift is held).
  cy.on("tap", "node, edge", function(evt) {
    if (!constructorMode) return;
    if (evt.originalEvent.detail !== 2) return;
    if (deleteMode) return;
    const newLabel = prompt("Edit label:", evt.target.data("label"));
    if (newLabel !== null) {
      evt.target.data("label", newLabel);
      updateJsonFromGraph();
    }
  });

  // In Delete Mode, a single tap on a node or edge deletes it.
  cy.on("tap", "node, edge", function(evt) {
    if (!constructorMode) return;
    if (deleteMode && evt.originalEvent.detail === 1) {
      evt.target.remove();
      updateJsonFromGraph();
    }
  });
}

/**
 * createEdge(src, tgt)
 * Creates an edge from src to tgt and prompts for its label.
 */
function createEdge(src, tgt) {
  const newEdge = cy.add({
    data: {
      source: src.id(),
      target: tgt.id(),
      label: "",
      edgeColor: src.data("color") || "#ccc",
    },
  });
  updateJsonFromGraph();

  const label = prompt("Enter label for the new edge:", "");
  if (label) {
    newEdge.data("label", label);
    updateJsonFromGraph();
  }
}

/**
 * createNodeAndEdge(src, pos)
 * Creates a new node at position pos, then creates an edge from src to the new node.
 */
function createNodeAndEdge(src, pos) {
  const newId = generateUniqueNodeId();
  const newColor = src.data("color") || "#888";

  const newNode = cy.add({
    group: "nodes",
    data: {
      id: newId,
      label: "",
      color: newColor,
    },
    position: { x: pos.x, y: pos.y },
  });

  if (constructorMode && !dragMode) {
    newNode.ungrabify();
  }

  // First, create the edge connecting src to the new node.
  const newEdge = cy.add({
    data: {
      source: src.id(),
      target: newId,
      label: "",
      edgeColor: newColor,
    },
  });

  // Prompt first for the edge label.
  const edgeLabel = prompt("Enter label for the new edge:", "");
  if (edgeLabel) {
    newEdge.data("label", edgeLabel);
  }

  // Then prompt for the new node's label.
  const nodeLabel = prompt("Enter label for the new node:", "");
  if (nodeLabel) {
    newNode.data("label", nodeLabel);
  }
  updateJsonFromGraph();
}


/**
 * createNewNode(pos)
 * Creates a new standalone node at pos and prompts for its label.
 */
function createNewNode(pos) {
  const newId = generateUniqueNodeId();
  const defaultColor = "#888";
  const newNode = cy.add({
    group: "nodes",
    data: {
      id: newId,
      label: "",
      color: defaultColor,
    },
    position: { x: pos.x, y: pos.y },
  });

  if (constructorMode && !dragMode) {
    newNode.ungrabify();
  }

  const nodeLabel = prompt("Enter label for the new node:", "");
  if (nodeLabel) {
    newNode.data("label", nodeLabel);
  }
  updateJsonFromGraph();
}

/**
 * generateUniqueNodeId()
 * Generates a random unique ID for a new node.
 */
function generateUniqueNodeId() {
  return "n" + Math.floor(Math.random() * 1000000);
}
