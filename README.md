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

## Deployment

The app runs on Render at https://fso-cicd-bloglist.onrender.com. Every push to `main` that passes lint, tests, the build and the end-to-end tests is deployed by the pipeline, which then waits until `/health` answers and `/version` reports the new commit. Successful deployments are tagged with a patch version.

## Contributing

`main` is protected: changes go through a pull request that needs an approving review and passing lint, unit, build and end-to-end checks, and this applies to administrators too.
