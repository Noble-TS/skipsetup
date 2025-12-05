# Component Specifications

## Design System Components

### Button Component (Example)
```typescript
// src/app/_components/ui/button/Button.tsx (Conceptual)
interface ButtonProps {
  variant?: "default" | "primary" | "outline" | "t3-purple" | "glass" | "emerald"; // Follow existing theme
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset'; // Important HTML attribute
}

// Variants (Follow existing theme)
- default: Standard styling
- primary: Prominent action
- outline: Secondary action
- t3-purple: T3 stack theme
- glass: Glassmorphism effect
- emerald: Emerald/green theme (for actions like 'Add to Cart', 'Checkout')

// Sizes
- sm: Small (e.g., height: 32px)
- md: Medium (e.g., height: 40px) - Default
- lg: Large (e.g., height: 48px)
- xl: Extra large (e.g., height: 56px)
```

### Input Component (Example)
```typescript
// src/app/_components/form/input/InputField.tsx (Conceptual)
interface InputFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  type?: "text" | "email" | "password" | "number";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void; // Or (e: React.ChangeEvent<HTMLInputElement>)
}

// States
- Default: Standard input appearance
- Error: Visual indication (e.g., red border) with error message
- Success: Visual indication (e.g., green border)
- Disabled: Non-interactive, visually distinct
```

## Component Development Standards
- All components must be strongly typed using TypeScript interfaces.
- Use Tailwind CSS utility classes for styling - no custom CSS files for components.
- Implement responsive design using Tailwind's responsive prefixes (sm:, md:, lg:, etc.).
- Follow accessibility guidelines (e.g., proper labeling, ARIA attributes where needed).
- Use relative imports from the project root: `import Component from "~/path/to/component";`.
- Maintain consistent naming conventions (PascalCase for components, camelCase for props).
- Include default props where appropriate for common configurations.
- Prefer composition (child components, render props) over complex conditional rendering within a single component file.
- Integrate with React Contexts where necessary (e.g., CartContext for product buttons).
