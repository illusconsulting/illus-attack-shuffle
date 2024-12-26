<template>
      <div>
        <h1>Adversary Emulation Plans</h1>
        <select v-model="selectedPlan" @change="loadPlan">
          <option disabled value="">Select an Emulation Plan</option>
          <option v-for="plan in Object.keys(emulationUrls)" :key="plan" :value="plan">{{ plan }}</option>
        </select>
        <div v-if="loading">Loading data...</div>
        <div v-else-if="selectedPlan && emulationData">
          <h2>{{ selectedPlan }}</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th style="border: 1px solid black; padding: 8px;">Technique ID</th>
                <th style="border: 1px solid black; padding: 8px;">AWS</th>
                <th style="border: 1px solid black; padding: 8px;">Azure</th>
                <th style="border: 1px solid black; padding: 8px;">GCP</th>
                <th style="border: 1px solid black; padding: 8px;">M365</th>
                <th style="border: 1px solid black; padding: 8px;">NIST SP 800-53r5</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mapping, techniqueId) in techniqueMappings" :key="techniqueId">
                <td style="border: 1px solid black; padding: 8px;">{{ techniqueId }}</td>
                <td style="border: 1px solid black; padding: 8px;">{{ mapping.AWS || 0 }}</td>
                <td style="border: 1px solid black; padding: 8px;">{{ mapping.Azure || 0 }}</td>
                <td style="border: 1px solid black; padding: 8px;">{{ mapping.GCP || 0 }}</td>
                <td style="border: 1px solid black; padding: 8px;">{{ mapping.M365 || 0 }}</td>
                <td style="border: 1px solid black; padding: 8px;">{{ mapping['NIST SP 800-53'] || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <script>
    import { load } from 'js-yaml';

    export default {
      data() {
        return {
          loading: false,
          selectedPlan: '',
          emulationData: null,
          techniqueMappings: {},
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
          },
          mappingUrls: {
            'AWS': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/aws/attack-16.1/aws-12.12.2024/enterprise/aws-12.12.2024_attack-16.1-enterprise.json',
            'Azure': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/azure/attack-8.2/azure-06.29.2021/enterprise/azure-06.29.2021_attack-8.2-enterprise.json',
            'GCP': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/gcp/attack-10.0/gcp-06.28.2022/enterprise/gcp-06.28.2022_attack-10.0-enterprise.json',
            'M365': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/m365/attack-14.1/m365-12.11.2023/enterprise/m365-12.11.2023_attack-14.1-enterprise.json',
            'NIST SP 800-53': 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/nist_800_53/attack-14.1/nist_800_53-rev5/enterprise/nist_800_53-rev5_attack-14.1-enterprise.json'
          },
          mappingData: {}
        };
      },
      async mounted() {
        await this.loadMappingData();
      },
      methods: {
        async loadMappingData() {
          for (const [key, url] of Object.entries(this.mappingUrls)) {
            try {
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              this.mappingData[key] = data.mapping_objects;
            } catch (error) {
              console.error('Failed to fetch or process mapping data:', error);
              this.mappingData[key] = [];
            }
          }
        },
        async loadPlan() {
          this.loading = true;
          this.emulationData = null;
          this.techniqueMappings = {};
          try {
            const response = await fetch(this.emulationUrls[this.selectedPlan]);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const yamlText = await response.text();
            this.emulationData = load(yamlText);
            this.processEmulationData();
          } catch (error) {
            console.error('Failed to fetch or process emulation plan:', error);
            this.emulationData = null;
          }
          this.loading = false;
        },
        processEmulationData() {
          if (!this.emulationData) {
            return;
          }

          const mappings = {};
          this.emulationData.forEach(item => {
            if (item.technique && item.technique.attack_id) {
              const attackId = item.technique.attack_id;
              mappings[attackId] = {
                'Not Mapped': 0
              };
            }
          });

          for (const [key, objects] of Object.entries(this.mappingData)) {
            objects.forEach(obj => {
              if (mappings[obj.attack_object_id]) {
                if (!mappings[obj.attack_object_id][key]) {
                  mappings[obj.attack_object_id][key] = 0;
                }
                mappings[obj.attack_object_id][key]++;
                mappings[obj.attack_object_id]['Not Mapped'] = 0;
              }
            });
          }
          this.techniqueMappings = mappings;
        }
      }
    };
    </script>
    <style scoped>
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
    }
    </style>
