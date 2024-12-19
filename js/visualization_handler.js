// js/visualization_handler.js
import {renderCollapsibleTree} from './d3-visualizations/collapsible_tree.js';
import {renderSankeyDiagram} from './d3-visualizations/sankey_diagram.js';
import {renderSunburstDiagram} from './d3-visualizations/sunburst_diagram.js';
import {renderRadialTidyTree} from './d3-visualizations/radial_tidy_tree.js';

class VisualizationHandler {
  constructor(visualizationConfigs, visualizationContainer) {
    this.visualizationConfigs = visualizationConfigs;
    this.visualizationContainer = visualizationContainer;
    this.currentVisualization = null;
    this.currentData = null;
  }


    renderVisualization(visualizationType, mappedData) {
        if (!visualizationType) {
          console.warn('No visualization type selected.');
            return;
        }

         if (!this.visualizationConfigs || !this.visualizationConfigs.visualizations || !this.visualizationConfigs.visualizations[visualizationType]) {
            console.warn(`No visualization configuration found for: ${visualizationType}`);
             return;
        }
      this.currentData = mappedData
        this.currentVisualization = visualizationType;
        this.visualizationContainer.innerHTML = ''; // Clear the container
        const visualizationConfig = this.visualizationConfigs.visualizations[visualizationType];

      switch (visualizationType) {
          case 'collapsibleTree':
              renderCollapsibleTree(this.visualizationContainer, mappedData, visualizationConfig);
              break;
          case 'sankeyDiagram':
              renderSankeyDiagram(this.visualizationContainer, mappedData, visualizationConfig);
              break;
          case 'sunburstDiagram':
              renderSunburstDiagram(this.visualizationContainer, mappedData, visualizationConfig);
              break;
          case 'radialTidyTree':
              renderRadialTidyTree(this.visualizationContainer, mappedData, visualizationConfig);
              break;
          default:
              console.warn(`Visualization type "${visualizationType}" is not supported.`);
          }
    }
}

export { VisualizationHandler };