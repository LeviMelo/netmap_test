/**
 * layout.js
 *  - Provides layout configuration objects based on the chosen layout and slider values
 *  - Applies the selected layout and stores node positions
 */

let activeLayout = null;

function getLayoutOptions(layoutName) {
  const animate = true;
  const randomize = false;
  const fit = false;

  // Cola-specific parameters
  const repulsion = parseFloat(document.getElementById("nodeRepulsionSlider").value) || 10;
  const edgeLen = parseFloat(document.getElementById("edgeLengthSlider").value) || 50;
  const grav = parseFloat(document.getElementById("gravitySlider").value) || 0.1;
  const infinite = document.getElementById("infiniteToggle").checked;
  const avoidOverlap = document.getElementById("avoidOverlapToggle").checked;
  const edgeSymDiff = parseFloat(document.getElementById("edgeSymDiffSlider").value) || 0.5;
  const edgeJaccard = parseFloat(document.getElementById("edgeJaccardSlider").value) || 0.5;

  // Parameters for Concentric and Breadthfirst layouts
  const layerSpacing = parseFloat(document.getElementById("layerSpacingSlider").value) || 60;

  let options = { name: layoutName, animate, randomize, fit };

  switch (layoutName) {
    case "cola":
      return {
        ...options,
        infinite: infinite, // Use user's toggle for continuous simulation
        nodeSpacing: () => repulsion,
        edgeLength: () => edgeLen,
        gravity: grav,
        avoidOverlap: avoidOverlap,
        edgeSymDiffCostFactor: edgeSymDiff,
        edgeJaccardLengthCostFactor: edgeJaccard,
        nodeDimensionsIncludeLabels: true,
      };

    case "concentric":
      return {
        ...options,
        minNodeSpacing: layerSpacing,
        concentric: (node) => node.degree(),
        levelWidth: (nodes) => Math.max(1, nodes.length / 5),
      };

    case "breadthfirst":
      return {
        ...options,
        spacingFactor: layerSpacing / 50,
        directed: true,
      };

    case "grid":
    case "circle":
      return options;

    case "preset":
      return {
        ...options,
        name: "preset",
        positions: (n) => n.data("_savedPos") || n.position(),
      };

    default:
      return options;
  }
}

function applyLayout() {
  if (!cy) return;
  if (activeLayout) {
    activeLayout.stop();
    activeLayout = null;
  }
  const layoutName = document.getElementById("layoutDropdown").value;
  const opts = getLayoutOptions(layoutName);
  activeLayout = cy.layout(opts);
  activeLayout.run();
  activeLayout.on("layoutstop", () => {
    storePositionsInData();
  });
}

function storePositionsInData() {
  cy.nodes().forEach((n) => {
    n.data("_savedPos", {
      x: n.position("x"),
      y: n.position("y"),
    });
  });
}
