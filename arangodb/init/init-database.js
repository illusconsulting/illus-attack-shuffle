'use strict';

const db = require('@arangodb').db;

// Database name
const databaseName = 'attack_shuffle';

// Check if the database exists and create it if necessary
if (!db._databases().includes(databaseName)) {
  db._createDatabase(databaseName);
  console.log(`Database '${databaseName}' created.`);
} else {
  console.log(`Database '${databaseName}' already exists.`);
}

// Switch to the newly created or existing database
db._useDatabase(databaseName);

// Verify database switch
if (db._name() === databaseName) {
  console.log(`Switched to database '${databaseName}'.`);
} else {
  console.error(`Failed to switch to database '${databaseName}'.`);
}

console.log('Database initialization process completed.');
