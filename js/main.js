/**
 * main.js
 *  - Entry point that wires up all UI event listeners, initializes the graph, and coordinates interactions.
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("[DEBUG] DOM Loaded.");
  
    // Group sidebar elements into containers for layout customization and graph aesthetics.
    function groupSidebarElements() {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
  
      // Create container for layout customization
      const layoutContainer = document.createElement('div');
      layoutContainer.id = 'layoutCustomizationContainer';
      layoutContainer.style.border = "1px solid #ccc";
      layoutContainer.style.padding = "10px";
      layoutContainer.style.marginBottom = "10px";
  
      // Create container for graph aesthetics
      const aestheticsContainer = document.createElement('div');
      aestheticsContainer.id = 'graphAestheticsContainer';
      aestheticsContainer.style.border = "1px solid #ccc";
      aestheticsContainer.style.padding = "10px";
      aestheticsContainer.style.marginBottom = "10px";
  
      // Identify layout customization elements: layout dropdown container and layout-specific parameter divs
      const layoutDropdownContainer = document.querySelector('select#layoutDropdown')?.parentElement;
      const colaParams = document.getElementById('colaParams');
      const layerParams = document.getElementById('layerParams');
  
      if (layoutDropdownContainer) {
        layoutContainer.appendChild(layoutDropdownContainer);
      }
      if (colaParams) {
        layoutContainer.appendChild(colaParams);
      }
      if (layerParams) {
        layoutContainer.appendChild(layerParams);
      }
  
      // Insert layoutContainer into sidebar, after the JSON textarea
      const jsonTextarea = document.getElementById('jsonInput');
      if (jsonTextarea && jsonTextarea.parentElement) {
        jsonTextarea.parentElement.insertBefore(layoutContainer, jsonTextarea.nextSibling);
      }
  
      // Identify graph aesthetics elements: slider containers for nodeFontSlider, nodeOutlineWidthSlider, nodePaddingSlider, edgeWidthSlider, edgeFontSlider, edgeOutlineWidthSlider
      const aestheticsIds = ['nodeFontSlider', 'nodeOutlineWidthSlider', 'nodePaddingSlider', 'edgeWidthSlider', 'edgeFontSlider', 'edgeOutlineWidthSlider'];
      const aestheticsElements = [];
      aestheticsIds.forEach(id => {
        const elem = document.getElementById(id);
        if (elem && elem.parentElement) {
          aestheticsElements.push(elem.parentElement);
        }
      });
  
      // Append aesthetics elements to aestheticsContainer
      aestheticsElements.forEach(elem => aestheticsContainer.appendChild(elem));
  
      // Insert aestheticsContainer into sidebar, after layoutContainer
      if (layoutContainer.parentElement) {
        layoutContainer.parentElement.insertBefore(aestheticsContainer, layoutContainer.nextSibling);
      }
    }
    
    groupSidebarElements();
  
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
        attachDoubleClickHandlers();
      }
    });
  
    // Layout dropdown change
    layoutDropdown.addEventListener("change", function () {
      updateLayoutParamUI(layoutDropdown.value);
      applyLayout();
    });
  
    // Setup layout parameter slider events for Cola and other parameters.
    const nodeRepulsionSlider = document.getElementById("nodeRepulsionSlider");
    const edgeLengthSlider = document.getElementById("edgeLengthSlider");
    const gravitySlider = document.getElementById("gravitySlider");
    const infiniteToggle = document.getElementById("infiniteToggle");
    const avoidOverlapToggle = document.getElementById("avoidOverlapToggle");
    // Removed edgeSymDiffSlider and edgeJaccardSlider as these parameters have been dropped.
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
  
    // Attach double-click handlers for editing labels and creating nodes.
    function attachDoubleClickHandlers() {
      if (!cy) return;
      let lastTapTimeBg = 0;
      let lastTapTimeEle = 0;
      const dblClickDelay = 300;
  
      // Double tap on background to create a node.
      cy.on('tap', function(event) {
        if (event.target === cy) {
          let currentTime = new Date().getTime();
          if (currentTime - lastTapTimeBg < dblClickDelay) {
            // Double tap detected on blank space
            if (constructorMode) {
              let pos = event.position;
              let newId = generateUniqueNodeId();
              let label = prompt("Enter label for the new node:", "");
              let newNode = cy.add({
                group: "nodes",
                data: { id: newId, label: label || newId, color: "#888" },
                position: pos
              });
              newNode.ungrabify();
              updateJsonFromGraph();
            }
            lastTapTimeBg = 0;
          } else {
            lastTapTimeBg = currentTime;
          }
        }
      });
  
      // Double tap on a node or edge to edit its label.
      cy.on('tap', 'node, edge', function(event) {
        let currentTime = new Date().getTime();
        if (currentTime - lastTapTimeEle < dblClickDelay) {
          if (constructorMode) {
            let ele = event.target;
            let newLabel = prompt("Enter new label:", ele.data("label"));
            if (newLabel !== null) {
              ele.data("label", newLabel);
              updateJsonFromGraph();
            }
          }
          lastTapTimeEle = 0;
        } else {
          lastTapTimeEle = currentTime;
        }
      });
    }
  
    // Auto-load default JSON at startup
    (function autoLoad() {
      const defaultJson = document.getElementById("jsonInput").value;
      const elements = buildElementsFromJSON(defaultJson);
      if (elements) {
        initializeCytoscape(elements);
        updateLayoutParamUI(layoutDropdown.value);
        applyLayout();
        setupConstructorEvents();
        attachDoubleClickHandlers();
      }
    })();
  });
  