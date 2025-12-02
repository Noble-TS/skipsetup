import { z } from 'zod';
export declare const ProjectSizeSchema: z.ZodEnum<['small', 'medium', 'large']>;
export type ProjectSize = z.infer<typeof ProjectSizeSchema>;
export declare const projectSizes: Record<
  ProjectSize,
  {
    description: string;
    modules: string[];
    plugins: string[];
    infra: string[];
  }
>;
//# sourceMappingURL=sizes.d.ts.map
