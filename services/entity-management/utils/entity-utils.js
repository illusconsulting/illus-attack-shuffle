'use strict';

const db = require('@arangodb').db;

/**
 * Create a document in the specified collection
 * @param {string} collectionName - Name of the collection
 * @param {object} document - Document to insert
 * @returns {object} - Inserted document metadata
 */
function createDocument(collectionName, document) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Collection '${collectionName}' does not exist.`);
  }

  return collection.save(document);
}

/**
 * Update a document in the specified collection
 * @param {string} collectionName - Name of the collection
 * @param {string} documentKey - Key of the document to update
 * @param {object} updates - Fields to update
 * @returns {object} - Updated document metadata
 */
function updateDocument(collectionName, documentKey, updates) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Collection '${collectionName}' does not exist.`);
  }

  return collection.update(documentKey, updates);
}

/**
 * Delete a document from the specified collection
 * @param {string} collectionName - Name of the collection
 * @param {string} documentKey - Key of the document to delete
 * @returns {object} - Deleted document metadata
 */
function deleteDocument(collectionName, documentKey) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Collection '${collectionName}' does not exist.`);
  }

  return collection.remove(documentKey);
}

/**
 * Create an edge in the specified edge collection
 * @param {string} collectionName - Name of the edge collection
 * @param {object} edge - Edge to insert with _from and _to fields
 * @returns {object} - Inserted edge metadata
 */
function createEdge(collectionName, edge) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Edge collection '${collectionName}' does not exist.`);
  }

  if (!edge._from || !edge._to) {
    throw new Error('Edge must include "_from" and "_to" fields.');
  }

  return collection.save(edge);
}

/**
 * Update an edge in the specified edge collection
 * @param {string} collectionName - Name of the edge collection
 * @param {string} edgeKey - Key of the edge to update
 * @param {object} updates - Fields to update
 * @returns {object} - Updated edge metadata
 */
function updateEdge(collectionName, edgeKey, updates) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Edge collection '${collectionName}' does not exist.`);
  }

  return collection.update(edgeKey, updates);
}

/**
 * Delete an edge from the specified edge collection
 * @param {string} collectionName - Name of the edge collection
 * @param {string} edgeKey - Key of the edge to delete
 * @returns {object} - Deleted edge metadata
 */
function deleteEdge(collectionName, edgeKey) {
  const collection = db._collection(collectionName);

  if (!collection) {
    throw new Error(`Edge collection '${collectionName}' does not exist.`);
  }

  return collection.remove(edgeKey);
}

module.exports = {
  createDocument,
  updateDocument,
  deleteDocument,
  createEdge,
  updateEdge,
  deleteEdge,
};
