# Security Specifications

## General Security Practices

### Input Validation
- **tRPC Procedures**: Use Zod schemas for all input validation on the server-side.
- **Next.js API Routes**: Validate request body and query parameters explicitly.
- **Client-side**: Validation is helpful for UX but never trusted; server-side validation is mandatory.

### Output Encoding
- **React**: Handles basic XSS prevention for text content. Be cautious with `dangerouslySetInnerHTML`.
- **Database**: Prisma handles SQL injection prevention through parameterized queries.

### Authentication & Authorization
- **Authentication**: Handled by Better Auth (session cookies).
- **Authorization**: Use tRPC's `protectedProcedure` for auth checks. Implement custom RBAC logic within procedures/routers or Next.js API routes for fine-grained control.

### Secrets Management
- Store API keys, database URLs, auth secrets in environment variables.
- Never commit secrets to version control (.env.example is okay for structure).
- Use different secrets for development and production.

### API Security
- Implement rate limiting for public endpoints if necessary.
- Use HTTPS in production.
- Validate and sanitize data received from external APIs (e.g., Stripe webhooks, Resend responses).
- Log security-relevant events.
- Secure webhook endpoints with signature verification (e.g., Stripe).

### Data Protection
- Encrypt sensitive data at rest if required by compliance (e.g., GDPR).
- Use secure protocols for data transmission (HTTPS).
- Follow data minimization principles (e.g., store only necessary fields from Stripe).

## FILL IN FOR YOUR PROJECT:
- [ ] Define specific RBAC rules if implemented beyond basic roles.
- [ ] Add details about data encryption if used.
- [ ] Specify rate limiting strategies.
- [ ] Detail compliance requirements (e.g., GDPR, CCPA).
