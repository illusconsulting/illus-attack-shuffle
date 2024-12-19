// js/d3-visualizations/collapsible_tree.js
import { select, tree, hierarchy, linkHorizontal, zoom, event } from 'd3';
import { createTooltip, showTooltip, hideTooltip } from './visualization_helpers.js';

const tooltip = createTooltip(container, "<div>Tooltip content</div>");
    selection.on('mouseover', (event, d) => {
      showTooltip(tooltip, event.clientX + 10, event.clientY + 10)
    })
     .on('mouseout', () => {
      hideTooltip(tooltip);
   });

function renderCollapsibleTree(container, data, config) {
    const margin = {top: 20, right: 90, bottom: 30, left: 90};
    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - margin.top - margin.bottom;
    let i = 0;
    let duration = 750;
    let root;

    const treeLayout = tree().size([height, width]);
    const svg = select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    const zoomGroup = svg.append("g").attr("class", "zoom-group");


   function update(source) {
        const treeData = treeLayout(source);
        const nodes = treeData.descendants();
        const links = treeData.descendants().slice(1);


        nodes.forEach(d => {
            d.y = d.depth * 180
         });


       // Update the nodes…
    const node = zoomGroup.selectAll('g.node')
      .data(nodes, d => d.id || (d.id = ++i));

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${source.y0},${source.x0})`)
     .on('click', click);

    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff');

    nodeEnter.append('text')
      .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('fill-opacity', 1e-6);


    // Transition nodes to their new position.
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
        .duration(duration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

        nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
        .attr('cursor', 'pointer');

        nodeUpdate.select('text')
        .style('fill-opacity', 1);


        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', d => `translate(${source.y},${source.x})`)
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
     return `M${s.y},${s.x}C${(s.y + d.y) / 2},${s.x} ${(s.y + d.y) / 2},${d.x} ${d.y},${d.x}`;
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


  function zoomTree() {
        zoomGroup.attr("transform", event.transform);
    }


   // Convert flat data to hierarchical data
  function createHierarchy(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

    if(Array.isArray(data)) {
        let rootNode;
         if(config && config.rootNode){
                rootNode = { name: config.rootNode , children: [] };
         }  else {
            rootNode = { name: 'root', children: [] };
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
       console.error("Invalid data structure for collapsible tree. Cannot render visualization.")
       return;
    }

    root = hierarchy(hierarchicalData, (d) => d.children);
    root.x0 = height / 2;
    root.y0 = 0;

    update(root);

     // Configure the zoom behavior
        const zoomBehavior = zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", zoomTree);

        select(container).select("svg").call(zoomBehavior);
}


export { renderCollapsibleTree };