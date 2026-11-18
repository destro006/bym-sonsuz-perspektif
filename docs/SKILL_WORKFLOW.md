# BYM İnşaat — Skill Usage Matrix

This manifest **references** the user's existing Claude Code skills; their actual source files are not copied into this ZIP. Claude must run `npx skills ls -g` and read each installed SKILL.md. Skill registration is not proof of successful execution.

## Skill discovery

Expected global skills from the user's previously verified listing:

- `awwwards-3d` — reportedly cloned and repaired manually at `~/.claude/skills/awwwards-3d`; check `SKILL.md` YAML, location and instructions first.
- `immersive-3d-web` — spatial storytelling architecture.
- `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils` — a GSAP skill suite; inspect the skill texts to avoid overlapping tasks.
- `polyhaven` — legitimate HDRI and texture sourcing with licensing checks.
- Plugin skills: `frontend-design:frontend-design`, `design:design-system`, `design:design-critique`, `design:accessibility-review`, `searchfit-seo:on-page-seo`, `searchfit-seo:schema-markup`.

Some user sessions may list additional skills. Do not automatically load all of them.

## Step-by-step usage

1. **Visual narrative / creative direction**: `awwwards-3d` + `immersive-3d-web` + `frontend-design:frontend-design` + `design:design-system`. Design a continuous universe-to-architecture route and refine the minimal cream UI.
2. **Scroll and camera**: `gsap-core` + `gsap-scrolltrigger` + `gsap-timeline` + `gsap-react` + `gsap-frameworks`. Drive all 3D state from a single normalized scroll source. Scrub both forward and backward.
3. **Galactic shader scene**: `immersive-3d-web` + `gsap-performance` + `gsap-utils`. Particle points and shaders, no video shortcuts.
4. **PBR and lighting**: `polyhaven` + `immersive-3d-web`; only authorized HDRI/PBR sources, small optimized delivery files, texture attribution.
5. **Page UI and polish**: `frontend-design:frontend-design` + `design:design-system` + `design:design-critique`. Use real visual testing and screenshots.
6. **Accessibility and publishing**: `design:accessibility-review` + `searchfit-seo:on-page-seo` + `searchfit-seo:schema-markup` + `gsap-performance`. Reduced motion, no-WebGL fallback, real metadata and verified structured data.

## Acceptance checklist

- [ ] Installed skill paths and their SKILL.md instructions inspected.
- [ ] `npm run lint:assets` passes.
- [ ] `npm run build` passes or exact blocker recorded.
- [ ] GPU scene tested in desktop browser and mobile viewport.
- [ ] Scroll is deterministic, reversible, and scrub-safe (move down, up, jump to midpoint).
- [ ] Original logo file checksum remains unchanged.
- [ ] Fake/AI imagery not passed off as BYM-built projects.
- [ ] Exact project coordinates and GLB are only used if verified.
- [ ] UI is entirely Turkish and navigation keyboard accessible.
