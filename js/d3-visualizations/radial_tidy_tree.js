// js/d3-visualizations/radial_tidy_tree.js
import { select, tree, hierarchy, linkRadial, zoom, event,  } from 'd3';
import { createTooltip, showTooltip, hideTooltip } from './visualization_helpers.js';

const tooltip = createTooltip(container, "<div>Tooltip content</div>");
    selection.on('mouseover', (event, d) => {
      showTooltip(tooltip, event.clientX + 10, event.clientY + 10)
    })
     .on('mouseout', () => {
      hideTooltip(tooltip);
   });

function renderRadialTidyTree(container, data, config) {
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2 - 100;
    const i = 0;
    let duration = 750;
    let root;

    const svg = select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);


     const zoomGroup = svg.append("g").attr("class", "zoom-group");


    function zoomTree() {
      zoomGroup.attr("transform", event.transform);
    }


   function update(source) {
        const treeData = tree().size([2 * Math.PI, radius])(source);
        const nodes = treeData.descendants();
        const links = treeData.descendants().slice(1);


        nodes.forEach(d => {
         d.y = d.depth * 180;
         });


      const node = zoomGroup.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
         .attr('transform', d => `rotate(${source.x0 * 180 / Math.PI - 90}) translate(${source.y0},0)`);

      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
         .attr('cursor', 'pointer');


      nodeEnter.append('text')
        .attr('dy', '0.31em')
        .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
        .attr('transform', d => `rotate(${d.x < Math.PI ? 0 : 180}) translate(${d.x < Math.PI ? 8 : -8},0)`)
        .text(d => d.data.name)
      .style('fill-opacity', 1e-6);



    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition()
        .duration(duration)
         .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    nodeUpdate.select('circle.node')
        .attr('r', 5);

      nodeUpdate.select('text')
        .style('fill-opacity', 1);



    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', d => `rotate(${source.x * 180 / Math.PI - 90}) translate(${source.y},0)`)
        .remove();

    nodeExit.select('circle')
      .attr('r', 1e-6);
     nodeExit.select('text')
       .style('fill-opacity', 1e-6);



       const link = zoomGroup.selectAll('path.link')
            .data(links, d => d.id);

         const linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
             .attr('d', d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal(o, o)
             });

        const linkUpdate = linkEnter.merge(link);
         linkUpdate.transition()
        .duration(duration)
            .attr('d', d => diagonal(d, d.parent));


        link.exit().transition()
        .duration(duration)
            .attr('d', d => {
              const o = {x: source.x, y: source.y};
              return diagonal(o, o)
            })
            .remove();

            nodes.forEach(d => {
        d.x0 = d.x;
            d.y0 = d.y;
        });
    }

   function diagonal(s, d) {
    return linkRadial()({ source: { x: s.x, y: s.y }, target: { x: d.x, y: d.y } })
  }


   function click(d) {
      if (d.children) {
          d._children = d.children;
          d.children = null;
      } else {
          d.children = d._children;
          d._children = null;
      }
      update(d);
  }


   // Convert flat data to hierarchical data
  function createHierarchy(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

    if(Array.isArray(data)) {
         let rootNode;
        if(config && config.rootNode){
                rootNode = { name: config.rootNode, children: [] };
         } else {
             rootNode = {name: "root", children: []};
          }

          const lookup = {};
            data.forEach(item => {
                const id = item[config.idField || 'id'];
               const parentId = item[config.parentField || 'parent'];

            lookup[id] = { ...item, children: [] };
            if (parentId) {
                 if(lookup[parentId]) {
                     lookup[parentId].children.push(lookup[id]);
                 } else {
                    console.warn(`Missing parent: ${parentId}`)
                    rootNode.children.push(lookup[id]);
                 }
                } else {
                  rootNode.children.push(lookup[id]);
                }
           });
            return rootNode;
     } else {
      return data;
      }
    }


    const hierarchicalData = createHierarchy(data);

    if (!hierarchicalData) {
        console.error("Invalid data structure for radial tidy tree. Cannot render visualization.");
        return;
    }

    root = hierarchy(hierarchicalData, (d) => d.children);
    root.x0 = 0;
    root.y0 = 0;


    update(root);

        const zoomBehavior = zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", zoomTree);

      select(container).select("svg").call(zoomBehavior);
}


export { renderRadialTidyTree };