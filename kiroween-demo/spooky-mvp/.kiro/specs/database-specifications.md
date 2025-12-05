# Database Specifications - spooky-mvp

## Database Schema

### Core Models
```prisma
// User model (Better Auth)
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  firstName     String?
  lastName      String?
  stripeCustomerId String?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  sessions      Session[]
  accounts      Account[]
  verification  Verification[]
  posts         Post[]
  
  @@map("users")
}

// Session model (Better Auth)
model Session {
  id          String   @id @default(cuid())
  userId      String
  expiresAt   DateTime
  token       String   @unique
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

// Post model (Example)
model Post {
  id          String   @id @default(cuid())
  name        String
  content     String?
  
  // Relations
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("posts")
}
```

## Database Operations

### Query Patterns
```typescript
// Standard query with relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      take: 10,
      orderBy: { createdAt: 'desc' }
    }
  }
});

// Paginated query
const posts = await prisma.post.findMany({
  where: { createdById: userId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
  include: {
    createdBy: {
      select: { name: true, email: true }
    }
  }
});

// Transaction example
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id: userId },
    data: { lastName: newLastName }
  });
  
  const post = await tx.post.create({
    data: {
      name: 'New Post',
      createdById: userId
    }
  });
  
  return { user, post };
});
```

## Performance Specifications

### Indexing Strategy
```prisma
// Recommended indexes
model User {
  // ... fields
  
  @@index([email])
  @@index([createdAt])
}

model Post {
  // ... fields
  
  @@index([createdById])
  @@index([createdAt])
  @@index([createdById, createdAt])
}

model Session {
  // ... fields
  
  @@index([userId])
  @@index([expiresAt])
  @@index([token])
}
```

### Query Optimization
- Use `select` to fetch only needed fields
- Implement pagination for large datasets
- Use transactions for related operations
- Batch operations when possible

## Data Integrity

### Validation Rules
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique @db.VarChar(255)
  
  // Validation
  @@validate(email, "Email must be valid", isEmail(email))
}

model Post {
  id      String @id @default(cuid())
  name    String @db.VarChar(255)
  content String? @db.Text
  
  // Validation
  @@validate(name, "Name cannot be empty", name != "")
}
```

### Migration Safety
```bash
# Safe migration workflow
pnpm prisma migrate dev --name add_user_profile
pnpm prisma generate
pnpm db:push  # For development
pnpm test:db  # Run database tests

# Production deployment
pnpm prisma migrate deploy
pnpm prisma generate
```

## Data Management

### Backup Strategy
- Automated daily backups
- Point-in-time recovery enabled
- Backup verification procedures
- Disaster recovery plan

### Data Retention
- User data: Retained while account active
- Session data: Automatic expiry
- Audit logs: 7 years retention
- Soft delete implementation preferred

## Monitoring & Analytics

### Performance Metrics
- Query execution time monitoring
- Connection pool utilization
- Index usage statistics
- Deadlock detection

### Health Checks
```typescript
// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, timestamp: new Date() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date() };
  }
}
```
