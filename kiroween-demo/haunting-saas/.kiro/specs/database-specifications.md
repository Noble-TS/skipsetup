# Database Specifications

## Database Schema (Prisma)

### Core Models (Based on provided schema and code)
```prisma
// User model (Better Auth adds fields, example with custom fields)
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String?
  firstName           String?
  lastName            String?
  image               String?  // Profile picture URL
  emailVerified       DateTime?
  stripeCustomerId    String?  // Link to Stripe customer
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  orders              Order[]  // User's orders
  // ... other relations (posts if applicable)
}

// Product model
model Product {
  id              String    @id @default(cuid())
  name            String
  description     String?
  price           Int       // Price in cents (e.g., 2999 for $29.99)
  image           String?   // Product image URL
  stock           Int       // Available stock
  category        String?   // Product category
  active          Boolean   @default(true)
  stripeProductId String?   // Stripe product ID
  stripePriceId   String?   // Stripe price ID
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String    // User ID (foreign key)
  user            User      @relation(fields: [createdBy], references: [id])
  orderItems      OrderItem[] // Junction table items referencing this product

  @@map("products")
}

// Order model
model Order {
  id              String      @id @default(cuid())
  status          OrderStatus @default(PENDING)
  totalAmount     Int         // Total in cents
  userId          String      // User ID (foreign key)
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[] // Junction table items for this order
  stripeSessionId String?     // Link to Stripe checkout session
  shippingAddress String?     // Store as JSON string or separate address model
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// Junction table for Order Items
model OrderItem {
  id         String   @id @default(cuid())
  quantity   Int      // Quantity ordered
  price      Int      // Price per item at time of order (in cents)
  productId  String   // Product ID (foreign key)
  orderId    String   // Order ID (foreign key)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Restrict) // Restrict delete if items exist
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade) // Delete items if order is deleted

  @@unique([orderId, productId]) // Prevent duplicate products in an order
  @@map("order_items")
}

enum OrderStatus {
  PENDING     // Checkout session created
  PROCESSING  // Payment received, processing
  PAID        // Payment confirmed and processed
  CANCELLED   // Order cancelled
  REFUNDED    // Order refunded
  SHIPPED     // Order shipped
  DELIVERED   // Order delivered
}

// Example Post model (from reference, if used)
model Post {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   // User ID (foreign key)
  user        User     @relation(fields: [createdBy], references: [id])

  @@map("posts")
}
```

### Database Operations Standards
- Use Prisma Client for all database interactions (findMany, create, update, etc.).
- Implement proper error handling around Prisma calls (try/catch).
- Use transactions (`await db.$transaction([...])`) for operations that must succeed or fail together (e.g., creating an order and its items).
- Validate data before passing it to Prisma queries (using Zod or other validators).
- Consider adding database indexes for frequently queried fields (e.g., `status` on Order, `userId` on Order).
- Follow Prisma's relation syntax for defining and querying related data.
- Store prices in cents (Int type) to avoid floating-point precision issues.
- Store complex objects like `shippingAddress` as JSON strings if not requiring relational queries, otherwise create a separate Address model.
