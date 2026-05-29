# Avenue Savings

Avenue Savings is a standalone household finance app built with Next.js, React, and Zustand. It uses the existing Memory Router Cosmos DB `memory_router_users` container only for authentication. Savings, bills, expenses, groups, and invites stay separate from Memory Router/Vishwa OS app state.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`. Use the same Memory Router Cosmos values as `vishwa-os`:

```bash
MR_COSMOS_ENDPOINT=https://cosmodb-free-tier.documents.azure.com:443/
MR_COSMOS_KEY=your-cosmos-key
MR_COSMOS_DATABASE=memory-router
MR_COSMOS_USERS_CONTAINER=memory_router_users
MR_JWT_SECRET=replace-with-a-strong-32-character-secret
```

3. Confirm the Azure resources:

```bash
az cosmosdb sql container show --account-name cosmodb-free-tier --resource-group CosmoDB_Free_Tier --database-name memory-router --name memory_router_users
```

4. Start the Next.js app. To reuse the sibling `vishwa-os` Memory Router environment without copying secrets:

```bash
npm run dev:memory-router
```

Or start Next directly after setting the env vars:

```bash
npm run dev
```

## Production

Set the `MR_COSMOS_ENDPOINT`, `MR_COSMOS_KEY`, `MR_COSMOS_DATABASE`, `MR_COSMOS_USERS_CONTAINER`, and `MR_JWT_SECRET` values in the hosting provider. The Cosmos key and JWT secret must remain server-side only.

## Validation

```bash
npm test
npm run build
```

`npm test` covers recurring bill helpers plus store-level auth, invite, group permission, and bill mutation flows with Cosmos auth mocked and Avenue finance data isolated locally.
