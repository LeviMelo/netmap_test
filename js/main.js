/**
 * main.js
 *  - Entry point that wires up all UI event listeners, initializes the graph, and coordinates interactions.
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("[DEBUG] DOM Loaded.");
  
    const loadGraphBtn = document.getElementById("loadGraphBtn");
    const resetZoomBtn = document.getElementById("resetZoomBtn");
    const exportPngBtn = document.getElementById("exportPngBtn");
    const layoutDropdown = document.getElementById("layoutDropdown");
    const constructorModeBtn = document.getElementById("constructorModeBtn");
  
    // Load Graph button
    loadGraphBtn.addEventListener("click", function () {
      const jsonText = document.getElementById("jsonInput").value;
      const elements = buildElementsFromJSON(jsonText);
      if (elements) {
        initializeCytoscape(elements);
        updateLayoutParamUI(layoutDropdown.value);
        applyLayout();
        setupConstructorEvents();
      }
    });
  
    // Layout dropdown change
    layoutDropdown.addEventListener("change", function () {
      updateLayoutParamUI(layoutDropdown.value);
      applyLayout();
    });
  
    // Setup layout parameter slider events for Cola parameters.
    const nodeRepulsionSlider = document.getElementById("nodeRepulsionSlider");
    const edgeLengthSlider = document.getElementById("edgeLengthSlider");
    const gravitySlider = document.getElementById("gravitySlider");
    const infiniteToggle = document.getElementById("infiniteToggle");
    const avoidOverlapToggle = document.getElementById("avoidOverlapToggle");
    const edgeSymDiffSlider = document.getElementById("edgeSymDiffSlider");
    const edgeJaccardSlider = document.getElementById("edgeJaccardSlider");
    const layerSpacingSlider = document.getElementById("layerSpacingSlider");
  
    function refresh(id, val) {
      document.getElementById(id).textContent = val;
    }
  
    nodeRepulsionSlider.addEventListener("input", function () {
      refresh("nodeRepulsionValue", nodeRepulsionSlider.value);
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    edgeLengthSlider.addEventListener("input", function () {
      refresh("edgeLengthValue", edgeLengthSlider.value);
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    gravitySlider.addEventListener("input", function () {
      refresh("gravityValue", gravitySlider.value);
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    infiniteToggle.addEventListener("change", function () {
      refresh("infiniteValue", infiniteToggle.checked ? "ON" : "OFF");
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    avoidOverlapToggle.addEventListener("change", function () {
      refresh("avoidOverlapValue", avoidOverlapToggle.checked ? "ON" : "OFF");
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    edgeSymDiffSlider.addEventListener("input", function () {
      refresh("edgeSymDiffValue", edgeSymDiffSlider.value);
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    edgeJaccardSlider.addEventListener("input", function () {
      refresh("edgeJaccardValue", edgeJaccardSlider.value);
      if (layoutDropdown.value === "cola" && cy) applyLayout();
    });
    layerSpacingSlider.addEventListener("input", function () {
      refresh("layerSpacingValue", layerSpacingSlider.value);
      if ((layoutDropdown.value === "concentric" || layoutDropdown.value === "breadthfirst") && cy)
        applyLayout();
    });
  
    // Graph styling sliders => update style instantly
    const nodeFontSlider = document.getElementById("nodeFontSlider");
    const nodeOutlineWidthSlider = document.getElementById("nodeOutlineWidthSlider");
    const nodePaddingSlider = document.getElementById("nodePaddingSlider");
    const edgeWidthSlider = document.getElementById("edgeWidthSlider");
    const edgeFontSlider = document.getElementById("edgeFontSlider");
    const edgeOutlineWidthSlider = document.getElementById("edgeOutlineWidthSlider");
  
    function updateStyle() {
      if (cy) cy.style(getCytoscapeStyle());
    }
    nodeFontSlider.addEventListener("input", function () {
      refresh("nodeFontValue", nodeFontSlider.value);
      updateStyle();
    });
    nodeOutlineWidthSlider.addEventListener("input", function () {
      refresh("nodeOutlineWidthValue", nodeOutlineWidthSlider.value);
      updateStyle();
    });
    nodePaddingSlider.addEventListener("input", function () {
      refresh("nodePaddingValue", nodePaddingSlider.value);
      updateStyle();
    });
    edgeWidthSlider.addEventListener("input", function () {
      refresh("edgeWidthValue", edgeWidthSlider.value);
      updateStyle();
    });
    edgeFontSlider.addEventListener("input", function () {
      refresh("edgeFontValue", edgeFontSlider.value);
      updateStyle();
    });
    edgeOutlineWidthSlider.addEventListener("input", function () {
      refresh("edgeOutlineWidthValue", edgeOutlineWidthSlider.value);
      updateStyle();
    });
  
    // Reset Zoom
    resetZoomBtn.addEventListener("click", function () {
      if (cy) cy.fit();
    });
  
    // Export PNG
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
  
    // Toggle Constructor Mode
    constructorModeBtn.addEventListener("click", function () {
      toggleConstructorMode();
    });
  
    // Auto-load default JSON at startup
    (function autoLoad() {
      const defaultJson = document.getElementById("jsonInput").value;
      const elements = buildElementsFromJSON(defaultJson);
      if (elements) {
        initializeCytoscape(elements);
        updateLayoutParamUI(layoutDropdown.value);
        applyLayout();
        setupConstructorEvents();
      }
    })();
  });
  