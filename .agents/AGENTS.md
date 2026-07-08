# Custom Project Guidelines

## Versioning
- This project uses a visible version number located in `src/components/Dashboard.jsx` (e.g., `const APP_VERSION = "v1.1.0";`).
- **CRITICAL RULE:** Whenever you make a non-major update (bug fixes, small features, UI tweaks), you MUST always increase the minor/patch version by 1 (e.g., from `v1.1.0` to `v1.1.1` or `v1.2.0`). Do not forget to update this constant in the file before deploying.
