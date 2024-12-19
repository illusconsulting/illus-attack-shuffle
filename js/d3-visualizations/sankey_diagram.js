// js/d3-visualizations/sankey_diagram.js
import { select, sankey, sankeyLinkHorizontal, scaleOrdinal, schemeCategory10, event, zoom} from 'd3';
import { createTooltip, showTooltip, hideTooltip } from './visualization_helpers.js';

const tooltip = createTooltip(container, "<div>Tooltip content</div>");
    selection.on('mouseover', (event, d) => {
      showTooltip(tooltip, event.clientX + 10, event.clientY + 10)
    })
     .on('mouseout', () => {
      hideTooltip(tooltip);
   });

function renderSankeyDiagram(container, data, config) {
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;

  const svg = select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const zoomGroup = svg.append("g").attr("class", "zoom-group");

    function zoomSankey() {
          zoomGroup.attr("transform", event.transform);
      }


  function createSankeyData(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }
    if(Array.isArray(data)) {

      const nodes = [];
      const links = [];
      const nodeMap = {};

      data.forEach(item => {
         const sourceValue = item[config.sourceField || 'source'];
          const targetValue = item[config.targetField || 'target'];
          const value = item[config.valueField || 'value'];

          if(!sourceValue || !targetValue || !value) {
            console.warn("Invalid data format for sankey, missing value, source or target.");
            return;
           }

           if (!nodeMap[sourceValue]) {
                nodeMap[sourceValue] = {id: sourceValue, name: sourceValue};
              nodes.push(nodeMap[sourceValue]);
             }

         if (!nodeMap[targetValue]) {
               nodeMap[targetValue] = {id: targetValue, name: targetValue};
             nodes.push(nodeMap[targetValue]);
             }

          links.push({
              source: sourceValue,
              target: targetValue,
              value: parseFloat(value),
          });
       });
      return {nodes, links};
    } else {
      return data;
    }
  }


 const sankeyData = createSankeyData(data)
    if (!sankeyData) {
      console.error("Invalid data structure for sankey diagram. Cannot render visualization.")
        return;
    }

  const sankeyLayout = sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([width, height]);


  const graph = sankeyLayout(sankeyData);

  const color = scaleOrdinal(schemeCategory10);

  const link = zoomGroup.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(graph.links)
      .join("path")
          .attr("d", sankeyLinkHorizontal())
          .attr("stroke", ({source, target}) => color(source.name))
          .attr("stroke-width", d => Math.max(1, d.width))
          .style("mix-blend-mode", "multiply")
      .append("title")
          .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`)


   const node = zoomGroup.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => color(d.name))
        .append("title")
          .text(d => `${d.name}\n${d.value}`);


  zoomGroup.append("g")
      .style("font", "10px sans-serif")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
          .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
          .attr("y", d => (d.y1 + d.y0) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
          .text(d => d.name);


      const zoomBehavior = zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", zoomSankey);
        select(container).select("svg").call(zoomBehavior);
}


export { renderSankeyDiagram };