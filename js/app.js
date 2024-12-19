// js/app.js
import { loadYamlConfig, loadCsvData, loadYamlData } from './data_loader.js';
import { MappingHandler } from './mapping_handler.js';
import { VisualizationHandler } from './visualization_handler.js';
import { downloadJsonFile } from './file_downloader.js';

async function init() {
  try {
    const config = await loadYamlConfig('./data/example_mapping_config.yaml');

    const mappingHandler = new MappingHandler(config);
    const visualizationContainer = document.getElementById('visualization');
    const visualizationHandler = new VisualizationHandler(config, visualizationContainer);
    let visualizationType;

    // Populate Mapping Selection Checkboxes
    const mappingSelectionsDiv = document.getElementById('mapping-selections');
    for (const mappingKey in config.mappings) {
      const mapping = config.mappings[mappingKey];
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = mappingKey;
      checkbox.id = `mapping-${mappingKey}`;
      const label = document.createElement('label');
      label.htmlFor = `mapping-${mappingKey}`;
      label.textContent = mapping.name;
      mappingSelectionsDiv.appendChild(checkbox);
      mappingSelectionsDiv.appendChild(label);
      mappingSelectionsDiv.appendChild(document.createElement('br'));
    }

    // Populate Visualization Options
    const visualizationSelect = document.getElementById('visualization-selection');
      for(const visualizationKey in config.visualizations){
           const visualization = config.visualizations[visualizationKey];
           const option = document.createElement('option');
            option.value = visualizationKey;
            option.textContent = visualization.name;
           visualizationSelect.appendChild(option);
      }

      // Event listener for mapping changes
    mappingHandler.onDataChange((mappedData) => {
          //Update visualization based on the updated mappedData
        visualizationHandler.renderVisualization(visualizationType, mappedData);
    });

    // Visualization Selection Listener
    visualizationSelect.addEventListener('change', (event) => {
        visualizationType = event.target.value;
      visualizationHandler.renderVisualization(visualizationType, mappingHandler.getMappedData());
    });


     // Download Listeners
    const downloadAllButton = document.getElementById("download-all");
    downloadAllButton.addEventListener('click', (event) => {
       const allMappings = mappingHandler.getAllMappings();
       downloadJsonFile(allMappings, 'all_mappings.json');
    });

    const downloadVisibleButton = document.getElementById('download-visible');
    downloadVisibleButton.addEventListener('click', (event) => {
          const currentMappedData = mappingHandler.getMappedData();
         downloadJsonFile(currentMappedData, 'mapped_data.json');
    });

    // Mapping Selection Listeners
    const mappingSelection = document.getElementById('mapping-selections');
    mappingSelection.addEventListener('change', (event) => {
      const selectedMappings = Array.from(mappingSelection.querySelectorAll('input[type="checkbox"]:checked'))
        .map((checkbox) => checkbox.value);
        mappingHandler.applyMappings(selectedMappings);
        //This event will trigger the visualization handler to update the visualization
    });

    // File Upload Handling
    const fileUpload = document.getElementById('file-upload');
    fileUpload.addEventListener('change', async (event) => {
      const file = event.target.files[0];
        if (file) {
            let uploadedData;
          if (file.name.endsWith('.csv')) {
            uploadedData = await loadCsvData(file);
          } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
             uploadedData = await loadYamlData(file);
          } else {
            alert('Invalid file type. Please upload a CSV or YAML file.');
              return;
          }
          mappingHandler.createMappedData(uploadedData);
        }
    });

  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

init();