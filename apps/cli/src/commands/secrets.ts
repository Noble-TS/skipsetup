import { Command, Option } from 'clipanion';
import { setSecret } from '../core/secrets.js';

export class SecretsCommand extends Command {
  static paths = [['secrets', 'set']];
  key = Option.String({ required: true });
  value = Option.String({ required: true });

  async execute() {
    await setSecret(this.key, this.value);
    this.context.stdout.write(`Secret '${this.key}' encrypted and saved.\n`);
  }
}
