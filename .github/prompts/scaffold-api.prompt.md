---
description: Scaffolds a new Mongoose Model, Express Controller, and Router module.
---

Please scaffold a new feature module for the backend server. Feature name: {{prompt}}

Required artifacts:
1. Mongoose schema & model with `timestamps: true`.
2. Express controller using a `catchAsync` wrapper (assume it exists). Implement standard CRUD operations (getAll, getOne, create, update, delete).
3. Express router tying the controller methods to standard RESTful endpoints.

Make sure to separate these into logically separated files (e.g., `model.js`, `controller.js`, `routes.js`) according to the existing project structure in `./server`. Follow all rules from `copilot-instructions.md`.