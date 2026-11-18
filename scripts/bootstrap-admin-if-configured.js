if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  console.log('Single staff account bootstrap not configured; skipping.');
  process.exit(0);
}

const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, ['prisma/bootstrap-admin.js'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);

