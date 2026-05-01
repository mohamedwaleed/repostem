import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('snapshot', 'repository_root');
  
  if (!hasColumn) {
    await knex.schema.alterTable('snapshot', (table) => {
      table.text('repository_root');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('snapshot', (table) => {
    table.dropColumn('repository_root');
  });
}
