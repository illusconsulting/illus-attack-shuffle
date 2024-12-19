// js/d3-visualizations/sunburst_diagram.js
import { select, partition, arc, hierarchy, scaleOrdinal, schemeCategory10, event, zoom} from 'd3';
import { createTooltip, showTooltip, hideTooltip } from './visualization_helpers.js';

const tooltip = createTooltip(container, "<div>Tooltip content</div>");
    selection.on('mouseover', (event, d) => {
      showTooltip(tooltip, event.clientX + 10, event.clientY + 10)
    })
     .on('mouseout', () => {
      hideTooltip(tooltip);
   });

function renderSunburstDiagram(container, data, config) {
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;
    const i = 0;

  const svg = select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

    const zoomGroup = svg.append("g").attr("class", "zoom-group");


   function zoomSunburst() {
        zoomGroup.attr("transform", event.transform);
   }


  function createHierarchy(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

      if(Array.isArray(data)){
         let rootNode;
           if(config && config.rootNode){
                rootNode = { name: config.rootNode, children: [] };
           } else {
             rootNode = { name: "root", children: [] };
           }

            const lookup = {};
            data.forEach(item => {
                const id = item[config.idField || 'id'];
                const parentId = item[config.parentField || 'parent'];
                lookup[id] = { ...item, children: [] };
                 if (parentId) {
                    if(lookup[parentId]){
                     lookup[parentId].children.push(lookup[id]);
                    } else {
                       console.warn(`Missing parent: ${parentId}`)
                       rootNode.children.push(lookup[id]);
                    }
                } else {
                   rootNode.children.push(lookup[id])
                 }
             });
            return rootNode
      } else {
         return data;
     }
 }


    const hierarchicalData = createHierarchy(data);

    if (!hierarchicalData) {
      console.error("Invalid data structure for sunburst diagram. Cannot render visualization.")
      return;
    }

  const root = hierarchy(hierarchicalData).sum(d => d[config.valueField || 'value'] || 1);


  const partitionLayout = partition().size([2 * Math.PI, radius]);


  const color = scaleOrdinal(schemeCategory10);
   const rootData = partitionLayout(root);

    const arcShape = arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);



   const path = zoomGroup.selectAll('path')
        .data(rootData.descendants().filter(d => d.depth))
        .join('path')
            .attr('fill', d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr('d', arcShape)
        .append("title")
            .text(d => d.ancestors().map(node => node.data.name).reverse().join("/") + "\n" + d.value);


  const label = zoomGroup.selectAll("text")
      .data(rootData.descendants().filter(d => d.depth && (d.y0 + d.y1)/2 * (d.x1-d.x0) > 10))
      .join("text")
          .attr("transform", d => {
              const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
             return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
          })
           .attr("dy", "0.35em")
          .text(d => d.data.name);

    const zoomBehavior = zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", zoomSunburst);

     select(container).select("svg").call(zoomBehavior);
}

export { renderSunburstDiagram };