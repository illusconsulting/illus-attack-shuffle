'use strict';

const createRouter = require('@arangodb/foxx/router');
const accessUtils = require('./utils/access-utils');

const router = createRouter();
module.context.use(router);

/**
 * Register a new user
 */
router.post('/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.throw(400, 'Username and password are required.');
  }

  try {
    const user = accessUtils.createUser({ username, password, role });
    res.send({ success: true, message: 'User registered successfully.', user });
  } catch (error) {
    res.throw(500, `Failed to register user: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'The username of the user.' },
      password: { type: 'string', description: 'The plaintext password for the user.' },
      role: { type: 'string', description: 'The role of the user (default is "user").' },
    },
    required: ['username', 'password'],
  },
  'Request body for registering a new user.'
)
.summary('Register a new user')
.description('Registers a new user with a username, password, and optional role.');

/**
 * Authenticate a user
 */
router.post('/authenticate', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.throw(400, 'Username and password are required.');
  }

  try {
    const authResult = accessUtils.authenticateUser(username, password);
    res.send({ success: true, message: 'Authentication successful.', authResult });
  } catch (error) {
    res.throw(401, `Authentication failed: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'The username of the user.' },
      password: { type: 'string', description: 'The plaintext password of the user.' },
    },
    required: ['username', 'password'],
  },
  'Request body for user authentication.'
)
.summary('Authenticate a user')
.description('Authenticates a user with their username and password and returns a JWT token.');

/**
 * Verify a JWT token
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.throw(400, 'Token is required.');
  }

  try {
    const decoded = accessUtils.verifyToken(token);
    res.send({ success: true, message: 'Token verification successful.', decoded });
  } catch (error) {
    res.throw(401, `Token verification failed: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'The JWT token to verify.' },
    },
    required: ['token'],
  },
  'Request body for token verification.'
)
.summary('Verify a JWT token')
.description('Verifies the validity of a JWT token and returns its decoded payload.');

module.exports = router;
