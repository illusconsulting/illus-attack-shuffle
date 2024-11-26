'use strict';

const jwt = require('@arangodb/foxx/jwt');
const crypto = require('@arangodb/crypto');
const db = require('@arangodb').db;

const tokenSecret = module.context.configuration.tokenSecret || 'supersecrettoken';
const tokenExpiration = parseInt(module.context.configuration.tokenExpiration || '3600', 10); // Default to 1 hour

/**
 * Generate a JWT token for a user
 * @param {object} user - The user object
 * @returns {string} - Generated JWT token
 */
function generateToken(user) {
  const payload = {
    sub: user._key,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + tokenExpiration, // Token expiration time
  };

  return jwt.sign(payload, tokenSecret);
}

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object} - Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, tokenSecret);
  } catch (err) {
    throw new Error('Invalid or expired token.');
  }
}

/**
 * Hash a password
 * @param {string} password - The plaintext password
 * @returns {string} - The hashed password
 */
function hashPassword(password) {
  return crypto.sha256(password);
}

/**
 * Verify a password against a hashed password
 * @param {string} password - The plaintext password
 * @param {string} hash - The hashed password
 * @returns {boolean} - True if the password matches the hash, otherwise false
 */
function verifyPassword(password, hash) {
  return crypto.constantEquals(hashPassword(password), hash);
}

/**
 * Create a new user
 * @param {object} user - User object containing username, password, and role
 * @returns {object} - Created user metadata
 */
function createUser(user) {
  const collection = db._collection('users');

  if (!collection) {
    throw new Error("Collection 'users' does not exist.");
  }

  const existingUser = collection.firstExample({ username: user.username });
  if (existingUser) {
    throw new Error(`User '${user.username}' already exists.`);
  }

  const newUser = {
    username: user.username,
    password: hashPassword(user.password),
    role: user.role || 'user', // Default role is 'user'
    createdAt: new Date().toISOString(),
  };

  return collection.save(newUser);
}

/**
 * Authenticate a user by username and password
 * @param {string} username - The username
 * @param {string} password - The plaintext password
 * @returns {object} - JWT token and user metadata
 */
function authenticateUser(username, password) {
  const collection = db._collection('users');

  if (!collection) {
    throw new Error("Collection 'users' does not exist.");
  }

  const user = collection.firstExample({ username });

  if (!user || !verifyPassword(password, user.password)) {
    throw new Error('Invalid username or password.');
  }

  const token = generateToken(user);

  return { token, user: { _key: user._key, username: user.username, role: user.role } };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  createUser,
  authenticateUser,
};
