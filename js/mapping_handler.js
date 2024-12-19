// js/mapping_handler.js
class MappingHandler {
    constructor(mappingConfigs) {
        this.mappingConfigs = mappingConfigs;
        this.uploadedData = null;
        this.mappedData = null;
        this.selectedMappings = [];
        this.allMappings = null;
        this.dataChangeCallbacks = []; // Array of callback functions for when the data changes.
    }

    createMappedData(data) {
        this.uploadedData = data;
        this.allMappings = this.getAllMappings(); // set allMappings value.
        this.applyMappings(this.selectedMappings); // apply the mappings.
        this.triggerDataChangeEvent();
    }

   applyMappings(selectedMappings) {
      this.selectedMappings = selectedMappings;

      if(!this.uploadedData) {
        console.warn('No uploaded data to process');
        this.mappedData = null;
        this.triggerDataChangeEvent();
        return;
      }

      if (!this.mappingConfigs || !this.mappingConfigs.mappings) {
          console.warn('No mappings configuration to process');
          this.mappedData = this.uploadedData;
          this.triggerDataChangeEvent();
          return;
      }

      let mappedData = [];
     if (Array.isArray(this.uploadedData)) {
          mappedData = this.uploadedData.map(item => {
            let mappedItem = { ...item };
              selectedMappings.forEach(mappingKey => {
                const mappingConfig = this.mappingConfigs.mappings[mappingKey];
                if (!mappingConfig) return;
                mappedItem = this.applyMapping(mappedItem, mappingConfig);
            });
           return mappedItem;
         });
      } else {
          let mappedItem = { ...this.uploadedData };
          selectedMappings.forEach(mappingKey => {
              const mappingConfig = this.mappingConfigs.mappings[mappingKey];
              if (!mappingConfig) return;
             mappedItem = this.applyMapping(mappedItem, mappingConfig);
           });
         mappedData = mappedItem
      }
     this.mappedData = mappedData;
     this.triggerDataChangeEvent();
    }


    async applyMapping(item, mappingConfig) {
      let mappedItem = { ...item };
      let value;
      if(mappingConfig.source) {
           value = this.resolveSource(item, mappingConfig.source);
           if (value === undefined) {
                return mappedItem;
            }
       } else if (mappingConfig.value) {
            value = mappingConfig.value;
       } else {
          return mappedItem;
      }

       if (mappingConfig.map) {
           value = await this.applyMap(value, mappingConfig.map, item);
       }
        if(mappingConfig.target){
          mappedItem = this.setTarget(mappedItem, mappingConfig.target, value)
        } else {
          mappedItem = value;
        }
        return mappedItem;
    }

  resolveSource(item, source) {
     let value = item;
    if(typeof source === 'string') {
         if (source === 'technique'){
             if (this.uploadedData && Array.isArray(this.uploadedData) && this.uploadedData[0] && this.uploadedData[0].hasOwnProperty('Technique ID')) {
                return item['Technique ID'];
           } else if(this.uploadedData && !Array.isArray(this.uploadedData) && this.uploadedData.hasOwnProperty('technique') && this.uploadedData.technique.attack_id){
               return item.technique.attack_id;
           } else if (this.uploadedData && !Array.isArray(this.uploadedData) && this.uploadedData.hasOwnProperty('attack_id')){
             return item.attack_id;
           }
         } else {
          return item[source];
        }
    }
    if (Array.isArray(source)) {
      for(const prop of source) {
           if(value && value.hasOwnProperty(prop)){
             value = value[prop];
           } else {
             return undefined;
           }
      }
     return value;
    }
    return undefined;
  }


    setTarget(item, target, value) {
         let targetItem = { ...item };
        if(typeof target === 'string') {
          targetItem[target] = value;
           return targetItem;
        }

      if (Array.isArray(target)) {
         let current = targetItem
          for (let i = 0; i < target.length - 1; i++) {
              const prop = target[i];
              if (!current.hasOwnProperty(prop)) {
                current[prop] = {};
              }
              current = current[prop];
          }
          current[target[target.length - 1]] = value;
          return targetItem;
      }
    }


    async applyMap(value, map, item) {
        if (!map) {
            return value;
        }
      if (map.type === 'static') {
           if (map.values && map.values[value]) {
                return map.values[value];
             }
           return value;
        } else if (map.type === 'regex') {
            const regex = new RegExp(map.pattern);
            const match = value.match(regex);
            if (match && map.group !== undefined) {
                return match[map.group];
            }
           return value;
      } else if (map.type === 'api') {
         return this.fetchApiMap(value, map, item);
        }
        return value;
    }


    async fetchApiMap(value, map, item) {
      let url = map.url.replace('{value}', value);

      try {
        const response = await fetch(url);
          if(!response.ok) {
             throw new Error(`Error during API fetch ${response.status} ${response.statusText}`);
          }

         const json = await response.json();
          let mappedValue;
          if (map.target && json) {
              mappedValue = await this.applyFilters(json, map, item, value)
          } else {
             mappedValue = json;
          }
          return mappedValue;

       } catch (error) {
            console.error("Error fetching from API:", error);
          return value;
        }
    }

  async applyFilters(json, map, item, value){
        let filteredResults;
     if(map.filter) {
          filteredResults = this.filterData(json, map.target, map.filter, value, item)
      } else {
           filteredResults = json[map.target]
      }

      if (map.subMap) {
            if(Array.isArray(filteredResults)) {
              const mappedResults = [];
                for (const result of filteredResults) {
                     const mapped = await this.applySubMap(result, map.subMap, item)
                     if(mapped){
                        if (Array.isArray(mapped)){
                           mappedResults.push(...mapped)
                         } else {
                           mappedResults.push(mapped)
                         }
                       }
                  }
             return mappedResults;
          } else {
            return  this.applySubMap(filteredResults, map.subMap, item)
          }
      }
        if(map.valueTarget) {
          return this.extractValue(filteredResults, map.valueTarget)
        }

     return filteredResults;
  }


  filterData(json, target, filter, value, item) {
         let results = json[target] || json;
        if (!results) {
          return null;
        }
       if (Array.isArray(results)) {
          return results.filter(item => {
              for (const key in filter) {
                let filterValue = filter[key];
                  if (typeof filterValue === 'string' && filterValue.includes('{value}')) {
                      filterValue = filterValue.replace('{value}', value);
                   } else if (typeof filterValue === 'string' && filterValue.includes('{id}')){
                       if(item.id) {
                         filterValue = filterValue.replace('{id}', item.id)
                       } else {
                          return false;
                       }
                   }  else if (typeof filterValue === 'string' && filterValue.includes('{source_ref}')){
                         if(item.source_ref) {
                            filterValue = filterValue.replace('{source_ref}', item.source_ref)
                         } else {
                           return false
                        }
                   }  else if (typeof filterValue === 'string' && filterValue.includes('{x_mitre_data_source_ref}')){
                       if(item.x_mitre_data_source_ref) {
                        filterValue = filterValue.replace('{x_mitre_data_source_ref}', item.x_mitre_data_source_ref)
                       } else {
                           return false
                       }
                   }

                if (typeof filterValue === 'string' && filterValue.includes('{attack_id}')) {
                    if (item.attack_id) {
                      filterValue = filterValue.replace('{attack_id}', item.attack_id)
                    } else if(item.external_references && item.external_references[0] && item.external_references[0].external_id) {
                      filterValue = filterValue.replace('{attack_id}', item.external_references[0].external_id);
                    } else {
                        return false;
                    }

                 }
                if (Array.isArray(filterValue)) {
                  let matchFound = false;
                  for(const filterItem of filterValue) {
                      if(item[key] === filterItem) {
                        matchFound = true;
                          break;
                      }
                  }
                  if (!matchFound) {
                      return false;
                  }
                }else if (item[key] !== filterValue) {
                   return false;
                  }
              }
                return true;
           });
       } else {
        for (const key in filter) {
               let filterValue = filter[key];
                  if (typeof filterValue === 'string' && filterValue.includes('{value}')) {
                        filterValue = filterValue.replace('{value}', value);
                   } else if (typeof filterValue === 'string' && filterValue.includes('{id}')){
                      if(item.id) {
                        filterValue = filterValue.replace('{id}', item.id)
                      } else {
                         return false;
                       }
                  } else if (typeof filterValue === 'string' && filterValue.includes('{source_ref}')){
                        if(item.source_ref) {
                             filterValue = filterValue.replace('{source_ref}', item.source_ref)
                           } else {
                             return false
                            }
                     }  else if (typeof filterValue === 'string' && filterValue.includes('{x_mitre_data_source_ref}')){
                        if(item.x_mitre_data_source_ref) {
                           filterValue = filterValue.replace('{x_mitre_data_source_ref}', item.x_mitre_data_source_ref)
                       } else {
                            return false
                         }
                    }
                  if (typeof filterValue === 'string' && filterValue.includes('{attack_id}')) {
                    if (item.attack_id) {
                       filterValue = filterValue.replace('{attack_id}', item.attack_id)
                    } else if(item.external_references && item.external_references[0] && item.external_references[0].external_id) {
                       filterValue = filterValue.replace('{attack_id}', item.external_references[0].external_id);
                    } else {
                        return false;
                    }
                }
                 if (Array.isArray(filterValue)) {
                  let matchFound = false;
                  for(const filterItem of filterValue) {
                      if(item[key] === filterItem) {
                       matchFound = true;
                          break;
                      }
                   }
                  if (!matchFound) {
                      return null;
                  }
                }else if (item[key] !== filterValue) {
                    return null;
                 }
              }
           return item;
      }
  }

    async applySubMap(item, subMap, parentItem) {
      let value = item
      if (subMap.type === 'api') {
         value = await this.fetchApiMap(item, subMap, parentItem);
        } else if (subMap.type === 'static') {
           if (subMap.values && subMap.values[value]) {
                value =  subMap.values[value];
             }
        }
        if (subMap.subMap) {
          return this.applySubMap(value, subMap.subMap, parentItem);
         } else if(subMap.valueTarget) {
              return this.extractValue(value, subMap.valueTarget);
           }

      return value
    }

   extractValue(data, valueTarget) {
        if (Array.isArray(data)) {
         if(typeof valueTarget === 'string'){
           return data.map(item => item[valueTarget]).filter(item => item !== undefined);
         } else if (typeof valueTarget === 'object') {
             return data.map(item => {
                const extracted = {}
                 for(const key in valueTarget){
                  if(item[valueTarget[key]]){
                     extracted[key] = item[valueTarget[key]];
                   } else {
                     extracted[key] = item[key];
                   }
                   }
                  return extracted
            }).filter(item => item !== undefined);
          }
        } else {
           if(typeof valueTarget === 'string'){
             return data ? data[valueTarget] : undefined;
             } else if (typeof valueTarget === 'object') {
                 const extracted = {}
                 for(const key in valueTarget){
                  if(data[valueTarget[key]]){
                     extracted[key] = data[valueTarget[key]];
                   } else {
                      extracted[key] = data[key];
                    }
                 }
              return extracted
           }
      }
      return data;
    }

    getAllMappings() {
      let allMappedData = [];
        if (Array.isArray(this.uploadedData)) {
          allMappedData = this.uploadedData.map(item => {
             let mappedItem = { ...item };
                for (const mappingKey in this.mappingConfigs.mappings) {
                  const mappingConfig = this.mappingConfigs.mappings[mappingKey];
                    mappedItem = this.applyMapping(mappedItem, mappingConfig);
                }
             return mappedItem;
         });
      } else if (this.uploadedData){
         let mappedItem = { ...this.uploadedData };
         for (const mappingKey in this.mappingConfigs.mappings) {
            const mappingConfig = this.mappingConfigs.mappings[mappingKey];
             mappedItem = this.applyMapping(mappedItem, mappingConfig);
          }
        allMappedData = mappedItem;
      }
     return allMappedData;
    }

    getMappedData() {
        return this.mappedData;
    }

   onDataChange(callback) {
      this.dataChangeCallbacks.push(callback);
    }

   triggerDataChangeEvent() {
        this.dataChangeCallbacks.forEach(callback => callback(this.mappedData));
  }
}

export { MappingHandler };