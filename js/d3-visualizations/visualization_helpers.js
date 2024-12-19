// js/d3-visualizations/visualization_helpers.js
import { select } from 'd3';

function createTooltip(container, tooltipContent) {
    const tooltip = select(container)
        .append("div")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);
    
    tooltip.html(tooltipContent);

   return tooltip;
}


function showTooltip(tooltip, x, y) {
  tooltip.style("opacity", 1)
      .style("left", `${x}px`)
      .style("top", `${y}px`);
}

function hideTooltip(tooltip) {
    tooltip.style("opacity", 0);
}

export { createTooltip, showTooltip, hideTooltip };