import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasRepoTable = await knex.schema.hasTable('repo');
  if (!hasRepoTable) {
    await knex.schema.createTable('repo', (table) => {
      table.text('id').primary();
      table.text('root_path').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasSnapshotTable = await knex.schema.hasTable('snapshot');
  if (!hasSnapshotTable) {
    await knex.schema.createTable('snapshot', (table) => {
    table.text('id').primary();
    table.text('repo_id').notNullable();
    table.text('repository_root');
    table.text('git_remote_url');
    table.text('branch');
    table.text('commit_hash');
    table.boolean('working_tree_dirty').defaultTo(false);
    table.integer('total_files');
    table.integer('cycle_count');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('repo_id').references('id').inTable('repo').onDelete('CASCADE');
    });
  }

  const hasFileSnapshotTable = await knex.schema.hasTable('file_snapshot');
  if (!hasFileSnapshotTable) {
    await knex.schema.createTable('file_snapshot', (table) => {
    table.text('snapshot_id').notNullable();
    table.text('file_path').notNullable();
    table.float('dependency_importance');
    table.float('connectivity');
    table.float('churn');
    table.float('risk_score');
    table.text('risk_level').checkIn(['HIGH', 'MEDIUM', 'LOW']);
    table.integer('impact_count').defaultTo(0);
    
    table.primary(['snapshot_id', 'file_path']);
    table.foreign('snapshot_id').references('id').inTable('snapshot').onDelete('CASCADE');
    });
  }

  const hasDependencyEdgeTable = await knex.schema.hasTable('dependency_edge');
  if (!hasDependencyEdgeTable) {
    await knex.schema.createTable('dependency_edge', (table) => {
    table.text('snapshot_id').notNullable();
    table.text('from_file').notNullable();
    table.text('to_file').notNullable();
    
    table.primary(['snapshot_id', 'from_file', 'to_file']);
    table.foreign('snapshot_id').references('id').inTable('snapshot').onDelete('CASCADE');
    });
  }

  const hasCycleTable = await knex.schema.hasTable('cycle');
  if (!hasCycleTable) {
    await knex.schema.createTable('cycle', (table) => {
      table.text('id').primary();
      table.text('snapshot_id').notNullable();
      table.text('nodes').notNullable();
      
      table.foreign('snapshot_id').references('id').inTable('snapshot').onDelete('CASCADE');
    });
  }

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_snapshot_repo_id ON snapshot(repo_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_snapshot_created_at ON snapshot(created_at)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_file_snapshot_snapshot_id ON file_snapshot(snapshot_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_dependency_edge_snapshot_id ON dependency_edge(snapshot_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_cycle_snapshot_id ON cycle(snapshot_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cycle');
  await knex.schema.dropTableIfExists('dependency_edge');
  await knex.schema.dropTableIfExists('file_snapshot');
  await knex.schema.dropTableIfExists('snapshot');
  await knex.schema.dropTableIfExists('repo');
}
