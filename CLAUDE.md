# BYM İNŞAAT — SONSUZ PERSPEKTİF
## Claude Code Project Instructions — v1.1 (Skill-Integrated)

> **READ THIS FIRST.** You are implementing an interactive architectural experience, not a generic real-estate landing page. The user wants a scroll-controlled, fully reversible, real-time 3D journey: **Cosmic web → Galaxy → Earth → verified Turkish location → real BYM project → architecture → portfolio**.
>
> **User interface is 100% Turkish.** Developer documentation and source identifiers can be English.

## 0 — First action in Claude Code

1. Open and read this `CLAUDE.md`, `README.md`, `docs/SKILL_WORKFLOW.md`, `docs/SOURCE_POLICY.md`, `data/chapters.json`, `data/project-facts.json` and the current scene components.
2. **Discover installed skills in this environment**, rather than assuming every listed skill is loaded: run `npx skills ls -g`, inspect the corresponding `SKILL.md` files that exist. If unavailable, continue with standard expertise and report the missing skill, rather than faking skill usage.
3. Verify Node.js, npm, package versions, real source assets and missing GLB assets. `npm install` if project dependencies are not installed; report installation failures.
4. Run `npm run lint:assets`, then `npm run build`, then open the app with a real browser and inspect the rendered scene before calling it completed.
5. Do not get trapped in planning. Implement the most important **working** improvements after the audit.

## 1 — Mandatory skill routing

Use **only relevant, available** installed skills. Follow their actual instructions. Project priority and routing:

| Priority | Skill | Usage |
|---|---|---|
| P0 | `awwwards-3d` | Award-level creative direction, 3D spatial storytelling, transitions. Inspect manually repaired local `~/.claude/skills/awwwards-3d/SKILL.md` if available; untracked status is not a runtime verification. |
| P0 | `immersive-3d-web` | Multistage immersive WebGL journey, scale-domain transitions, GPU-aware 3D layout. |
| P0 | `gsap-core` | Deterministic animation architecture and timeline mechanics. |
| P0 | `gsap-scrolltrigger` | Single source of scroll progress, forward and backward synchronization. |
| P0 | `gsap-timeline` | Scene timing, keyframes, transitions, progress mapping. |
| P1 | `gsap-performance` | Layout stability, GPU optimization, cleanup and mobile frame rate. |
| P1 | `gsap-react` | Integration and lifecycle-safe context/cleanup in React. |
| P1 | `gsap-frameworks` | React/Next.js lifecycle and SSR-compatible GSAP patterns. |
| P1 | `gsap-plugins` | Only plugins actually installed and licensed. |
| P1 | `gsap-utils` | Reusable easing, sequencing and interpolation helpers. |
| P1 | `polyhaven` | Realistic, appropriately licensed HDRIs and PBR textures, not fictional BYM architecture. |
| P2 | `frontend-design:frontend-design` | Premium architecture-inspired cream/ivory navigation and UI. |
| P2 | `design:design-system` | Typography, spacing, component tokens, visual consistency. |
| P2 | `design:design-critique` | Iterative visible-browser review. |
| P2 | `design:accessibility-review` | Keyboard, reduced-motion, contrast and semantics. |
| P3 | `searchfit-seo:on-page-seo` | Accurate Turkish metadata and meaningful page titles. |
| P3 | `searchfit-seo:schema-markup` | Schema markup containing only verified business/project facts. |

OPTIONAL, **only if found locally**: `threejs-lighting`, `threejs-materials`, `threejs-postprocessing`, `threejs-r3f`, `threejs-skills`; do not describe these as installed without discovery.

See `docs/SKILL_WORKFLOW.md` for stage-by-stage combinations and validation checks. Skills teach methods; they are not asset files, WebGL code, paid models, or evidence that a render was tested. Never claim successful runtime use solely because a skill appears in a listing.

## 2 — Non-negotiable identity and facts

- **Original BYM logo is immutable:** `public/assets/brand/bym-logo-original.png`. Keep the actual original bytes and image aspect ratio; no generative redraw, recolor, replacement or text recreation. Effects may animate a separate container, lights or environment around it.
- **No fake BYM buildings or places.** The current project-photo slots are `review-required`. They must not be silently represented as authenticated architectural geometry.
- Visual audit flagged `IMG_4358.JPG` as **Burak Manzara Evleri** due to readable building sign. `IMG_3345.JPG` also matches this incompatible facade; exclude both from the Rüya Şehir gallery and modeling source. Other records require review. `Yapay Zeka Görseller` must not appear as real completed projects.
- Never turn a photo into a claim about unseen sides of a building. A model inferred from images is an *illustrative draft* until compared with verified architectural plans, facades and client approval.
- Files such as `3 Daire Kat Planı.jpg` support topology, but cannot by themselves prove all floor heights, facades or interior geometry.
- `data/project-facts.json` transcribes supplied project details and explicitly marks them **pending client approval**.
- **Coordinates of the exact Rüya Şehir location are pending**; do not invent a fly-to coordinate or show an inaccurate city descent as geographically accurate.

## 3 — Core visual journey

0. Cosmic web: artistic GPU particle filaments, NOT a scientifically accurate Milky Way map.
1. Galaxy: shader-driven spiral stars, physically plausible movement aesthetic.
2. Earth: textured sphere with atmospheric rim, smooth scale handoff. Earth texture must retain attribution in project docs.
3. Region: cloud or atmosphere handoff, only show exact project location after confirmation. Distinct scales must NOT be encoded in one enormous coordinate system.
4. Architecture: use a verified GLB only when sourced. A labeled real-photo 2.5D bridge is acceptable in the prototype, not a fake building.
5. Structure: floor explosion and orbital camera only after valid model geometry and naming/mesh hierarchy.
6. Brand and portfolio: verified assets and Turkish narrative, polished ivory/cream floating panels.

## 4 — Animation implementation rules

- **Real-time WebGL, not Higgsfield or chained AI video.** Main scene playback is not a pre-rendered image sequence.
- One normalized progress signal `p ∈ [0,1]` from `GSAP ScrollTrigger` drives camera, fades, geometry motion, narration chapters and environment. It must be reversible from any point with no jump.
- **Do not let GSAP and Framer Motion write to the same transforms.** GSAP controls story/3D scroll; Framer Motion controls independent UI panels and micro-interactions.
- Scale handoffs (galaxy/Earth/geography/building) should use composition, clouds and coordinated motion; 3D geometry must remain at numerically safe scene scales.
- Prefer `BufferGeometry`, custom point shaders and instancing; avoid thousands of individual Mesh components.
- Target consistent 60 fps on supported desktops while adapting DPR, particle count, post-processing and effects on mobile. Test actual devices or browser performance; do not claim benchmark numbers without measurement.
- Provide a reduced-motion, no-WebGL fallback, skip navigation, keyboard focus and semantic text.

## 5 — Current repository expectations

This kit contains a **starter**, not a finished Awwwards project. The current 3D prototype includes a procedural galaxy, Earth and an explicitly unapproved photo bridge; **the full city fly-to, verified project GLB, floor explosion and complete free-roam are not implemented**. Do not imply otherwise.

Preferred stack already declared in `package.json`: Next.js App Router, React, TypeScript, Three.js, React Three Fiber, Drei, GSAP and Framer Motion 14.14.0. Add dependencies selectively after checking versions and compatibility.

Work in small verified milestones:
1. Get existing starter to build and run (fix TypeScript/runtime issues first).
2. Improve cosmic/galaxy/earth continuity with available skills and browser proof.
3. Implement a distinct location-descent module after geographic accuracy is established.
4. Import validated Rüya Şehir GLB, not an arbitrary luxury tower.
5. Implement explodable named floor meshes, annotations and optional orbit mode.
6. Finalize responsive UX, performance, source provenance and SEO.

## 6 — Definition of done / output

Present: installed-skill verification table; changed code files; passing build evidence; browser screenshots and mobile checks where actually performed; exact source/media approval state; actual missing asset list; known issues and next steps. **Do not fake test results, source links, or locations.**
