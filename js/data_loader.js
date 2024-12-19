// js/data_loader.js
import { load } from 'js-yaml';

async function loadYamlConfig(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch YAML config from ${filePath}: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        return load(text);
    } catch (error) {
        console.error("Error loading YAML config:", error);
        throw error;
    }
}


async function loadJsonData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON data from ${filePath}: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading JSON data:", error);
        throw error;
    }
}

async function loadCsvData(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          const csvText = event.target.result;
          try {
            const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
            const headers = rows.shift();
            const parsedData = rows.map(row => {
              const rowObject = {};
              headers.forEach((header, index) => {
                rowObject[header] = row[index];
              });
              return rowObject;
            });
              resolve(parsedData);
          } catch (error) {
              reject(new Error(`Error parsing CSV data: ${error.message}`));
          }
      };

      reader.onerror = (event) => {
          reject(new Error(`Error reading CSV file: ${event.target.error.message}`));
      }

      reader.readAsText(file);
  });
}

async function loadYamlData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const yamlText = event.target.result;
                const parsedYaml = load(yamlText);
                resolve(parsedYaml);
            } catch (error) {
                reject(new Error(`Error parsing YAML data: ${error.message}`));
            }
        };
        reader.onerror = (event) => {
            reject(new Error(`Error reading YAML file: ${event.target.error.message}`));
        };
        reader.readAsText(file);
    });
}


async function loadRemoteData(url, type) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch remote data from ${url}: ${response.status} ${response.statusText}`);
        }
        if (type === 'json') {
            return await response.json();
        } else if (type === 'yaml' || type === 'yml') {
          const text = await response.text();
           return load(text);
        } else {
            throw new Error(`Unsupported data type: ${type}`);
        }
    } catch (error) {
        console.error("Error loading remote data:", error);
        throw error;
    }
}


export { loadYamlConfig, loadJsonData, loadCsvData, loadYamlData, loadRemoteData };