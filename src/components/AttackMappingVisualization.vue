<template>
      <div>
        <h1>ATT&CK Mapping Visualization</h1>
        <select v-model="selectedPlan" @change="loadPlan">
          <option disabled value="">Select an Emulation Plan</option>
          <option v-for="plan in Object.keys(emulationUrls)" :key="plan" :value="plan">{{ plan }}</option>
        </select>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="margin-right: 10px;">Radial Tree</span>
          <label class="switch">
            <input type="checkbox" v-model="isCollapsible" @change="renderVisualization">
            <span class="slider round"></span>
          </label>
          <span style="margin-left: 10px;">Collapsible Tree</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <input type="checkbox" id="showMitigations" v-model="showMitigations" @change="renderVisualization">
          <label for="showMitigations" style="margin-right: 10px;">Show Mitigations</label>
          <input type="checkbox" id="showDataSources" v-model="showDataSources" @change="renderVisualization">
          <label for="showDataSources">Show Data Sources</label>
        </div>
        <div ref="treeContainer" style="width: 100%; height: 80vh;"></div>
      </div>
    </template>

    <script>
    import * as d3 from 'd3';
    import { load } from 'js-yaml';

    export default {
      data() {
        return {
          selectedPlan: '',
          emulationData: null,
          isCollapsible: false,
          showMitigations: true,
          showDataSources: true,
          stixData: {},
          stixUrls: {
            'Enterprise': 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
            'ICS': 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/ics-attack/ics-attack.json',
            'Mobile': 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/mobile-attack/mobile-attack.json'
          },
          emulationUrls: {
            'APT29': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/apt29/Emulation_Plan/yaml/APT29.yaml',
            'Carbanak': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/carbanak/Emulation_Plan/yaml/Carbanak.yaml',
            'FIN6': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/fin6/Emulation_Plan/yaml/FIN6.yaml',
            'FIN7': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/fin7/Emulation_Plan/yaml/Fin7.yaml',
            'Menupass': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/menu_pass/Emulation_Plan/yaml/menupass.yaml',
            'Oilrig': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/oilrig/Emulation_Plan/yaml/oilrig.yaml',
            'Sandworm': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/sandworm/Emulation_Plan/yaml/sandworm.yaml',
            'Turla Carbon': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/turla/Emulation_Plan/yaml/turla_carbon.yaml',
            'Turla Snake': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/turla/Emulation_Plan/yaml/turla_snake.yaml',
            'Wizard Spider': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/adversary_emulation_library/master/wizard_spider/Emulation_Plan/yaml/wizard_spider.yaml'
          }
        };
      },
      async mounted() {
        await this.loadStixData();
      },
      watch: {
        emulationData: {
          handler: 'renderVisualization',
          immediate: true
        }
      },
      methods: {
        async loadStixData() {
          for (const [key, url] of Object.entries(this.stixUrls)) {
            try {
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              this.stixData[key] = data.objects;
            } catch (error) {
              console.error('Failed to fetch or process STIX data:', error);
              this.stixData[key] = [];
            }
          }
        },
        async loadPlan() {
          try {
            const response = await fetch(this.emulationUrls[this.selectedPlan]);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const yamlText = await response.text();
            this.emulationData = load(yamlText);
          } catch (error) {
            console.error('Failed to fetch or process emulation plan:', error);
            this.emulationData = null;
          }
        },
        renderVisualization() {
          if (this.isCollapsible) {
            this.renderCollapsibleTree();
          } else {
            this.renderRadialTree();
          }
        },
        renderRadialTree() {
          if (!this.emulationData || !this.selectedPlan) {
            return;
          }

          const rootName = this.selectedPlan;
          const tactics = {};

          this.emulationData.forEach(item => {
            if (item.tactic && item.technique && item.technique.attack_id) {
              if (!tactics[item.tactic]) {
                tactics[item.tactic] = [];
              }
              tactics[item.tactic].push(item.technique.attack_id);
            }
          });

          const root = {
            name: rootName,
            children: Object.entries(tactics).map(([tactic, techniques]) => ({
              name: tactic,
              children: [...new Set(techniques)].map(tech => {
                const mitigations = this.showMitigations ? this.findMitigations(tech) : [];
                const dataSources = this.showDataSources ? this.findDataSources(tech) : [];
                return {
                  name: tech,
                  children: [
                    ...mitigations.map(mitigation => ({ name: mitigation, type: 'mitigation' })),
                    ...dataSources.map(ds => ({ name: ds, type: 'data-source' }))
                  ]
                };
              })
            }))
          };

          const container = d3.select(this.$refs.treeContainer);
          container.selectAll('*').remove();

          const containerWidth = this.$refs.treeContainer.offsetWidth;
          const containerHeight = this.$refs.treeContainer.offsetHeight;
          const width = containerWidth - (containerWidth * 0.01);
          const height = containerHeight - (containerHeight * 0.01);
          const radius = Math.min(width, height) / 2.3;

          const tree = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

          const rootNode = tree(d3.hierarchy(root));

          const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .call(d3.zoom()
              .on("zoom", (event) => {
                svg.attr("transform", event.transform)
              }))
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

          const link = svg.append('g')
            .attr('fill', 'none')
            .attr('stroke', '#555')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', 1.5)
            .selectAll('path')
            .data(rootNode.links())
            .join('path')
            .attr('d', d3.linkRadial()
              .angle(d => d.x)
              .radius(d => d.y));

          svg.append('g')
            .selectAll('circle')
            .data(rootNode.descendants())
            .join('circle')
            .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .attr('fill', d => d.children ? '#555' : '#999')
            .attr('r', 2.5);

          svg.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-width', 3)
            .selectAll('text')
            .data(rootNode.descendants())
            .join('text')
            .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr('dy', '0.31em')
            .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
            .text(d => d.data.name)
            .clone(true).lower()
            .attr('stroke', 'white');
        },
        renderCollapsibleTree() {
          if (!this.emulationData || !this.selectedPlan) {
            return;
          }

          const rootName = this.selectedPlan;
          const tactics = {};

          this.emulationData.forEach(item => {
            if (item.tactic && item.technique && item.technique.attack_id) {
              if (!tactics[item.tactic]) {
                tactics[item.tactic] = [];
              }
              tactics[item.tactic].push(item.technique.attack_id);
            }
          });

          const root = {
            name: rootName,
            children: Object.entries(tactics).map(([tactic, techniques]) => ({
              name: tactic,
              children: [...new Set(techniques)].map(tech => {
                const mitigations = this.showMitigations ? this.findMitigations(tech) : [];
                const dataSources = this.showDataSources ? this.findDataSources(tech) : [];
                return {
                  name: tech,
                  children: [
                    ...mitigations.map(mitigation => ({ name: mitigation, type: 'mitigation' })),
                    ...dataSources.map(ds => ({ name: ds, type: 'data-source' }))
                  ]
                };
              })
            }))
          };

          const container = d3.select(this.$refs.treeContainer);
          container.selectAll('*').remove();

          const width = 928;
          const marginTop = 10;
          const marginRight = 10;
          const marginBottom = 10;
          const marginLeft = 40;

          const rootNode = d3.hierarchy(root);
          const dx = 10;
          const dy = (width - marginRight - marginLeft) / (1 + rootNode.height);

          const tree = d3.tree().nodeSize([dx, dy]);
          const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

          const svg = container.append("svg")
            .attr("width", width)
            .attr("height", dx)
            .attr("viewBox", [-marginLeft, -marginTop, width, dx])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;");

          const gLink = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);

          const gNode = svg.append("g")
            .attr("cursor", "pointer")
            .attr("pointer-events", "all");

          const update = (event, source) => {
            const duration = event?.altKey ? 2500 : 250;
            const nodes = rootNode.descendants().reverse();
            const links = rootNode.links();

            tree(rootNode);

            let left = rootNode;
            let right = rootNode;
            rootNode.eachBefore(node => {
              if (node.x < left.x) left = node;
              if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + marginTop + marginBottom;

            const transition = svg.transition()
              .duration(duration)
              .attr("height", height)
              .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
              .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

            const node = gNode.selectAll("g")
              .data(nodes, d => d.id);

            const nodeEnter = node.enter().append("g")
              .attr("transform", d => `translate(${source.y0},${source.x0})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0)
              .on("click", (event, d) => {
                this.toggleNode(d);
                update(event, d);
              });

            nodeEnter.append("circle")
              .attr("r", 2.5)
              .attr("fill", d => d._children ? "#555" : "#999")
              .attr("stroke-width", 10);

            nodeEnter.append("text")
              .attr("dy", "0.31em")
              .attr("x", d => d._children ? -6 : 6)
              .attr("text-anchor", d => d._children ? "end" : "start")
              .text(d => d.data.name)
              .attr("stroke-linejoin", "round")
              .attr("stroke-width", 3)
              .attr("stroke", "white")
              .attr("paint-order", "stroke");

            const nodeUpdate = node.merge(nodeEnter).transition(transition)
              .attr("transform", d => `translate(${d.y},${d.x})`)
              .attr("fill-opacity", 1)
              .attr("stroke-opacity", 1);

            const nodeExit = node.exit().transition(transition).remove()
              .attr("transform", d => `translate(${source.y},${source.x})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0);

            const link = gLink.selectAll("path")
              .data(links, d => d.target.id);

            const linkEnter = link.enter().append("path")
              .attr("d", d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
              });

            link.merge(linkEnter).transition(transition)
              .attr("d", diagonal);

            link.exit().transition(transition).remove()
              .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
              });

            rootNode.eachBefore(d => {
              d.x0 = d.x;
              d.y0 = d.y;
            });
          };

          rootNode.x0 = dy / 2;
          rootNode.y0 = 0;
          rootNode.descendants().forEach((d, i) => {
            d.id = i;
            d._children = d.children;
             d.children = d._children;
          });

          update(null, rootNode);
        },
         toggleNode(d) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
        },
        findMitigations(techniqueId) {
          let mitigations = [];
          for (const key in this.stixData) {
            const objects = this.stixData[key];
            const attackPattern = objects.find(obj =>
              obj.type === 'attack-pattern' &&
              obj.external_references &&
              obj.external_references.some(ref => ref.external_id === techniqueId)
            );

            if (attackPattern) {
              const mitigatingRelationships = objects.filter(obj =>
                obj.type === 'relationship' &&
                obj.target_ref === attackPattern.id &&
                obj.relationship_type === 'mitigates'
              );

              mitigations = mitigatingRelationships.map(rel => {
                const coa = objects.find(obj => obj.type === 'course-of-action' && obj.id === rel.source_ref);
                if (coa && coa.external_references && coa.external_references.length > 0) {
                  return coa.external_references[0].external_id;
                }
                return null;
              }).filter(mitigation => mitigation !== null);
              break;
            }
          }
          return mitigations;
        },
        findDataSources(techniqueId) {
          let dataSources = [];
          for (const key in this.stixData) {
            const objects = this.stixData[key];
            const attackPattern = objects.find(obj =>
              obj.type === 'attack-pattern' &&
              obj.external_references &&
              obj.external_references.some(ref => ref.external_id === techniqueId)
            );

            if (attackPattern) {
              const detectingRelationships = objects.filter(obj =>
                obj.type === 'relationship' &&
                obj.target_ref === attackPattern.id &&
                obj.relationship_type === 'detects'
              );

              dataSources = detectingRelationships.map(rel => {
                const dataComponent = objects.find(obj =>
                  obj.type === 'x-mitre-data-component' && obj.id === rel.source_ref
                );
                if (dataComponent && dataComponent.x_mitre_data_source_ref) {
                  const dataSource = objects.find(obj =>
                    obj.type === 'x-mitre-data-source' && obj.id === dataComponent.x_mitre_data_source_ref
                  );
                  if (dataSource && dataSource.external_references && dataSource.external_references.length > 0) {
                    return `${dataComponent.name} (${dataSource.external_references[0].external_id})`;
                  }
                }
                return null;
              }).filter(ds => ds !== null);
              break;
            }
          }
          return dataSources;
        }
      }
    };
    </script>

    <style scoped>
    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: .4s;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      -webkit-transition: .4s;
      transition: .4s;
    }

    input:checked + .slider {
      background-color: #2196F3;
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #2196F3;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(20px);
      -ms-transform: translateX(20px);
      transform: translateX(20px);
    }

    .slider.round {
      border-radius: 20px;
    }

    .slider.round:before {
      border-radius: 50%;
    }
    </style>
