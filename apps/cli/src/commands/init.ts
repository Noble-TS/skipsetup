import { Command, Option } from 'clipanion';
import {
  ProjectSizeSchema,
  type ProjectSize,
  projectSizes,
} from '@skipsetup/core';
import { scaffoldProject } from '../core/scaffold.js';
import figlet from 'figlet';
import gradient from 'gradient-string';

// Reusing your specific color palette for consistency
const STYLE = {
  primary: '\x1b[38;2;99;102;241m', // Indigo
  accent: '\x1b[38;2;6;182;212m', // Cyan
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  gray: '\x1b[38;2;107;114;128m',
};

export class InitCommand extends Command {
  static paths = [['create']];
  name = Option.String({ required: true });
  size = Option.String('--size', 'small');
  template = Option.String('--template', 't3');

  async execute() {
    // 1. Print Gradient Logo
    const logo = figlet.textSync('SKIPSETUP', {
      font: 'Standard',
      horizontalLayout: 'full',
    });
    console.log(gradient.pastel.multiline(logo));

    // 2. Validate Size
    const parsedSize = ProjectSizeSchema.safeParse(this.size);
    if (!parsedSize.success) {
      this.context.stdout.write(
        `${STYLE.bold}Invalid size:${STYLE.reset} must be small, medium, or large\n`
      );
      return;
    }
    const size = parsedSize.data as ProjectSize;
    const config = projectSizes[size];

    // 3. Enhanced Config UI (Replacing the raw console.log)
    this.printConfigTable(size, config);

    // 4. Run Scaffold
    await scaffoldProject(size, this.template, this.name);

    // 5. Final spacing
    console.log('');
  }

  // Helper to print the "Using config" section cleanly
  private printConfigTable(size: string, config: any) {
    const label = (text: string) =>
      `${STYLE.gray}${text.padEnd(12)}${STYLE.reset}`;
    const tag = (text: string) =>
      `${STYLE.dim}[${STYLE.reset}${STYLE.accent}${text}${STYLE.reset}${STYLE.dim}]${STYLE.reset}`;

    console.log(
      `\n${STYLE.primary}${STYLE.bold}  CONFIGURATION DETECTED${STYLE.reset}`
    );
    console.log(
      `${STYLE.gray}  ──────────────────────────────────────${STYLE.reset}`
    );

    // Description
    console.log(
      `  ${label('Profile')} ${STYLE.bold}${size.toUpperCase()}${STYLE.reset}`
    );
    console.log(
      `  ${label('Description')} ${STYLE.dim}${config.description}${STYLE.reset}`
    );

    console.log(''); // Spacer

    // Modules (using badges/tags style)
    if (config.modules?.length) {
      console.log(`  ${label('Modules')} ${config.modules.map(tag).join(' ')}`);
    }

    // Plugins
    if (config.plugins?.length) {
      console.log(`  ${label('Plugins')} ${config.plugins.map(tag).join(' ')}`);
    } else {
      console.log(`  ${label('Plugins')} ${STYLE.dim}None${STYLE.reset}`);
    }

    // Infra
    if (config.infra?.length) {
      console.log(`  ${label('Infra')} ${config.infra.map(tag).join(' ')}`);
    }

    console.log(
      `${STYLE.gray}  ──────────────────────────────────────${STYLE.reset}\n`
    );
  }
}
