'use strict';

const createRouter = require('@arangodb/foxx/router');
const searchUtils = require('./utils/search-utils');

const router = createRouter();
module.context.use(router);

/**
 * Search documents in a view by matching a field value.
 */
router.get('/search/:viewName/field', (req, res) => {
  const { viewName } = req.pathParams;
  const { field, value } = req.queryParams;

  if (!field || value === undefined) {
    res.throw(400, 'Field and value are required for searching.');
  }

  try {
    const results = searchUtils.searchByField(viewName, field, value);
    res.send({ success: true, message: 'Search completed successfully.', results });
  } catch (error) {
    res.throw(500, `Failed to search view '${viewName}': ${error.message}`);
  }
})
.queryParam('field', { type: 'string', description: 'Field to search by.' })
.queryParam('value', { type: 'string', description: 'Value to match in the field.' })
.summary('Search by field')
.description('Searches for documents in a specified view where a field matches a given value.');

/**
 * Perform a full-text search in a view.
 */
router.get('/search/:viewName/fulltext', (req, res) => {
  const { viewName } = req.pathParams;
  const { field, searchTerm } = req.queryParams;

  if (!field || !searchTerm) {
    res.throw(400, 'Field and searchTerm are required for full-text search.');
  }

  try {
    const results = searchUtils.fullTextSearch(viewName, field, searchTerm);
    res.send({ success: true, message: 'Full-text search completed successfully.', results });
  } catch (error) {
    res.throw(500, `Failed to perform full-text search on view '${viewName}': ${error.message}`);
  }
})
.queryParam('field', { type: 'string', description: 'Field to perform full-text search on.' })
.queryParam('searchTerm', { type: 'string', description: 'Search term for full-text search.' })
.summary('Full-text search')
.description('Performs a full-text search on a specific field within a view.');

/**
 * Perform a range search in a view.
 */
router.get('/search/:viewName/range', (req, res) => {
  const { viewName } = req.pathParams;
  const { field, min, max } = req.queryParams;

  if (!field || min === undefined || max === undefined) {
    res.throw(400, 'Field, min, and max are required for range search.');
  }

  try {
    const results = searchUtils.rangeSearch(viewName, field, parseFloat(min), parseFloat(max));
    res.send({ success: true, message: 'Range search completed successfully.', results });
  } catch (error) {
    res.throw(500, `Failed to perform range search on view '${viewName}': ${error.message}`);
  }
})
.queryParam('field', { type: 'string', description: 'Field to perform range search on.' })
.queryParam('min', { type: 'number', description: 'Minimum value for the range (inclusive).' })
.queryParam('max', { type: 'number', description: 'Maximum value for the range (inclusive).' })
.summary('Range search')
.description('Performs a range search on a specific field within a view.');

module.exports = router;
