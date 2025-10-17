import { Command, Option } from 'clipanion';
import { injectSecrets } from '../core/secrets.js';
import { execSync } from 'child_process';

export class DeployCommand extends Command {
  static paths = [['deploy']];
  env = Option.String('--env', { required: false });

  async execute() {
    await injectSecrets();
    this.context.stdout.write(
      `Deploying to ${this.env ?? 'prod'} with secrets...\n`
    );
    execSync(`echo "Deploy stub"`, { stdio: 'inherit' });
  }
}
