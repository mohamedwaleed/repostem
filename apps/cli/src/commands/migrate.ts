import { Command } from 'commander';
import { getConfig, checkConfigFile } from '@repostem/engine';
import { AdapterFactory, runKnexMigrations, getMigrationStatus } from '@repostem/engine';
import chalk from 'chalk';

const migrateCommand = new Command('migrate')
  .description('Run database migrations')
  .option('--repo <path>', 'Repository path (defaults to current directory)', process.cwd())
  .option('--status', 'Show migration status without running migrations')
  .action(async (options) => {
    const repoPath = options.repo;

    if (!checkConfigFile(repoPath)) {
      console.error(chalk.red('❌ No configuration file found. Run `repostem init` first.'));
      process.exit(1);
    }

    const config = getConfig(repoPath);

    if (!config.storage_type || !config.storage_path) {
      console.error(chalk.red('❌ Storage not configured. Run `repostem init` first.'));
      process.exit(1);
    }

    const adapter = AdapterFactory.createAdapterFromString(config.storage_type, config.storage_path);

    try {
      await adapter.connect();

      if (options.status) {
        console.log(chalk.blue('📊 Migration Status\n'));
        const status = await getMigrationStatus(adapter);
        
        console.log(chalk.green(`✅ Completed migrations (${status.completed.length}):`));
        status.completed.forEach((m: string) => console.log(`   - ${m}`));
        
        console.log(chalk.yellow(`\n⏳ Pending migrations (${status.pending.length}):`));
        if (status.pending.length === 0) {
          console.log('   (none)');
        } else {
          status.pending.forEach((m: string) => console.log(`   - ${m}`));
        }
      } else {
        console.log(chalk.blue('🔄 Running migrations...\n'));
        const result = await runKnexMigrations(adapter);

        if (result.success) {
          console.log(chalk.green(`✅ ${result.message}`));
          if (result.migrationsRun.length > 0) {
            console.log(chalk.gray('\nMigrations applied:'));
            result.migrationsRun.forEach((m: string) => console.log(chalk.gray(`   - ${m}`)));
          }
        } else {
          console.error(chalk.red(`❌ ${result.message}`));
          process.exit(1);
        }
      }

      await adapter.disconnect();
    } catch (error) {
      console.error(chalk.red('❌ Migration failed:'), error instanceof Error ? error.message : error);
      try {
        await adapter.disconnect();
      } catch {}
      process.exit(1);
    }
  });

export default migrateCommand;
