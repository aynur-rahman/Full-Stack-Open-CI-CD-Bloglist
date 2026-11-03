# Bloglist

Full Stack Open bloglist app (parts 4-7) with its own CI/CD pipeline for Full Stack Open Part 11, exercise 11.21.

The Express backend is in `server/`, the React frontend in `client/`, and the Playwright end-to-end tests in `e2e-tests/`. The backend serves the production build of the frontend.

## Local development

Use Node 24 (`.nvmrc`), then:

```sh
npm ci
npm run setup
npm run dev
```

## Checks

- `npm run lint`
- `npm test` (backend and frontend tests)
- `npm run build`
- `npm run test:e2e` (production build against a temporary MongoDB)
