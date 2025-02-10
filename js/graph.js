/**
 * graph.js
 *  - Initializes Cytoscape with elements parsed from JSON
 *  - Updates the JSON view after changes
 */

let cy = null; // Global Cytoscape instance

function buildElementsFromJSON(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    alert("Invalid JSON: " + e.message);
    return null;
  }
  const elements = [];

  // Process nodes (object format or array format)
  if (data.nodes && typeof data.nodes === "object" && !Array.isArray(data.nodes)) {
    for (let id in data.nodes) {
      let n = data.nodes[id];
      elements.push({
        data: {
          id: id,
          label: n.label || id,
          color: n.color || "#888",
        },
      });
    }
  } else if (Array.isArray(data.nodes)) {
    data.nodes.forEach((n) => {
      elements.push({
        data: {
          id: n.id,
          label: n.label || n.id,
          color: n.color || "#888",
        },
      });
    });
  }

  // Process edges
  if (Array.isArray(data.edges)) {
    data.edges.forEach((e) => {
      let source = e.source || e.from;
      let target = e.target || e.to;
      let edgeCol = "#ccc";
      if (data.nodes && data.nodes[source] && data.nodes[source].color) {
        edgeCol = data.nodes[source].color;
      }
      elements.push({
        data: {
          source: source,
          target: target,
          label: e.label || "",
          edgeColor: edgeCol,
        },
      });
    });
  }
  return elements;
}

function initializeCytoscape(elements) {
  if (cy) {
    cy.destroy();
  }
  cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elements,
    style: getCytoscapeStyle(), // Assume getCytoscapeStyle() is defined in ui.js
    minZoom: 0.1,
    maxZoom: 10,
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  // By default, enable dragging (this can be overridden by layout logic)
  cy.nodes().forEach((n) => n.grabify());
}

function updateJsonFromGraph() {
  if (!cy) return;
  const data = { nodes: {}, edges: [] };
  cy.nodes().forEach((node) => {
    data.nodes[node.id()] = {
      label: node.data("label"),
      color: node.data("color"),
    };
  });
  cy.edges().forEach((edge) => {
    data.edges.push({
      from: edge.source().id(),
      to: edge.target().id(),
      label: edge.data("label"),
    });
  });
  document.getElementById("jsonInput").value = JSON.stringify(data, null, 2);
}
