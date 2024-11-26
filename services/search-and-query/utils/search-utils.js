'use strict';

const db = require('@arangodb').db;

/**
 * Execute a search query on a specified ArangoSearch View.
 * @param {string} viewName - The name of the ArangoSearch View.
 * @param {string} aqlQuery - The AQL query string to execute.
 * @param {object} [bindVars] - Optional bind variables for the AQL query.
 * @returns {Array} - Results of the query.
 */
function searchView(viewName, aqlQuery, bindVars = {}) {
  const view = db._view(viewName);

  if (!view) {
    throw new Error(`View '${viewName}' does not exist.`);
  }

  try {
    const cursor = db._query(aqlQuery, bindVars);
    return cursor.toArray();
  } catch (error) {
    throw new Error(`Failed to execute query on view '${viewName}': ${error.message}`);
  }
}

/**
 * Search for documents in a specific view by matching a field value.
 * @param {string} viewName - The name of the ArangoSearch View.
 * @param {string} field - The field to filter by.
 * @param {string|number|boolean} value - The value to match.
 * @returns {Array} - Filtered documents.
 */
function searchByField(viewName, field, value) {
  const aqlQuery = `
    FOR doc IN ${viewName}
      FILTER doc.${field} == @value
      RETURN doc
  `;

  return searchView(viewName, aqlQuery, { value });
}

/**
 * Perform a full-text search in a specific field within a view.
 * @param {string} viewName - The name of the ArangoSearch View.
 * @param {string} field - The field to perform full-text search on.
 * @param {string} searchTerm - The term to search for.
 * @returns {Array} - Matched documents.
 */
function fullTextSearch(viewName, field, searchTerm) {
  const aqlQuery = `
    FOR doc IN ${viewName}
      SEARCH ANALYZER(doc.${field} IN TOKENS(@searchTerm, 'text_en'), 'text_en')
      RETURN doc
  `;

  return searchView(viewName, aqlQuery, { searchTerm });
}

/**
 * Perform a range search in a specific field within a view.
 * @param {string} viewName - The name of the ArangoSearch View.
 * @param {string} field - The field to perform range search on.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {Array} - Documents within the range.
 */
function rangeSearch(viewName, field, min, max) {
  const aqlQuery = `
    FOR doc IN ${viewName}
      FILTER doc.${field} >= @min AND doc.${field} <= @max
      RETURN doc
  `;

  return searchView(viewName, aqlQuery, { min, max });
}

module.exports = {
  searchView,
  searchByField,
  fullTextSearch,
  rangeSearch,
};
