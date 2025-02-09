/**
 * constructor.js
 *  - Implements Constructor Mode for creating edges and nodes via a long-press gesture.
 *  - The user must hold a node (≥ 500 ms) to start edge creation.
 *    Then on mouseup:
 *      - If dropped on a different node => create an edge
 *      - If dropped on empty space => create a new node + edge
 *      - If SHIFT is held => only create an edge if there's a valid drop node
 *  - Immediately prompts the user for labels.
 */

let constructorMode = false;
let edgeCreationActive = false;  // True once the user holds for 500ms
let sourceNode = null;          // The node from which we begin the creation
let pressTimer = null;          // Timer reference for the long-press
let startPos = null;            // Where the user originally pressed

function toggleConstructorMode() {
  constructorMode = !constructorMode;
  const btn = document.getElementById("constructorModeBtn");
  btn.style.backgroundColor = constructorMode ? "green" : "gray";
  btn.textContent = constructorMode ? "Constructor Mode: ON" : "Constructor Mode: OFF";

  if (!cy) return;

  // If constructor mode is on, disable node dragging
  cy.nodes().forEach((node) => {
    if (constructorMode) {
      node.ungrabify();
    } else {
      node.grabify();
    }
  });

  // Reset any partial creation
  edgeCreationActive = false;
  sourceNode = null;
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
}

function setupConstructorEvents() {
  if (!cy) return;

  /**
   * MOUSEDOWN on a node => start long-press timer
   */
  cy.on("mousedown", "node", function (evt) {
    if (!constructorMode) return;

    sourceNode = evt.target;     // The node we clicked
    startPos = evt.position;     // Position where we pressed
    edgeCreationActive = false;  // We haven't yet triggered the 500ms threshold

    // Start the 500ms timer
    pressTimer = setTimeout(() => {
      edgeCreationActive = true;
      // At this point, we've “committed” to creating an edge if the user drags out
    }, 500);
  });

  /**
   * MOUSEMOVE on the node => if user moves too far before 500ms, cancel the long press
   */
  cy.on("mousemove", "node", function (evt) {
    if (!constructorMode || !sourceNode) return;
    if (!pressTimer) return;  // We already canceled or triggered

    const currentPos = evt.position;
    const distMoved = Math.hypot(currentPos.x - startPos.x, currentPos.y - startPos.y);

    // If the user moves more than 10px, we assume they didn't intend a long-press
    if (distMoved > 10) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  /**
   * MOUSEUP anywhere => finalize the gesture
   */
  cy.on("mouseup", function (evt) {
    if (!constructorMode || !sourceNode) return;

    // Cancel any pending timer
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }

    if (!edgeCreationActive) {
      // The user didn't hold for ≥ 500ms => no edge creation
      sourceNode = null;
      return;
    }

    // If we reach here, the user did a 500ms hold on sourceNode
    const shiftHeld = evt.originalEvent.shiftKey;
    const dropTarget = evt.target;   // Could be 'cy' (the background) or a node
    const dropPos = evt.position;

    // Check if we dropped on a node that's different from the source
    if (dropTarget !== cy && dropTarget.isNode() && dropTarget.id() !== sourceNode.id()) {
      // SHIFT or not SHIFT => create an edge from source -> dropTarget
      createEdge(sourceNode, dropTarget);
    } else if (dropTarget === cy) {
      // Dropped on empty space
      if (!shiftHeld) {
        // SHIFT means "force edge only" => but there's no node => do nothing
        // No SHIFT => create a new node + edge
        createNodeAndEdge(sourceNode, dropPos);
      }
    } else {
      // if it's the same node or SHIFT in empty => do nothing
      // e.g. user dropped on the same node or SHIFT + empty => no valid edge
    }

    // Reset everything
    edgeCreationActive = false;
    sourceNode = null;
  });
}

/**
 * createEdge(src, tgt)
 * Create an edge from src -> tgt, then prompt for edge label
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
  updateJsonFromGraph();  // from graph.js

  const label = prompt("Enter label for the new edge:", "");
  if (label) {
    newEdge.data("label", label);
    updateJsonFromGraph();
  }
}

/**
 * createNodeAndEdge(src, pos)
 * Create a new node at pos, then create an edge from src to that new node.
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

  // Prompt for node label
  const nodeLabel = prompt("Enter label for the new node:", "");
  if (nodeLabel) {
    newNode.data("label", nodeLabel);
  }

  // Then create edge
  const newEdge = cy.add({
    data: {
      source: src.id(),
      target: newId,
      label: "",
      edgeColor: newColor,
    },
  });
  // Prompt for edge label
  const edgeLabel = prompt("Enter label for the new edge:", "");
  if (edgeLabel) {
    newEdge.data("label", edgeLabel);
  }
  updateJsonFromGraph();
}

/**
 * generateUniqueNodeId()
 * Creates a random ID for a new node
 */
function generateUniqueNodeId() {
  return "n" + Math.floor(Math.random() * 1000000);
}
