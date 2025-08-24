# serializable-transaction-isolation-demo

## Getting Started

```sh
bun install

bun prisma db push # --force-reset # force reset if want to start from clean state

# don't forget to point DATABASE_URL to your DB
cp .env.example .env

bun run demo:default-isolation

bun run demo:serializable-isolation
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
