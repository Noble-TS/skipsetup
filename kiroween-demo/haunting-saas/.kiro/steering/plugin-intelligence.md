# Plugin Activation Intelligence

## PROJECT STRUCTURE & INTEGRATIONS
### Activation Hook Execution
The project was initialized with specific configurations for:
1.  **Authentication**: Better Auth with Prisma adapter, email OTP, admin plugins.
2.  **Database**: PostgreSQL with Prisma schema including standard models and auth models.
3.  **API Layer**: tRPC configured with context including database client and session.
4.  **Frontend**: Next.js App Router, Tailwind CSS, TanStack Query for data fetching.
5.  **UI Components**: Reusable component library with auth, form, layout, and base UI elements.
6.  **Context Management**: React Context for theme, sidebar, cart state.
7.  **Type Safety**: TypeScript throughout, Zod for input validation.
8.  **Payment Integration**: Stripe setup for Checkout Sessions and Webhooks.
9.  **Email Integration**: Resend for sending notifications (e.g., order confirmations).
10. **Authorization**: Custom Role-Based Access Control (RBAC) system.

### Key Integrations
- **Better Auth**: Handles user sessions, passwords, OTP.
- **Prisma**: ORM for database interactions.
- **tRPC**: Type-safe communication between frontend and backend.
- **TanStack Query**: Client-side data fetching and caching.
- **Tailwind CSS**: Styling framework.
- **Zod**: Runtime validation.
- **Stripe**: Payment processing.
- **Resend**: Email delivery.
- **Custom RBAC**: Fine-grained permissions.
