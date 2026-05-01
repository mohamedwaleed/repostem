import type { Knex } from 'knex';
import * as path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/persistence/migrations'),
      extension: 'ts',
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'repostem',
      user: 'postgres',
      password: 'postgres'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'src/persistence/migrations'),
      extension: 'ts',
      tableName: 'knex_migrations'
    }
  }
};

export default config;
