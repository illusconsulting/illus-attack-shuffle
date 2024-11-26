'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const backupDirectory = process.env.ARANGO_BACKUP_DIRECTORY || './arangodb/backups';
const arangoHost = process.env.ARANGO_HOST || 'localhost';
const arangoPort = process.env.ARANGO_PORT || '8529';
const arangoDatabase = process.env.ARANGO_DATABASE || 'attack_shuffle';
const arangoUsername = process.env.ARANGO_USERNAME || 'root';
const arangoPassword = process.env.ARANGO_ROOT_PASSWORD || 'examplepassword';
const retentionPolicy = parseInt(process.env.BACKUP_RETENTION_POLICY || '7', 10);

/**
 * Ensure the backup directory exists
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory, { recursive: true });
    console.log(`Created backup directory: ${backupDirectory}`);
  }
}

/**
 * Create a backup using arangodump
 */
function createBackup() {
  ensureBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${backupDirectory}/backup_${timestamp}`;

  console.log(`Starting backup for database '${arangoDatabase}'...`);
  try {
    execSync(
      `arangodump --server.endpoint tcp://${arangoHost}:${arangoPort} ` +
      `--server.username ${arangoUsername} --server.password ${arangoPassword} ` +
      `--output-directory ${backupPath} --overwrite true --threads 4 --compress-output true`,
      { stdio: 'inherit' }
    );
    console.log(`Backup completed successfully at '${backupPath}'.`);
    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error.message);
    throw new Error('Backup operation failed.');
  }
}

/**
 * Apply retention policy to remove old backups
 */
function applyRetentionPolicy() {
  const backups = fs.readdirSync(backupDirectory)
    .filter(file => file.startsWith('backup_'))
    .map(file => ({
      file,
      path: `${backupDirectory}/${file}`,
      created: fs.statSync(`${backupDirectory}/${file}`).birthtime,
    }))
    .sort((a, b) => b.created - a.created); // Sort by newest first

  if (backups.length > retentionPolicy) {
    console.log(`Applying retention policy: Keeping the last ${retentionPolicy} backups.`);
    backups.slice(retentionPolicy).forEach(backup => {
      console.log(`Deleting old backup: ${backup.path}`);
      fs.rmSync(backup.path, { recursive: true, force: true });
    });
  } else {
    console.log('Retention policy applied: No backups removed.');
  }
}

/**
 * Restore a backup using arangorestore
 * @param {string} backupPath - Path to the backup directory to restore
 */
function restoreBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup path '${backupPath}' does not exist.`);
  }

  console.log(`Restoring backup from '${backupPath}'...`);
  try {
    execSync(
      `arangorestore --server.endpoint tcp://${arangoHost}:${arangoPort} ` +
      `--server.username ${arangoUsername} --server.password ${arangoPassword} ` +
      `--input-directory ${backupPath} --overwrite true --threads 4`,
      { stdio: 'inherit' }
    );
    console.log('Restore completed successfully.');
  } catch (error) {
    console.error('Restore failed:', error.message);
    throw new Error('Restore operation failed.');
  }
}

// Export functions for use in other modules
module.exports = {
  createBackup,
  applyRetentionPolicy,
  restoreBackup,
};
