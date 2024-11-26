'use strict';

const db = require('@arangodb').db;

// Graph definitions
const graphs = [
  {
    name: 'attack_graph',
    edgeDefinitions: [
      {
        collection: 'attack_techniques_asset_types',
        from: ['asset_types'],
        to: ['attack_techniques'],
      },
      {
        collection: 'attack_techniques_data_components',
        from: ['attack_techniques'],
        to: ['data_components'],
      },
      {
        collection: 'attack_techniques_cis_safeguards',
        from: ['attack_techniques'],
        to: ['cis_safeguards'],
      },
    ],
  },
];

// Helper function to create graphs
const createGraph = (graph) => {
  const graphModule = require('@arangodb/general-graph');
  if (!graphModule._exists(graph.name)) {
    graphModule._create(graph.name, graph.edgeDefinitions);
    console.log(`Graph '${graph.name}' created with edge definitions:`);
    graph.edgeDefinitions.forEach((edgeDef) => {
      console.log(
        `  Edge: ${edgeDef.collection}, From: ${edgeDef.from.join(', ')}, To: ${edgeDef.to.join(', ')}`
      );
    });
  } else {
    console.log(`Graph '${graph.name}' already exists.`);
  }
};

// Iterate through graphs and create them
graphs.forEach((graph) => {
  createGraph(graph);
});

console.log('Graph creation process completed.');
