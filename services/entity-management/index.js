'use strict';

const createRouter = require('@arangodb/foxx/router');
const entityUtils = require('./utils/entity-utils');

const router = createRouter();
module.context.use(router);

/**
 * Create a document
 */
router.post('/documents/:collectionName', (req, res) => {
  const { collectionName } = req.pathParams;
  const document = req.body;

  try {
    const result = entityUtils.createDocument(collectionName, document);
    res.send({ success: true, message: 'Document created successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to create document: ${error.message}`);
  }
})
.body(
  { type: 'object', description: 'Document data to create.' },
  'Document to insert.'
)
.summary('Create a document')
.description('Creates a new document in the specified collection.');

/**
 * Update a document
 */
router.patch('/documents/:collectionName/:documentKey', (req, res) => {
  const { collectionName, documentKey } = req.pathParams;
  const updates = req.body;

  try {
    const result = entityUtils.updateDocument(collectionName, documentKey, updates);
    res.send({ success: true, message: 'Document updated successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to update document: ${error.message}`);
  }
})
.body(
  { type: 'object', description: 'Fields to update in the document.' },
  'Updates to apply.'
)
.summary('Update a document')
.description('Updates fields of an existing document in the specified collection.');

/**
 * Delete a document
 */
router.delete('/documents/:collectionName/:documentKey', (req, res) => {
  const { collectionName, documentKey } = req.pathParams;

  try {
    const result = entityUtils.deleteDocument(collectionName, documentKey);
    res.send({ success: true, message: 'Document deleted successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to delete document: ${error.message}`);
  }
})
.summary('Delete a document')
.description('Deletes a document from the specified collection.');

/**
 * Create an edge
 */
router.post('/edges/:collectionName', (req, res) => {
  const { collectionName } = req.pathParams;
  const edge = req.body;

  try {
    const result = entityUtils.createEdge(collectionName, edge);
    res.send({ success: true, message: 'Edge created successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to create edge: ${error.message}`);
  }
})
.body(
  { type: 'object', description: 'Edge data to create (must include _from and _to).' },
  'Edge to insert.'
)
.summary('Create an edge')
.description('Creates a new edge in the specified edge collection.');

/**
 * Update an edge
 */
router.patch('/edges/:collectionName/:edgeKey', (req, res) => {
  const { collectionName, edgeKey } = req.pathParams;
  const updates = req.body;

  try {
    const result = entityUtils.updateEdge(collectionName, edgeKey, updates);
    res.send({ success: true, message: 'Edge updated successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to update edge: ${error.message}`);
  }
})
.body(
  { type: 'object', description: 'Fields to update in the edge.' },
  'Updates to apply.'
)
.summary('Update an edge')
.description('Updates fields of an existing edge in the specified edge collection.');

/**
 * Delete an edge
 */
router.delete('/edges/:collectionName/:edgeKey', (req, res) => {
  const { collectionName, edgeKey } = req.pathParams;

  try {
    const result = entityUtils.deleteEdge(collectionName, edgeKey);
    res.send({ success: true, message: 'Edge deleted successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to delete edge: ${error.message}`);
  }
})
.summary('Delete an edge')
.description('Deletes an edge from the specified edge collection.');

module.exports = router;
