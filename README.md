# Pull

Collective demand event platform. Fans signal “I would go to this” before an event exists; organizers use soft and hard pledges to decide whether a booking is viable.

## MVP Shape

- Campaign discovery and shareable campaign pages
- Organizer campaign creation
- Soft pledges for attendance intent
- Hard pledge placeholders for refundable Stripe authorizations
- Public threshold progress: pledged amount, supporters, days left, percent complete
- Prisma models for users, campaigns, pledges, campaign states, and payment states
- Dynamic Open Graph image route per campaign

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Stripe SDK, ready for authorization flow integration
- Plain CSS for the initial interface

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment variables:

   ```bash
   cp .env.example .env
   ```

3. Point `NEON_URL` at a local PostgreSQL or Neon database.

4. Run the database migration and seed:

   ```bash
   npm run prisma:migrate -- --name init
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## Next Decisions

- Choose auth: Privy or magic-link email.
- Replace placeholder local users in API routes with the authenticated user.
- Implement Stripe PaymentIntent setup for hard pledge authorization without capture.
- Add campaign moderation controls for `GREENLIT`, `EXPIRED`, and `CANCELLED`.
