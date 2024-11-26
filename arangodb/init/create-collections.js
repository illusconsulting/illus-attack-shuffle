'use strict';

const db = require('@arangodb').db;

// List of collections to create
const collections = [
  { name: 'asset_types', type: 'document' },
  { name: 'attack_techniques', type: 'document' },
  { name: 'data_components', type: 'document' },
  { name: 'cis_safeguards', type: 'document' },
  { name: 'nist_controls', type: 'document' },
  { name: 'attack_mitigations', type: 'document' },
  { name: 'attack_techniques_asset_types', type: 'edge' },
  { name: 'attack_techniques_data_components', type: 'edge' },
  { name: 'attack_techniques_cis_safeguards', type: 'edge' },
  { name: 'model_versions', type: 'document' },
];

// Helper function to create collections
const createCollection = (name, type) => {
  if (!db._collection(name)) {
    if (type === 'document') {
      db._createDocumentCollection(name);
      console.log(`Document collection '${name}' created.`);
    } else if (type === 'edge') {
      db._createEdgeCollection(name);
      console.log(`Edge collection '${name}' created.`);
    } else {
      console.log(`Unknown collection type for '${name}': ${type}`);
    }
  } else {
    console.log(`Collection '${name}' already exists.`);
  }
};

// Iterate through collections and create them
collections.forEach((collection) => {
  createCollection(collection.name, collection.type);
});

console.log('Collection creation process completed.');
