# Held-back feature source

This directory keeps future feature code in version control without publishing it. Both GitHub Pages and Netlify deploy only the repository's top-level `public/` directory.

Currently held back:

- Quotes and invoices
- Project support
- RAMS builder
- Council estate review, its check library and one-pager
- Business hub

The feature-owned browser structure is preserved under `unreleased/public/`, including the private design-system bundle and feature-specific runtime files. When a page moves back to the deployed `public/` directory, it reconnects to the released shared runtime and vendor assets already there.

## Release checklist

When a feature is ready:

1. Move its page and required assets back into the top-level `public/` directory.
2. Enable its `RELEASE_FLAGS` entry and restore its navigation entry where applicable.
3. Review old local-storage migrations without deleting existing browser data.
4. Add the feature to the landing page only after its direct URL, accessibility and end-to-end journey pass review.
5. Update the release-gate tests so the intended public surface remains explicit.

Do not configure either host to publish this directory.
