# Component Specifications - spooky-mvp

## Design System Components

### Button Component
```typescript
// src/app/_components/ui/button/Button.tsx
interface ButtonProps {
  variant: "primary" | "outline" | "ghost" | "t3-purple" | "glass";
  size: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

// Usage examples
<Button variant="t3-purple" size="lg">Primary Action</Button>
<Button variant="outline" size="md">Secondary Action</Button>
<Button variant="ghost" size="sm">Tertiary Action</Button>
<Button variant="glass" loading={true}>Loading</Button>
```

### Input Component
```typescript
// src/app/_components/form/input/InputField.tsx
interface InputFieldProps {
  label: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Usage example
<InputField
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

## Component Patterns

### Form Handling Pattern
```typescript
// Standard form component structure
export function UserSettingsForm() {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Form validation
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      // API call
      await api.user.update.mutate(formData);
      
      // Success handling
      toast.success("Settings updated successfully");
    } catch (error) {
      // Error handling
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
    </form>
  );
}
```

### Data Fetching Pattern
```typescript
// Standard data fetching with React Query
export function UserProfile() {
  const { data: user, isLoading, error } = api.user.get.useQuery();
  
  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <EmptyState />;
  
  return (
    <div className="profile-container">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Component Requirements

### Accessibility Standards
- All interactive elements must be keyboard accessible
- Proper ARIA labels for screen readers
- Sufficient color contrast ratios
- Focus indicators for all interactive elements

### Responsive Design
- Mobile-first approach required
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts with Tailwind CSS
- Touch-friendly interface elements

### Performance Requirements
- Code splitting for route-level components
- Lazy loading for below-fold content
- Optimized images with Next.js Image
- Memoization for expensive computations

## Component Testing

### Test Structure
```typescript
// Component test example
describe('Button Component', () => {
  it('renders with correct variant and size', () => {
    render(<Button variant="primary" size="lg">Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('bg-purple-600', 'px-6', 'py-3');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Requirements
- Unit tests for all components
- Integration tests for complex interactions
- Accessibility testing with axe-core
- Visual regression testing
