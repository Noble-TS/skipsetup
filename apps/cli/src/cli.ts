#!/usr/bin/env node
import { Cli, Builtins } from 'clipanion';
import { InitCommand } from './commands/init.js';
import { SecretsCommand } from './commands/secrets.js';
import { DeployCommand } from './commands/deploy.js';

const cli = new Cli({
  binaryName: 'skipsetup',
  binaryVersion: '0.1.0',
});

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.register(InitCommand);
cli.register(SecretsCommand);
cli.register(DeployCommand);

void cli.run(process.argv.slice(2));
