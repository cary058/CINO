const fs = require('node:fs');

const sqliteSchema = fs.readFileSync('prisma/schema.prisma', 'utf8')
  .replace('provider = "sqlite"', 'provider = "DATABASE"');
const postgresSchema = fs.readFileSync('prisma/schema.postgres.prisma', 'utf8')
  .replace('provider = "postgresql"', 'provider = "DATABASE"');

if (sqliteSchema !== postgresSchema) {
  console.error('The local SQLite and production PostgreSQL Prisma schemas have drifted. Keep their models in sync.');
  process.exit(1);
}

