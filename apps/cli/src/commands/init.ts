import { Command, Option } from 'clipanion';
import { ProjectSizeSchema, type ProjectSize, projectSizes } from '@forge/core';
import { scaffoldProject } from '../core/scaffold.js';

export class InitCommand extends Command {
  static paths = [['create']];
  name = Option.String({ required: true });
  size = Option.String('--size', 'small');
  template = Option.String('--template', 't3');

  async execute() {
    const parsedSize = ProjectSizeSchema.safeParse(this.size);
    if (!parsedSize.success) {
      this.context.stdout.write('Invalid size: must be small, medium, large\n');
      return;
    }
    const size = parsedSize.data as ProjectSize;
    console.log(`Using config:`, projectSizes[size]);
    await scaffoldProject(size, this.template, this.name);
    this.context.stdout.write(`Project '${this.name}' ready!\n`);
  }
}
