'use strict';

const db = require('@arangodb').db;

/**
 * Create a new model version.
 * @param {string} modelName - Name of the model.
 * @param {object} metadata - Metadata for the new model version.
 * @returns {object} - Metadata of the created model version.
 */
function createModelVersion(modelName, metadata) {
  const collection = db._collection('model_versions');
  
  if (!collection) {
    throw new Error("Collection 'model_versions' does not exist.");
  }

  const modelVersion = {
    modelName,
    version: metadata.version || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...metadata,
  };

  return collection.save(modelVersion);
}

/**
 * Update an existing model version.
 * @param {string} versionId - ID of the model version to update.
 * @param {object} updates - Fields to update.
 * @returns {object} - Metadata of the updated model version.
 */
function updateModelVersion(versionId, updates) {
  const collection = db._collection('model_versions');
  
  if (!collection) {
    throw new Error("Collection 'model_versions' does not exist.");
  }

  const updatedModel = {
    updatedAt: new Date().toISOString(),
    ...updates,
  };

  return collection.update(versionId, updatedModel);
}

/**
 * Delete a model version.
 * @param {string} versionId - ID of the model version to delete.
 * @returns {object} - Metadata of the deleted model version.
 */
function deleteModelVersion(versionId) {
  const collection = db._collection('model_versions');
  
  if (!collection) {
    throw new Error("Collection 'model_versions' does not exist.");
  }

  return collection.remove(versionId);
}

/**
 * Retrieve all model versions for a given model name.
 * @param {string} modelName - Name of the model.
 * @returns {Array} - List of model versions.
 */
function getModelVersions(modelName) {
  const collection = db._collection('model_versions');
  
  if (!collection) {
    throw new Error("Collection 'model_versions' does not exist.");
  }

  return collection.byExample({ modelName }).toArray();
}

module.exports = {
  createModelVersion,
  updateModelVersion,
  deleteModelVersion,
  getModelVersions,
};
