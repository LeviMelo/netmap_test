/**
 * layout.js
 *  - Provides layout configuration objects based on the chosen layout and slider values.
 *  - Applies the selected layout and stores node positions.
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
      // For the preset layout, we retrieve stored positions if available.
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

  // **Step 1: Store the current node positions before applying a new layout.**
  storePositionsInData();

  // If an active layout is already running, stop it.
  if (activeLayout) {
    activeLayout.stop();
    activeLayout = null;
  }

  // Get the selected layout name from the UI.
  const layoutName = document.getElementById("layoutDropdown").value;
  const opts = getLayoutOptions(layoutName);

  // **Step 2: Apply the new layout.**
  activeLayout = cy.layout(opts);
  activeLayout.run();

  // **Step 3: When the layout stops, update stored positions again.**
  activeLayout.on("layoutstop", () => {
    storePositionsInData();
  });
}

function storePositionsInData() {
  // Capture the current positions of all nodes and store them in their data as '_savedPos'.
  cy.nodes().forEach((n) => {
    n.data("_savedPos", {
      x: n.position("x"),
      y: n.position("y"),
    });
  });
}
