import { defineConfig } from 'orval';

/**
 * Orval — generates typed API clients from the backend OpenAPI/Swagger specs.
 *
 * Run:  npm run generate:api
 *
 * Prerequisites: all backend services must be running (docker compose up -d)
 *
 * Output:  src/generated/<service>Api.ts
 *   Each file exports fully-typed functions + interfaces derived from the live spec.
 *   Import generated functions directly:
 *     import { getTasksTaskId } from '../generated/taskApi';
 *
 * The custom `mutator` wires every generated call through src/lib/mutators.ts,
 * so auth tokens and error interceptors are applied automatically.
 */

const MUTATOR_PATH = './src/lib/mutators.ts';

export default defineConfig({
  // ── Task Management (port 3003) ──────────────────────────────────────────
  taskService: {
    input: {
      target: 'http://localhost:3003/api/docs-json',
    },
    output: {
      mode: 'single',
      target: 'src/generated/taskApi.ts',
      client: 'axios',
      override: {
        mutator: { path: MUTATOR_PATH, name: 'taskServiceMutator' },
      },
    },
  },

  // ── Project Management (port 3004) ───────────────────────────────────────
  projectService: {
    input: {
      target: 'http://localhost:3004/api/docs-json',
    },
    output: {
      mode: 'single',
      target: 'src/generated/projectApi.ts',
      client: 'axios',
      override: {
        mutator: { path: MUTATOR_PATH, name: 'projectServiceMutator' },
      },
    },
  },

  // ── Auth Service (port 3002) ─────────────────────────────────────────────
  authService: {
    input: {
      target: 'http://localhost:3002/api/docs-json',
    },
    output: {
      mode: 'single',
      target: 'src/generated/authApi.ts',
      client: 'axios',
      override: {
        mutator: { path: MUTATOR_PATH, name: 'authServiceMutator' },
      },
    },
  },

  // ── Workflow Engine (port 3001) ──────────────────────────────────────────
  workflowService: {
    input: {
      target: 'http://localhost:3001/api/docs-json',
    },
    output: {
      mode: 'single',
      target: 'src/generated/workflowApi.ts',
      client: 'axios',
      override: {
        mutator: { path: MUTATOR_PATH, name: 'workflowServiceMutator' },
      },
    },
  },

  // ── Annotation QA Service (port 3005) ────────────────────────────────────
  annotationQaService: {
    input: {
      target: 'http://localhost:3005/api/docs-json',
    },
    output: {
      mode: 'single',
      target: 'src/generated/annotationQaApi.ts',
      client: 'axios',
      override: {
        mutator: { path: MUTATOR_PATH, name: 'annotationQaServiceMutator' },
      },
    },
  },
});
