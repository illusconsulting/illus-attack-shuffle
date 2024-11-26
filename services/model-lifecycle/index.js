'use strict';

const createRouter = require('@arangodb/foxx/router');
const lifecycleUtils = require('./utils/lifecycle-utils');

const router = createRouter();
module.context.use(router);

/**
 * Create a new model version
 */
router.post('/models', (req, res) => {
  const { modelName, metadata } = req.body;

  if (!modelName) {
    res.throw(400, 'Model name is required.');
  }

  try {
    const result = lifecycleUtils.createModelVersion(modelName, metadata || {});
    res.send({ success: true, message: 'Model version created successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to create model version: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    properties: {
      modelName: { type: 'string', description: 'Name of the model.' },
      metadata: { type: 'object', description: 'Additional metadata for the model version.', additionalProperties: true },
    },
    required: ['modelName'],
  },
  'Request body for creating a new model version.'
)
.summary('Create a new model version')
.description('Creates a new version of a specified model with optional metadata.');

/**
 * Update an existing model version
 */
router.patch('/models/:versionId', (req, res) => {
  const { versionId } = req.pathParams;
  const updates = req.body;

  try {
    const result = lifecycleUtils.updateModelVersion(versionId, updates);
    res.send({ success: true, message: 'Model version updated successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to update model version: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    description: 'Fields to update in the model version.',
    additionalProperties: true,
  },
  'Updates to apply.'
)
.summary('Update a model version')
.description('Updates fields of an existing model version.');

/**
 * Delete a model version
 */
router.delete('/models/:versionId', (req, res) => {
  const { versionId } = req.pathParams;

  try {
    const result = lifecycleUtils.deleteModelVersion(versionId);
    res.send({ success: true, message: 'Model version deleted successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to delete model version: ${error.message}`);
  }
})
.summary('Delete a model version')
.description('Deletes a model version by its ID.');

/**
 * Retrieve all versions of a model
 */
router.get('/models/:modelName/versions', (req, res) => {
  const { modelName } = req.pathParams;

  try {
    const result = lifecycleUtils.getModelVersions(modelName);
    res.send({ success: true, message: 'Model versions retrieved successfully.', result });
  } catch (error) {
    res.throw(500, `Failed to retrieve model versions: ${error.message}`);
  }
})
.summary('Get all versions of a model')
.description('Retrieves all versions of a specified model.');

module.exports = router;
