# skipsetup
Build full-stack apps that are the right size, right now. Stop over-engineering weekend projects or under-building SaaS apps. Choose your size—small, medium, or large—and get a tailored stack with auth, payments, and deployment ready in minutes. Start coding what matters, not the setup.

pnpm build
node apps/cli/dist/cli.js create mylarge2 --size large 

npx skipsetup-cli create mysmall --size small


Better Auth Stripe Plugin Features by Project Scale
Based on the Better Auth Stripe plugin capabilities, here's my recommendation for project scale:

🏢 Medium Projects (SMB/Startups)
Core Features:
auth, sso, admin plugin,
resend 
Stripe:
✅ Complete subscription lifecycle (create, upgrade, cancel, restore)
✅ Customer management
✅ Webhook processing
✅ Trial management
Why Medium Projects:

Simple user-to-subscription mapping
Basic plan management with trials
Standard webhook handling for subscription events
Individual user billing scenarios

: and exmaple pages 


for small projects :
signin/signup, otp , email verification
resend
stripe sdk , for one  time payment and checkout integration

