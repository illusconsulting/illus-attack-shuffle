'use strict';

const createRouter = require('@arangodb/foxx/router');
const backupUtils = require('./utils/backup-utils');

const router = createRouter();
module.context.use(router);

router.get('/backup', (req, res) => {
  try {
    const backupPath = backupUtils.createBackup();
    backupUtils.applyRetentionPolicy();
    res.send({ success: true, message: 'Backup completed successfully.', path: backupPath });
  } catch (error) {
    res.throw(500, `Backup failed: ${error.message}`);
  }
})
.summary('Create a backup')
.description('Creates a backup of the Attack Shuffle database and applies the retention policy.');

router.post('/restore', (req, res) => {
  const { backupPath } = req.body;
  if (!backupPath) {
    res.throw(400, 'Backup path is required for restoring a backup.');
  }

  try {
    backupUtils.restoreBackup(backupPath);
    res.send({ success: true, message: 'Restore completed successfully.', path: backupPath });
  } catch (error) {
    res.throw(500, `Restore failed: ${error.message}`);
  }
})
.body(
  {
    type: 'object',
    properties: {
      backupPath: { type: 'string', description: 'Path to the backup directory.' },
    },
    required: ['backupPath'],
  },
  'Backup path for restoration.'
)
.summary('Restore a backup')
.description('Restores the Attack Shuffle database from a specified backup path.');

module.exports = router;
