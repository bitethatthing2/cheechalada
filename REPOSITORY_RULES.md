# Repository Rules

## IMPORTANT: FOLLOW THESE RULES EXACTLY

1. **NO NEW BRANCHES** without explicit permission
   - Only use existing branches: `main`, `production`, and `fix-build-error`
   - Never create new branches without direct permission

2. **ALWAYS CONFIRM BEFORE PUSHING**
   - Never use `--force` without specific permission
   - Always explain what changes will be pushed

3. **NO MODIFICATIONS TO DEPLOYMENT SETTINGS**
   - Do not modify Vercel configuration
   - Do not change GitHub workflows
   - Do not alter deployment targets

4. **COMMIT MESSAGES**
   - Use clear, descriptive commit messages
   - Always prefix with appropriate type: `fix:`, `feat:`, `docs:`, etc.
   - Example: `fix: resolve login redirection issue`

5. **CODE STANDARDS**
   - Maintain existing code style and patterns
   - Run linters before committing
   - Ensure tests pass before pushing

6. **REPOSITORY STRUCTURE**
   - Maintain the existing file organization
   - Do not reorganize directories without permission

7. **DEPENDENCIES**
   - Do not add new dependencies without permission
   - Do not upgrade major versions of existing dependencies

These rules are mandatory. Failure to follow them will result in broken deployments and repository issues.
