# PRD implementation status

| Phase | Implemented | Validation / remaining acceptance |
| --- | --- | --- |
| 1 · Foundation | Vite, TypeScript, renderer, follow camera, walk/sprint/crouch/jump | Build passes; browser movement checked |
| 2 · Environment | Apartment corner, connected districts, buildings/props, bounds, box collision, opening sequence | Opening playable; dedicated interiors and mantle routes remain |
| 3 · Survival | Heat, shade, hydration, health, stamina, clock, limited inventory, scavenging, consumables, crafting/rest | Rules tested; balancing requires playtesting |
| 4 · Missions | 32 objectives, eight chapters, persistence, transitions, journal, failure and retry | Opening browser-tested; complete model paths tested |
| 5 · World/characters | Named characters, authored relocation, trust, persistent flags, infrastructure dependencies, day/night | Route access, water access, recovery, dialogue and endings respond to decisions |
| 6 · Vertical slice | Opening and market playable with shared systems | First two chapters completed through actual UI; power puzzle and inventory verified |
| 7 · Campaign | Eight authored missions, three planning boards, five ending categories | 1,056 complete decision paths checked; full human playthrough outstanding |
| 8 · Polish | Cinematic menu, 60-second intro, UI transitions, animated articulated figures, pedestrians, procedural surfaces, local audio, accessibility/settings | Stylized art; no recorded voice, motion capture or photorealistic assets |
| 9 · Release testing | State-model regression suite, malformed-save checks, production build, opening browser smoke test, documentation | Target laptop performance, browser matrix, accessibility audit and full campaign QA outstanding |

## Deliberate limits

The PRD explicitly excludes photorealistic rendering. This implementation uses human proportions and articulated animation but does not present its procedural figures as photorealistic people. Infrastructure boards represent fictional planning problems and are not real repair instructions. The character controller retains jump-based traversal rather than claiming a completed mantle system.

## Release checklist still open

- Measure FPS, draw calls and heap growth across two complete sessions on the target laptop.
- Play every chapter and each alternate route in Chromium, Firefox and Edge.
- Confirm keyboard focus and readable contrast at desktop sizes and increased text scale.
- Tune survival pressure and deadline costs from human play sessions.
- Add production audio and more environmental storytelling where needed.
- Review camera/collision behavior at every prop and boundary.

