/**
 * constructor.js
 * 
 * Implements Constructor Mode for graph editing.
 * 
 * Behavior in Constructor Mode:
 * - All nodes are frozen (un‑draggable) by default.
 * - If a user clicks on a node WITHOUT holding Shift, the system immediately
 *   enters edge creation mode from that node:
 *     • The initial click position is recorded.
 *     • If the mouse moves more than 10px before release, edge creation is cancelled.
 *     • On mouseup:
 *         – If released over a different node, an edge is created from the source node to that node.
 *         – If released on the background, a new node is created at that position and an edge is drawn from the source.
 * - If a user clicks on a node WHILE holding Shift, the node is temporarily enabled for dragging.
 *   When the mouse is released the node is frozen again.
 */

let constructorMode = false;
let sourceNode = null;    // The node from which edge creation is initiated.
let startPos = null;      // Position where the mouse was pressed down.

function toggleConstructorMode() {
  constructorMode = !constructorMode;
  const btn = document.getElementById("constructorModeBtn");
  btn.style.backgroundColor = constructorMode ? "green" : "gray";
  btn.textContent = constructorMode ? "Constructor Mode: ON" : "Constructor Mode: OFF";

  if (!cy) return;

  // In Constructor Mode, freeze all nodes (disable dragging).
  if (constructorMode) {
    cy.nodes().forEach((node) => {
      node.ungrabify();
    });
  } else {
    // When not in Constructor Mode, enable dragging normally.
    cy.nodes().forEach((node) => {
      node.grabify();
    });
  }

  // Clear any pending edge creation.
  sourceNode = null;
}

function setupConstructorEvents() {
  if (!cy) return;

  // MOUSEDOWN on a node:
  // - If Shift is pressed, enable dragging for that node.
  // - Otherwise, record the node and position to initiate edge creation.
  cy.on("mousedown", "node", function (evt) {
    if (!constructorMode) return;
    const eventObj = evt.originalEvent;
    if (eventObj.shiftKey) {
      // Enable dragging: temporarily allow movement.
      evt.target.grabify();
      // Do not initiate edge creation.
      sourceNode = null;
      return;
    }
    // Start edge creation process.
    sourceNode = evt.target;
    startPos = evt.position;
  });

  // MOUSEMOVE on a node:
  // If not dragging (i.e. no Shift held), cancel edge creation if the user moves too far.
  cy.on("mousemove", "node", function (evt) {
    if (!constructorMode || !sourceNode) return;
    if (evt.originalEvent.shiftKey) return; // Ignore if in dragging mode.
    const currentPos = evt.position;
    const distance = Math.hypot(currentPos.x - startPos.x, currentPos.y - startPos.y);
    if (distance > 10) {
      // User moved too far; cancel edge creation.
      sourceNode = null;
    }
  });

  // MOUSEUP anywhere:
  // Finalize the gesture by either creating an edge (or node+edge) if not canceled,
  // or, if Shift was held, re‑freeze the node after dragging.
  cy.on("mouseup", function (evt) {
    if (!constructorMode) return;
    const eventObj = evt.originalEvent;
    if (eventObj.shiftKey) {
      // This was a drag operation. If the target is a node, re‑freeze it.
      if (evt.target && evt.target.isNode()) {
        evt.target.ungrabify();
      }
      // Do not perform any edge or node creation.
      sourceNode = null;
      return;
    }
    if (!sourceNode) return; // Edge creation was cancelled due to movement.
    const dropTarget = evt.target;
    const dropPos = evt.position;

    // If dropped on a different node, create an edge.
    if (dropTarget !== cy && dropTarget.isNode() && dropTarget.id() !== sourceNode.id()) {
      createEdge(sourceNode, dropTarget);
    }
    // If dropped on blank space, create a new node and an edge.
    else if (dropTarget === cy) {
      createNodeAndEdge(sourceNode, dropPos);
    }
    // Otherwise (e.g. dropped on the same node), do nothing.
    sourceNode = null; // Reset for the next gesture.
  });
}

/**
 * createEdge(src, tgt)
 * Creates an edge from src → tgt and prompts for its label.
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
  updateJsonFromGraph();  // (Assumes function from graph.js)

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

  // Ensure the new node is frozen (un‑draggable) in Constructor Mode.
  if (constructorMode) {
    newNode.ungrabify();
  }

  const nodeLabel = prompt("Enter label for the new node:", "");
  if (nodeLabel) {
    newNode.data("label", nodeLabel);
  }

  const newEdge = cy.add({
    data: {
      source: src.id(),
      target: newId,
      label: "",
      edgeColor: newColor,
    },
  });
  const edgeLabel = prompt("Enter label for the new edge:", "");
  if (edgeLabel) {
    newEdge.data("label", edgeLabel);
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
