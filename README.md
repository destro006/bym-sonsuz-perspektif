# BYM İnşaat — Sonsuz Perspektif (Claude Code Starter)

**Purpose:** A real-time 3D scroll-story website starter for BYM İnşaat: cosmic particles → galaxy → Earth → provisional region handoff → *unapproved* project-photo bridge → architecture/portfolio framework. UI text is Turkish. Original BYM logo is a separate unmodified image asset.

> This is a starter kit and implementation brief, **not** a complete verified building walk-through. There is no confirmed Rüya Şehir GLB, no functioning free-roam apartment, no authoritative geographic fly-to, and the project photography is deliberately marked as *review required*. Avoid presenting the prototype as a finished deployed client website.

## First step for Claude

Read `CLAUDE.md`, `docs/SKILL_WORKFLOW.md`, `docs/SOURCE_POLICY.md`, `data/chapters.json` and the source components. Follow the skill availability verification instructions. Use `START_HERE_CLAUDE.md` as the ready-to-paste kickoff message.

## Local development

Requirements: Node.js >= 20.9 and npm.

```bash
npm install
npm run lint:assets
npm run dev
```

Open http://localhost:3000 in a browser. For production validation, run `npm run build` and inspect actual browser rendering.

## Included

- Original BYM logo (do not modify)
- Real-time GLSL/WebGL galaxy particle prototype
- Earth sphere texture and atmosphere shader prototype
- Reversible scroll-controlled progress architecture
- Turkish minimal premium UI starter
- Project facts and scroll chapter manifest
- Source photo placeholders marked unapproved, and one high-resolution plan
- Skill routing and architectural authenticity instructions

## Main dependencies

Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, GSAP and Framer Motion 14.14.0. Note: these npm libraries are dependencies to be installed by npm; they are **not bundled**. Claude Code skills are likewise referenced but **not bundled** in this ZIP.

## What is missing before client launch

- Client-approved Rüya Şehir main project imagery
- Correctly sourced model, all elevations and exact project coordinates
- Architectural model's verified floor/door/window hierarchy for interactive floor separation
- Video rights verification and source provenance
- Browser/regression/performance checks and contact form backend

## Package integrity

Run `npm run lint:assets`. It checks presence of required files and blocks two known misattributed source names; human approval is still required.
