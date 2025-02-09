document.addEventListener("DOMContentLoaded", function () {
    console.log("[DEBUG] DOM loaded");
  
    // Register Cytoscape-Cola
    if (typeof cytoscapeCola !== "undefined") {
      cytoscape.use(cytoscapeCola);
    } else {
      console.error("[ERROR] cytoscape-cola is not loaded.");
    }
  
    let cy;                  // Global Cytoscape instance
    let physicsOn = false;   // Is Cola-based physics currently ON?
    let activeLayout = null; // Reference to the running layout object
  
    // DOM references
    const jsonInput = document.getElementById("jsonInput");
    const loadGraphBtn = document.getElementById("loadGraphBtn");
    const resetZoomBtn = document.getElementById("resetZoomBtn");
    const exportPngBtn = document.getElementById("exportPngBtn");
    const layoutDropdown = document.getElementById("layoutDropdown");
    const physicsToggleBtn = document.getElementById("physicsToggle");
  
    // Physics sliders
    const physicsParamsDiv = document.getElementById("physicsParams");
    const nodeRepulsionSlider = document.getElementById("nodeRepulsionSlider");
    const edgeLengthSlider = document.getElementById("edgeLengthSlider");
    const gravitySlider = document.getElementById("gravitySlider");
  
    const nodeRepulsionValue = document.getElementById("nodeRepulsionValue");
    const edgeLengthValue = document.getElementById("edgeLengthValue");
    const gravityValue = document.getElementById("gravityValue");
  
    // Aesthetic sliders
    const nodeFontSlider = document.getElementById("nodeFontSlider");
    const nodeFontValue = document.getElementById("nodeFontValue");
    const nodeOutlineWidthSlider = document.getElementById("nodeOutlineWidthSlider");
    const nodeOutlineWidthValue = document.getElementById("nodeOutlineWidthValue");
    const nodePaddingSlider = document.getElementById("nodePaddingSlider");
    const nodePaddingValue = document.getElementById("nodePaddingValue");
  
    const edgeWidthSlider = document.getElementById("edgeWidthSlider");
    const edgeWidthValue = document.getElementById("edgeWidthValue");
    const edgeFontSlider = document.getElementById("edgeFontSlider");
    const edgeFontValue = document.getElementById("edgeFontValue");
    const edgeOutlineWidthSlider = document.getElementById("edgeOutlineWidthSlider");
    const edgeOutlineWidthValue = document.getElementById("edgeOutlineWidthValue");
  
    /**
     * Helper: darken a hex color by a factor (0~1).
     * Example: darkenColor('#377eb8', 0.5) => ~'#1b3f5c'
     */
    function darkenColor(hex, factor = 0.5) {
      if (!hex || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
        return "#333"; // fallback
      }
      // expand short form #abc => #aabbcc
      if (hex.length === 4) {
        hex =
          "#" +
          hex[1] + hex[1] +
          hex[2] + hex[2] +
          hex[3] + hex[3];
      }
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
  
      r = Math.floor(r * factor);
      g = Math.floor(g * factor);
      b = Math.floor(b * factor);
  
      r = Math.min(Math.max(r, 0), 255);
      g = Math.min(Math.max(g, 0), 255);
      b = Math.min(Math.max(b, 0), 255);
  
      const rr = r.toString(16).padStart(2, "0");
      const gg = g.toString(16).padStart(2, "0");
      const bb = b.toString(16).padStart(2, "0");
      return "#" + rr + gg + bb;
    }
  
    /**
     * Store the current node positions in node.data('_savedPos') so we can reapply them later.
     */
    function storePositions() {
      if (!cy) return;
      cy.nodes().forEach((n) => {
        n.data("_savedPos", {
          x: n.position("x"),
          y: n.position("y"),
        });
      });
    }
  
    /**
     * Our Cytoscape style using user’s aesthetic parameters.
     * We also factor in new sliders for node & edge label outline width.
     */
    function getCytoscapeStyle() {
      const nodeFSize = nodeFontSlider.value + "px";
      const nOutlineW = parseFloat(nodeOutlineWidthSlider.value);
      const nodePad = nodePaddingSlider.value + "px";
  
      const eWidth = parseFloat(edgeWidthSlider.value);
      const eFontSize = edgeFontSlider.value + "px";
      const eOutlineW = parseFloat(edgeOutlineWidthSlider.value);
  
      return [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "label": "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "color": "#fff",
  
            // Node label font
            "font-size": nodeFSize,
            "text-outline-width": nOutlineW,
            "text-outline-color": "#555",
            "text-wrap": "wrap",
  
            // Rectangular nodes sized to label + padding
            "width": "label",
            "height": "label",
            "shape": "roundrectangle",
            "padding": nodePad,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "unbundled-bezier",
            "target-arrow-shape": "triangle",
            "line-color": "data(edgeColor)",
            "target-arrow-color": "data(edgeColor)",
  
            // Edge label
            "label": "data(label)",
            "font-size": eFontSize,
            "color": "#fff",
            "text-rotation": "autorotate",
            "width": eWidth,
  
            // Outline is a darker version of the edge's color
            "text-outline-width": eOutlineW,
            "text-outline-color": (ele) => {
              const c = ele.data("edgeColor") || "#ccc";
              return darkenColor(c, 0.5);
            },
            "text-outline-opacity": 1,
            "text-background-opacity": 0, // no white box
          },
        },
      ];
    }
  
    /**
     * Build a static layout config (circle, grid, etc.) from the current user selection.
     * We always do randomize:false, fit:false to avoid forcibly resetting positions or zoom.
     */
    function getStaticLayoutOptions(name) {
      // Some static layouts have unique config, but typically we do:
      let opts = {
        name,
        animate: true,
        randomize: false,
        fit: false,
        animationDuration: 800,
      };
  
      // If it's "preset," we apply the saved positions
      if (name === "preset") {
        opts.positions = (n) => {
          return n.data("_savedPos") || n.position(); 
        };
      }
  
      return opts;
    }
  
    /**
     * Build the Cola layout config for "physics on."
     * We do infinite:true so it continues until user stops it,
     * and randomize:false so it uses current positions as a starting point.
     */
    function getColaLayoutOptions() {
      const repulsion = parseFloat(nodeRepulsionSlider.value) || 10;
      const eLen = parseFloat(edgeLengthSlider.value) || 50;
      const grav = parseFloat(gravitySlider.value) || 0.1;
  
      return {
        name: "cola",
        animate: true,
        randomize: false,
        fit: false,
        infinite: true,
        nodeSpacing: () => repulsion,
        edgeLength: () => eLen,
        gravity: grav,
  
        // Attempt to reduce overlap
        avoidOverlap: true,
        handleDisconnected: true,
        edgeSymDiffCostFactor: 0.5,
        edgeJaccardLengthCostFactor: 0.5,
  
        nodeDimensionsIncludeLabels: true,
        unconstrIter: 200,
        userConstIter: 100,
        allConstIter: 100,
      };
    }
  
    /**
     * Stop any currently active layout, then run a new layout based on physicsOn or user-chosen layout.
     * We do not forcibly run a new layout when turning OFF physics, so we keep final positions.
     * But we do run a new layout if toggling physics ON or if the user changes the layout dropdown.
     *
     * After the layout finishes, we storePositions() so we preserve final positions for future usage.
     */
    function applyLayout(layoutNameIfForced) {
      if (!cy) return;
  
      // Stop old layout if any
      if (activeLayout) {
        activeLayout.stop();
        activeLayout = null;
      }
  
      // Decide layout name
      let layoutOpts;
      if (layoutNameIfForced) {
        // forced (i.e. user picks a new layout)
        layoutOpts = getStaticLayoutOptions(layoutNameIfForced);
      } else if (physicsOn) {
        // user just toggled physics ON => run Cola
        layoutOpts = getColaLayoutOptions();
      } else {
        // user toggled physics OFF => do nothing automatically
        // (We do not run a static layout here so we keep final physics positions)
        // If we want a static layout after turning physics off, user must choose from dropdown.
        return;
      }
  
      activeLayout = cy.layout(layoutOpts);
      // After layout finishes, store final positions
      activeLayout.run().on("layoutstop", () => {
        storePositions();
      });
    }
  
    /**
     * Build elements from JSON, storing node color & label, plus edgeColor from source node.
     */
    function buildElementsFromJSON(jsonText) {
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (e) {
        alert("Invalid JSON: " + e.message);
        return null;
      }
  
      const elements = [];
      // Process nodes
      if (data.nodes && typeof data.nodes === "object") {
        Object.keys(data.nodes).forEach((id) => {
          let n = data.nodes[id];
          elements.push({
            data: {
              id,
              label: n.label || id,
              color: n.color || "#888",
            },
          });
        });
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
              source,
              target,
              label: e.label || "",
              edgeColor: edgeCol,
            },
          });
        });
      }
  
      return elements;
    }
  
    /**
     * Initialize Cytoscape with the given elements.  
     * We do not run any layout here, we only set up the graph + styling.
     */
    function initializeCytoscape(elements) {
      if (cy) cy.destroy(); // destroy old instance
  
      cy = cytoscape({
        container: document.getElementById("cy"),
        elements,
        style: getCytoscapeStyle(),
        minZoom: 0.1,
        maxZoom: 10,
        zoom: 1,
        pan: { x: 0, y: 0 },
      });
  
      // Enable node dragging
      cy.nodes().forEach((n) => n.grabify());
  
      // Interactive: drag from one node to another => add new edge
      let connectionSource = null;
      cy.on("tapstart", "node", (evt) => {
        connectionSource = evt.target;
      });
      cy.on("tapend", "node", (evt) => {
        let target = evt.target;
        if (connectionSource && connectionSource.id() !== target.id()) {
          // add a new edge
          const srcCol = connectionSource.data("color") || "#ccc";
          cy.add({
            data: {
              source: connectionSource.id(),
              target: target.id(),
              label: connectionSource.id() + " → " + target.id(),
              edgeColor: srcCol,
            },
          });
          updateJsonFromGraph();
        }
        connectionSource = null;
      });
    }
  
    /**
     * Update the JSON textarea to reflect the current graph.
     */
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
  
      jsonInput.value = JSON.stringify(data, null, 2);
    }
  
    /**
     * Show/hide the physics sliders depending on physicsOn.
     */
    function setPhysicsParamsVisibility() {
      physicsParamsDiv.style.display = physicsOn ? "block" : "none";
    }
  
    // ---- EVENT LISTENERS ----
  
    // LOAD GRAPH
    loadGraphBtn.addEventListener("click", function () {
      const elements = buildElementsFromJSON(jsonInput.value);
      if (elements) {
        initializeCytoscape(elements);
        // Start with physics OFF by default
        physicsOn = false;
        physicsToggleBtn.style.backgroundColor = "red";
        physicsToggleBtn.textContent = "Physics (Cola) OFF";
        setPhysicsParamsVisibility();
  
        // We do a single static layout based on the dropdown
        // so the graph isn't all stacked up if user has e.g. 20 nodes
        applyLayout(layoutDropdown.value);
      }
    });
  
    // TOGGLE PHYSICS
    physicsToggleBtn.addEventListener("click", function () {
      if (!cy) {
        alert("Load a graph first!");
        return;
      }
      physicsOn = !physicsOn;
      if (physicsOn) {
        physicsToggleBtn.style.backgroundColor = "green";
        physicsToggleBtn.textContent = "Physics (Cola) ON";
        // Start Cola from current positions
        applyLayout(); // => runs getColaLayoutOptions
      } else {
        physicsToggleBtn.style.backgroundColor = "red";
        physicsToggleBtn.textContent = "Physics (Cola) OFF";
        // Stop the infinite layout + store positions, no new layout
        if (activeLayout) {
          activeLayout.stop();
          activeLayout = null;
        }
        storePositions();
      }
      setPhysicsParamsVisibility();
    });
  
    // LAYOUT DROPDOWN => user picks a new static layout
    layoutDropdown.addEventListener("change", function () {
      if (!cy) return;
      // If physics was on, turn it off to avoid collisions
      if (physicsOn) {
        physicsOn = false;
        physicsToggleBtn.style.backgroundColor = "red";
        physicsToggleBtn.textContent = "Physics (Cola) OFF";
        setPhysicsParamsVisibility();
        // Stop the infinite layout
        if (activeLayout) {
          activeLayout.stop();
          activeLayout = null;
        }
        storePositions();
      }
      // Now apply the chosen static layout from the final positions
      applyLayout(layoutDropdown.value);
    });
  
    // PHYSICS SLIDERS => re-run Cola only if physics is on
    nodeRepulsionSlider.addEventListener("input", function () {
      nodeRepulsionValue.textContent = nodeRepulsionSlider.value;
      if (physicsOn) applyLayout();
    });
    edgeLengthSlider.addEventListener("input", function () {
      edgeLengthValue.textContent = edgeLengthSlider.value;
      if (physicsOn) applyLayout();
    });
    gravitySlider.addEventListener("input", function () {
      gravityValue.textContent = gravitySlider.value;
      if (physicsOn) applyLayout();
    });
  
    // Aesthetic sliders => restyle instantly
    nodeFontSlider.addEventListener("input", function () {
      nodeFontValue.textContent = nodeFontSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
    nodeOutlineWidthSlider.addEventListener("input", function () {
      nodeOutlineWidthValue.textContent = nodeOutlineWidthSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
    nodePaddingSlider.addEventListener("input", function () {
      nodePaddingValue.textContent = nodePaddingSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
  
    edgeWidthSlider.addEventListener("input", function () {
      edgeWidthValue.textContent = edgeWidthSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
    edgeFontSlider.addEventListener("input", function () {
      edgeFontValue.textContent = edgeFontSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
    edgeOutlineWidthSlider.addEventListener("input", function () {
      edgeOutlineWidthValue.textContent = edgeOutlineWidthSlider.value;
      if (cy) cy.style(getCytoscapeStyle());
    });
  
    // RESET ZOOM
    resetZoomBtn.addEventListener("click", function () {
      if (!cy) return;
      cy.fit();
    });
  
    // EXPORT PNG
    exportPngBtn.addEventListener("click", function () {
      if (!cy) {
        alert("Graph not loaded!");
        return;
      }
      const pngData = cy.png({ full: true });
      const link = document.createElement("a");
      link.href = pngData;
      link.download = "concept_map.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  
    // AUTO-LOAD the default JSON at startup
    const initialElements = buildElementsFromJSON(jsonInput.value);
    if (initialElements) {
      initializeCytoscape(initialElements);
      physicsOn = false;
      physicsToggleBtn.style.backgroundColor = "red";
      physicsToggleBtn.textContent = "Physics (Cola) OFF";
      setPhysicsParamsVisibility();
  
      // Apply the default dropdown layout (preset) so they don't stack
      applyLayout(layoutDropdown.value);
    }
  });
  