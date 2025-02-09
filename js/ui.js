/**
 * ui.js
 *  - Provides style definitions and dynamic UI adjustments.
 */

function darkenColor(hex, factor = 0.5) {
    if (!hex || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
      return "#333";
    }
    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
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
  
  function getCytoscapeStyle() {
    const nodeFSize = document.getElementById("nodeFontSlider").value + "px";
    const nodeOutlineWidth = parseFloat(document.getElementById("nodeOutlineWidthSlider").value);
    const nodePad = document.getElementById("nodePaddingSlider").value + "px";
  
    const edgeWidth = parseFloat(document.getElementById("edgeWidthSlider").value);
    const edgeFSize = document.getElementById("edgeFontSlider").value + "px";
    const edgeOutlineWidth = parseFloat(document.getElementById("edgeOutlineWidthSlider").value);
  
    return [
      {
        selector: "node",
        style: {
          "background-color": "data(color)",
          "label": "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          "color": "#fff",
          "font-size": nodeFSize,
          "text-outline-width": nodeOutlineWidth,
          "text-outline-color": "#555",
          "text-wrap": "wrap",
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
          "label": "data(label)",
          "font-size": edgeFSize,
          "color": "#fff",
          "text-rotation": "autorotate",
          "width": edgeWidth,
          "text-outline-width": edgeOutlineWidth,
          "text-outline-color": (ele) => {
            const c = ele.data("edgeColor") || "#ccc";
            return darkenColor(c, 0.5);
          },
          "text-outline-opacity": 1,
          "text-background-opacity": 0,
        },
      },
    ];
  }
  
  function updateLayoutParamUI(layoutName) {
    // For Cola: show its parameters.
    document.getElementById("colaParams").style.display = (layoutName === "cola") ? "block" : "none";
    // For Concentric and Breadthfirst, show layer spacing.
    if (layoutName === "concentric" || layoutName === "breadthfirst") {
      document.getElementById("layerParams").style.display = "block";
    } else {
      document.getElementById("layerParams").style.display = "none";
    }
  }
  