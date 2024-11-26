'use strict';

const db = require('@arangodb').db;

// View definitions
const views = [
  {
    name: 'asset_types_view',
    properties: {
      links: {
        asset_types: {
          includeAllFields: true,
          fields: {
            monitoring_coverage: {},
            environment: {},
          },
        },
      },
    },
  },
  {
    name: 'attack_techniques_view',
    properties: {
      links: {
        attack_techniques: {
          includeAllFields: true,
          fields: {
            tid_before: {},
            tid_after: {},
            prevalence_score: {},
          },
        },
      },
    },
  },
  {
    name: 'data_components_view',
    properties: {
      links: {
        data_components: {
          includeAllFields: true,
          fields: {
            data_component_name: {},
          },
        },
      },
    },
  },
  {
    name: 'cis_safeguards_view',
    properties: {
      links: {
        cis_safeguards: {
          includeAllFields: true,
          fields: {
            safeguard_description: {},
          },
        },
      },
    },
  },
];

// Helper function to create views
const createView = (view) => {
  if (!db._view(view.name)) {
    db._createView(view.name, 'arangosearch', view.properties);
    console.log(`View '${view.name}' created with properties:`);
    console.log(JSON.stringify(view.properties, null, 2));
  } else {
    console.log(`View '${view.name}' already exists.`);
  }
};

// Iterate through views and create them
views.forEach((view) => {
  createView(view);
});

console.log('View creation process completed.');
