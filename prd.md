# HEATLINE: 48 HOURS TO SURVIVE
## Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Development specification  
**Genre:** Third-person survival, action and narrative adventure  
**Setting:** Fictional Indian city  
**Target platform:** Modern desktop browsers, with Windows development and local execution  
**Budget:** ₹0 target  
**Primary technologies:** Three.js, TypeScript, Vite  
**Physics:** Optional Rapier 3D  
**Persistence:** IndexedDB and local browser storage for appropriate settings  
**3D asset creation:** Blender  
**Version control:** Git and GitHub

---

# 1. Executive Summary

HEATLINE: 48 Hours to Survive is a single-player, story-driven survival game set in Vardhan City, a fictional Indian city experiencing an extreme heatwave and cascading infrastructure failures.

The player controls an ordinary resident who must survive for 48 in-game hours while managing hydration, heat exposure, stamina, health, limited supplies, dangerous routes and relationships with other residents.

Unlike conventional combat-focused survival games, HEATLINE makes environmental pressure, infrastructure dependencies and human decisions the central gameplay mechanics.

The player's actions influence the availability of essential services, the willingness of characters to cooperate, the resources available in later missions and the final outcome of the campaign.

The intended result is a polished, immersive and replayable survival experience that can be developed independently using free tools.

## 1.1 Product vision

Create a survival game in which the player is constantly forced to make meaningful decisions between personal safety, time, resources and responsibility toward others.

The game must feel like a living city under pressure, not a sequence of unrelated survival challenges.

## 1.2 Product tagline

**The city is still alive. It just can't keep everyone alive.**

## 1.3 Core design principles

1. Every important action has a cost.
2. Survival systems must affect actual gameplay.
3. Choices must have visible and persistent consequences.
4. Exploration should reward observation and planning.
5. The environment should be a primary source of tension.
6. The world should be believable, readable and coherent.
7. Visual quality must be balanced against performance.
8. The game must remain playable without paid APIs or mandatory online services.

---

# 2. Problem Statement and Opportunity

Many student-developed games focus on basic movement, generic enemies, repetitive shooting or simple survival meters.

HEATLINE aims to distinguish itself through the interaction of three systems:

- **Heatline:** Physical exposure, hydration, fatigue and cooling opportunities.
- **Lifeline:** Electricity, water, transport and essential services.
- **Human Line:** Trust, cooperation, promises and community consequences.

The distinctive gameplay experience comes from these systems affecting one another.

For example, restoring power to a neighborhood may improve access to water while leaving another facility without sufficient backup power. Helping a resident may provide a route or tool later, but consume time and supplies in the present.

The product should not claim that no similar game exists. Its originality is expressed through its particular setting, interdependent mechanics, mission structure and decision-driven survival experience.

---

# 3. Target Audience

## 3.1 Primary audience

- Players interested in realistic survival and exploration.
- Players who enjoy narrative choices and consequences.
- Players who prefer resource management and environmental challenges.
- Players interested in disaster scenarios and believable fictional worlds.

## 3.2 Secondary audience

- Indie game enthusiasts.
- Students interested in game development.
- Players who enjoy replaying campaigns to discover alternate outcomes.

## 3.3 Target experience

The player should feel vulnerable but capable, pressured but not confused, and responsible for decisions without being forced into a single morally correct solution.

---

# 4. Scope and Product Boundaries

## 4.1 Included in version 1

- Single-player campaign.
- Third-person 3D gameplay.
- Fictional Indian urban environment.
- Eight main missions covering 48 in-game hours.
- Connected, compact districts.
- Heat, hydration, stamina and health systems.
- Inventory, scavenging and limited crafting.
- Interactable objects and environmental puzzles.
- Character dialogue and relationship variables.
- Dynamic events driven by game state.
- Infrastructure simulation.
- Branching decisions and multiple endings.
- Main menu, pause menu, settings, journal and inventory.
- Checkpoints and local save/load.
- Sound design, lighting and opening/ending sequences.
- Keyboard and mouse controls.
- Performance settings and accessibility basics.

## 4.2 Excluded from version 1

- Multiplayer and online co-op.
- An enormous seamless open world.
- Paid AI APIs.
- Mandatory cloud accounts.
- Real-money purchases.
- Complex firearm combat.
- Unlimited procedural world generation.
- Photorealistic rendering.
- A persistent online economy.
- Mobile-first controls and mobile release.

These exclusions are deliberate. The initial release should prioritize a complete, polished campaign over an excessive number of features.

---

# 5. Game Setting and World Design

## 5.1 Vardhan City

Vardhan City is a fictional Indian city affected by an extreme heatwave, electricity disruptions, water shortages and transport difficulties.

The city should feature recognizable architectural and environmental details without depending on licensed real-world locations.

### Primary districts

1. Residential District: Apartment buildings, corridors, stairwells and shared utility areas.
2. Market District: Small shops, closed shutters, storage areas and narrow streets.
3. Community District: Shelter, clinic, public gathering area and supply distribution point.
4. Infrastructure District: Maintenance areas, power equipment and water pumping facilities.
5. Transport District: Bus terminal, blocked roads and evacuation access.
6. Outskirts: A smaller connected area used during the final campaign stages.

The districts should be modular and connected through controlled transitions or short traversal segments.

## 5.2 Environmental progression

The world changes across the 48-hour campaign.

- Daytime increases heat exposure and changes outdoor traversal costs.
- Electricity failures affect lighting and selected services.
- Supply availability changes according to mission events.
- Character locations and dialogue change over time.
- Restored infrastructure unlocks new possibilities.
- Unresolved problems can create additional obstacles.

The game uses authored event schedules and deterministic state transitions in version 1. Full weather simulation is unnecessary.

## 5.3 Environmental storytelling

The player should discover the state of the city through:

- Radio bulletins.
- Phone messages.
- Notices and signs.
- Conversations.
- Changes in public spaces.
- Broken equipment.
- Empty supply containers.
- Previously visited locations.

Environmental details should reinforce the story rather than exist solely for decoration.

---

# 6. Story and Characters

## 6.1 Main character

**Aarav — working name**

An ordinary resident with limited resources and no extraordinary abilities.

The player begins at home when the emergency develops. Aarav must decide whether to secure supplies, assist neighbors, search for information or leave the area.

The character's vulnerability is central to the gameplay.

## 6.2 Supporting characters

### Maya — Community volunteer

Coordinates local assistance, knows the neighborhood and helps organize supplies.

### Imran — Electrician

Understands local electrical systems and assists with safe, simplified infrastructure-repair puzzles.

### Raghav — Neighbor

Provides a personal connection to the residential district. His situation can change based on the player's decisions.

### Dr. Sen — Clinician

Represents the pressure placed on medical and community services during the emergency.

## 6.3 Character behavior requirements

Characters should have:

- A defined role and initial state.
- A limited schedule or set of possible locations.
- Dialogue that responds to mission state.
- Trust or cooperation variables where appropriate.
- Requests that can be completed or missed.
- Persistent consequences for significant decisions.

Character intelligence will be implemented using finite-state machines, authored dialogue and conditional rules.

Large language models and paid AI services are not required.

---

# 7. Core Gameplay Loop

Every mission follows this sequence:

1. Receive a primary objective.
2. Inspect the current environment.
3. Check survival condition and inventory.
4. Plan a route or choose an approach.
5. Explore, scavenge, interact, negotiate or solve a puzzle.
6. Encounter a complication or decision.
7. Update the world state.
8. Complete or fail the objective.
9. Save the relevant state at a checkpoint.
10. Unlock the next objective or mission.

The loop must support multiple approaches without requiring a fully open-world simulation.

---

# 8. Player Systems

## 8.1 Movement

Required movement:

- Walk.
- Run.
- Sprint.
- Crouch.
- Interact.
- Climb or traverse selected authored obstacles.
- Enter and exit designated spaces.

Movement must be responsive and predictable.

Sprint consumes stamina. Movement should not depend on network latency.

## 8.2 Camera

The third-person camera should:

- Follow the player smoothly.
- Support mouse-controlled rotation.
- Avoid unnecessary camera clipping.
- Adjust around walls where feasible.
- Support sensitivity settings.
- Avoid excessive motion blur or screen shake.

## 8.3 Heat exposure

Heat exposure is a gameplay variable representing accumulated environmental stress.

It increases according to authored factors such as:

- Outdoor exposure.
- Current heat phase.
- Exertion.
- Access to shade or cooling.
- Selected environmental events.

Exposure decreases or stabilizes when the player reaches appropriate cooling opportunities or rests.

The implementation must use a bounded simulation model rather than claiming medically accurate body-temperature prediction.

## 8.4 Hydration

Hydration decreases with elapsed time and exertion.

Water restores hydration according to the game's defined rules.

The player must decide whether to use available water immediately, conserve supplies or seek additional resources.

The interface should communicate the condition clearly and avoid misleading real-world medical advice.

## 8.5 Stamina

Stamina decreases during sprinting and demanding actions.

Stamina regenerates during appropriate recovery periods.

Low stamina should reduce movement capability in a readable way without creating excessive control frustration.

## 8.6 Health

Health represents the player's overall gameplay condition.

Health can deteriorate from severe survival-state penalties or scripted hazards.

Recovery should require appropriate items or authored safe opportunities.

The player should receive clear warnings before critical failure wherever the mission design permits.

## 8.7 Inventory

Inventory supports:

- Water.
- Food.
- First-aid supplies.
- Flashlight.
- Batteries.
- Basic tools.
- Repair components.
- Keys and documents.
- Mission-specific objects.

Inventory capacity should be limited by item slots or a simple weight budget.

The first release should not require a complex equipment-combination system.

## 8.8 Scavenging

Scavenging should reward environmental observation.

Containers and objects may provide:

- Essential supplies.
- Mission clues.
- Repair equipment.
- Keys.
- Optional collectibles.

Important items must not spawn in inaccessible locations or become permanently unobtainable because of an earlier unrelated action.

---

# 9. Infrastructure and Human Systems

## 9.1 Lifeline infrastructure model

Represent essential services as a small dependency graph.

Example:

- Backup power can supply a water pump.
- The pump enables water distribution.
- A shelter consumes water and may require electricity.
- A clinic depends on selected essential resources.
- Repairs require time, tools and access.

The system should model only dependencies that directly affect gameplay.

## 9.2 Human Line relationship model

Track selected relationship variables:

- Trust.
- Cooperation.
- Promises fulfilled.
- Optional requests completed.
- Supplies delivered.
- Critical characters assisted.

Relationships should influence dialogue, access to resources, available assistance and selected endings.

Avoid reducing every interaction to a single global morality score.

## 9.3 Dynamic events

Version 1 should support a small set of deterministic events:

- Localized power outage.
- Water delivery arrival.
- Route obstruction.
- Changed character availability.
- Conflicting information.
- Temporary service restoration.

Events must have explicit activation conditions, outcomes and persistence rules.

---

# 10. Complete Campaign

The campaign covers 48 in-game hours and consists of eight missions.

## Mission 1: The Warning — Hours 00–03

Location: Residential apartment.

Objectives:

- Learn movement and interaction.
- Collect essential supplies.
- Receive the initial emergency information.
- Check on a neighbor.
- Decide whether to prepare further or leave.

Unlocks: Residential street and Mission 2.

## Mission 2: The Empty Market — Hours 03–07

Location: Market district.

Objectives:

- Search for food, water and equipment.
- Explore alternate routes.
- Manage heat exposure.
- Interact with a shopkeeper.
- Complete an optional supply-delivery task.

Major choice: Share supplies or retain them.

Unlocks: Neighborhood infrastructure investigation.

## Mission 3: No Power — Hours 07–13

Location: Residential services and maintenance area.

Objectives:

- Find the electrician.
- Obtain repair equipment.
- Complete a simplified diagnostic puzzle.
- Determine which service receives limited backup power.

Major choice: Prioritize cooling or water access.

Unlocks: Community shelter mission.

## Mission 4: The Shelter — Hours 13–18

Location: Community shelter.

Objectives:

- Deliver supplies.
- Organize a limited distribution process.
- Resolve a resource-allocation disagreement.
- Help establish a safe rest area.

Major choice: Apply a uniform distribution rule or make a justified exception.

Unlocks: Alternate routes and additional character requests.

## Mission 5: The Blocked Route — Hours 18–24

Location: Market and transport corridors.

Objectives:

- Explore alternative routes.
- Avoid or resolve a confrontation.
- Retrieve a mission-critical package.
- Return before the opportunity expires.

Major choice: Negotiate, take a longer route or use resources to access an alternative path.

Unlocks: Water-delivery investigation.

## Mission 6: Last Water — Hours 24–32

Location: Water distribution network.

Objectives:

- Trace an interrupted delivery.
- Find the cause of the interruption.
- Repair or bypass a simulated obstacle.
- Deliver supplies to a designated location.

Major choice: Deliver immediately to one site or split resources between two sites.

Unlocks: Final crisis preparation.

## Mission 7: The Longest Night — Hours 32–41

Location: Connected residential and infrastructure districts.

Objectives:

- Recover essential supplies.
- Complete a critical navigation or repair challenge.
- Respond to a character's request.
- Prepare an evacuation route.

Major choice: Prioritize personal escape or accept an additional community task.

Unlocks: Final evacuation.

## Mission 8: The Last Decision — Hours 41–48

Location: Evacuation area.

Objectives:

- Reach the evacuation point.
- Apply previously acquired resources and contacts.
- Resolve a final logistical problem.
- Make the final campaign decision.

Outcome: Determine the ending from campaign variables, mission flags and the final decision.

Mission duration is measured in in-game hours. Real-world playtime should be substantially shorter than the fictional 48-hour period.

---

# 11. Endings and Replayability

The campaign should support five outcome categories.

### Ending A: A New Morning

The player reaches safety with a functioning support network and a credible recovery path.

### Ending B: Survival at a Cost

The player survives, but important supplies, services or relationships were lost.

### Ending C: Alone

The player reaches safety but has limited community support.

### Ending D: The City Holds

The player helped establish a coordinated community response with essential services operating.

### Ending E: Too Late

The player fails to complete the final survival objective or reaches a terminal failure state.

Ending evaluation should consider:

- Community trust.
- Infrastructure stability.
- Preparedness.
- Personal condition.
- Rescued or assisted characters.
- Completed mission objectives.
- Final campaign choice.

Endings must be tested against all major combinations of relevant flags.

---

# 12. User Interface and Experience

## 12.1 Main menu

Required options:

- New Game.
- Continue.
- Chapters.
- Settings.
- Credits.
- Exit or return action appropriate to the browser.

The background should feature the game world and subtle environmental animation.

## 12.2 In-game HUD

Display:

- Current mission and objective.
- Campaign clock.
- Health.
- Hydration.
- Stamina.
- Heat exposure.
- Contextual interaction prompt.

The HUD must avoid excessive screen coverage.

## 12.3 Inventory interface

Allow players to:

- Inspect items.
- Use consumables.
- Read item descriptions.
- Review capacity.
- Identify mission-critical objects.

## 12.4 Journal

The journal stores:

- Current and completed objectives.
- Relevant messages.
- Important clues.
- Major decisions.
- Mission summaries.

## 12.5 Dialogue

Dialogue choices should be clear and concise.

The game may hint at possible risks without revealing every numerical consequence.

Dialogue must be accessible and readable.

## 12.6 Settings

Required settings:

- Master volume.
- Music volume.
- Sound-effects volume.
- Mouse sensitivity.
- Graphics quality.
- Resolution or render scale where supported.
- Subtitle toggle.
- Basic accessibility options.

---

# 13. Audio and Visual Direction

## 13.1 Visual identity

Use a grounded, cinematic visual style rather than expensive photorealism.

Key elements:

- Warm amber and washed-out colors during severe heat.
- Dust and restrained heat-haze effects.
- Cooler tones in darkened interiors and nighttime locations.
- Strong visual distinction between interactive and decorative objects.
- Modular low-poly environments.
- Consistent lighting and readable silhouettes.

## 13.2 Audio identity

Required audio categories:

- Ambient city sound.
- Footsteps.
- Interaction sounds.
- UI feedback.
- Radio bulletins.
- Character dialogue.
- Power failure sounds.
- Environmental transitions.
- Tension and resolution music.

Use original audio or assets with verified licenses.

## 13.3 Opening cinematic

Target duration: 60–90 seconds.

Sequence:

1. Show the city under an extreme heat warning.
2. Play a radio bulletin.
3. Enter the player's apartment.
4. Show the fan and lights stopping.
5. Display a neighbor's message.
6. Give control to the player.
7. Present the title and opening objective.

The cinematic must be skippable after initial presentation.

---

# 14. Technical Architecture

## 14.1 Technology stack

### Core technologies

- Three.js: 3D rendering.
- TypeScript: Game logic and type safety.
- Vite: Development server and production build.
- HTML and CSS: Menus and interface overlays.
- IndexedDB: Local campaign persistence.
- Git: Version control.

### Optional technologies

- Rapier 3D: Physics and collision where required.
- Blender: 3D asset creation and optimization.
- Vitest: Unit testing.
- GitHub Pages: Static deployment, subject to current platform limits.

Do not add unnecessary dependencies.

## 14.2 Architectural layers

### Core

Responsible for initialization, game loop, scene management, event dispatch and cleanup.

### Player

Responsible for movement, camera, interaction and player state.

### Survival

Responsible for heat exposure, hydration, stamina and health.

### World

Responsible for districts, environmental state, services and interactable objects.

### Missions

Responsible for objectives, triggers, checkpoints and transitions.

### Characters

Responsible for character state, schedules, dialogue and relationships.

### Inventory

Responsible for items, capacity, consumption and item interactions.

### Persistence

Responsible for save schema, validation, migration and recovery.

### UI

Responsible for menus, HUD, inventory, journal and dialogue.

### Audio

Responsible for music, ambience, effects and volume settings.

## 14.3 Performance strategy

The target hardware includes an 8 GB RAM Windows laptop.

Therefore:

- Use small connected districts.
- Reuse modular assets.
- Use compressed textures.
- Limit active character simulations.
- Use object pooling where beneficial.
- Avoid unnecessary per-frame allocations.
- Use simple collision geometry.
- Limit dynamic shadows.
- Use level-of-detail or reduced complexity for distant objects.
- Test browser memory consumption throughout development.

A stable playable game takes priority over high-end visual effects.

---

# 15. Project Structure

```text
heatline/
├── public/
│   ├── assets/
│   │   ├── models/
│   │   ├── textures/
│   │   ├── audio/
│   │   └── fonts/
│   └── data/
│       ├── missions/
│       ├── dialogue/
│       ├── items/
│       └── events/
├── src/
│   ├── core/
│   ├── player/
│   ├── survival/
│   ├── world/
│   ├── missions/
│   ├── characters/
│   ├── inventory/
│   ├── save/
│   ├── ui/
│   ├── audio/
│   └── main.ts
├── tests/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Modules should have clear responsibilities and explicit interfaces. Avoid placing the entire game in one large source file.

---

# 16. Data and Persistence

The save system should persist:

- Current mission.
- Completed objectives.
- Player position and condition.
- Inventory.
- Mission flags.
- Relationship state.
- Infrastructure state.
- Campaign clock.
- Unlocked endings or chapter progress.
- Settings where appropriate.

Use versioned save data.

The game must validate save files before loading and recover gracefully from invalid or missing data.

Because this is a browser-first game, clearing browser data may remove local saves. Version 1 does not promise cross-device synchronization.

---

# 17. Development Workflow

## Phase 1: Foundation

Deliverables:

- Repository.
- TypeScript and Vite setup.
- Three.js scene.
- Camera.
- Basic player controller.
- Development and build scripts.

Exit criterion: A controllable character can move in a small test environment.

## Phase 2: First environment

Deliverables:

- Apartment.
- Residential street.
- Interactable objects.
- Collision.
- Basic lighting.
- Opening sequence.

Exit criterion: The opening area is playable from start to finish.

## Phase 3: Survival systems

Deliverables:

- Campaign clock.
- Heat exposure.
- Hydration.
- Stamina.
- Health.
- Inventory.
- Rest and cooling interactions.

Exit criterion: Player actions visibly affect survival variables.

## Phase 4: Mission framework

Deliverables:

- Objective definitions.
- Mission manager.
- Checkpoints.
- Mission transitions.
- Journal.
- Completion and failure handling.

Exit criterion: A complete mission can be started, completed, saved and resumed.

## Phase 5: World and characters

Deliverables:

- Dialogue.
- Character states.
- Relationship variables.
- Infrastructure dependencies.
- Event triggers.
- Persistent choices.

Exit criterion: A decision in one mission changes a later mission.

## Phase 6: Vertical slice

Complete Mission 1 and a portion of Mission 2 to the intended visual and gameplay quality.

The slice must include movement, exploration, survival, dialogue, a consequential choice, save/load and a mission summary.

Exit criterion: A tester can play the slice without assistance and understand its objective.

## Phase 7: Campaign production

Implement Missions 2–8 using reusable systems and modular environments.

Exit criterion: The campaign can be completed from start to ending.

## Phase 8: Polish

Add cinematics, audio, improved lighting, animations, accessibility options and UI transitions.

Exit criterion: All major screens and gameplay states are complete.

## Phase 9: Testing and release

Perform gameplay, save/load, branch, performance, accessibility and browser compatibility testing.

Exit criterion: No known critical blockers remain in the release candidate.

---

# 18. Testing and Acceptance Criteria

The release must satisfy the following requirements.

## Gameplay

- The player can move, interact and complete the opening mission.
- Survival variables update correctly.
- Inventory changes persist when expected.
- Mission objectives have clear completion conditions.
- Invalid actions do not create impossible states.

## Campaign

- All eight missions can be completed.
- Critical mission items cannot become permanently inaccessible through normal gameplay.
- Optional objectives can be missed without breaking the campaign.
- All five ending categories are reachable through tested state combinations.
- Earlier decisions produce observable consequences.

## Persistence

- Save and load work at designated checkpoints.
- Refreshing the page does not unexpectedly erase a valid save.
- Invalid saves fail gracefully.
- Mission transitions preserve campaign state.

## Interface

- Menus work using mouse and keyboard.
- HUD values remain readable.
- Dialogues cannot accidentally lock the player out of progress.
- Pause and resume behave consistently.
- Audio and accessibility settings persist where supported.

## Performance

- The game remains responsive during ordinary gameplay.
- Memory use is measured on the target laptop.
- Asset loading does not cause prolonged blocking.
- Graphics quality can be reduced on weaker hardware.
- Major performance regressions are tested before release.

---

# 19. Risks and Mitigations

### Risk: Scope becomes too large

Mitigation: Build a vertical slice before expanding the campaign.

### Risk: Browser-based 3D performance is insufficient

Mitigation: Use low-poly environments, smaller districts and measured graphics budgets.

### Risk: Survival mechanics feel repetitive

Mitigation: Make each mission introduce a different decision, route problem or infrastructure dependency.

### Risk: Choices have no meaningful consequences

Mitigation: Connect mission flags to later dialogue, resource availability and ending evaluation.

### Risk: Asset licensing problems

Mitigation: Track the source and license of every third-party asset.

### Risk: Save corruption

Mitigation: Use versioned schemas, validation and recovery behavior.

### Risk: The game becomes visually inconsistent

Mitigation: Establish a compact art direction and reuse modular assets.

### Risk: Features are implemented but not integrated

Mitigation: Require a playable build and regression testing at each milestone.

---

# 20. Release Plan

The initial release should include:

- A complete single-player campaign.
- Eight playable missions.
- Multiple endings.
- Local save/load.
- Main menu and settings.
- Finalized core survival systems.
- Audio and visual polish.
- Credits and asset acknowledgments.
- A README with controls and installation instructions.
- A playable production build.

The game should be playable locally without an account, paid API, or mandatory online service.

Free static hosting may be used for distribution, subject to current platform policies and storage limits.

---

# 21. Success Metrics

The project is considered successful when:

1. A new player can begin and complete the opening sequence without instructions from the developer.
2. The survival systems meaningfully affect movement, exploration and decision-making.
3. At least three earlier decisions affect later gameplay.
4. All eight missions can be completed.
5. All ending categories are reachable through tested paths.
6. Save/load works across normal game sessions.
7. The game runs acceptably on the target laptop.
8. The campaign feels coherent and replayable.
9. No paid dependency is required for the core game.
10. The final release includes complete source code and documentation.

---

# 22. Final Product Definition

HEATLINE: 48 Hours to Survive is a compact, cinematic survival game built around environmental pressure, infrastructure failure and consequential human decisions.

The game succeeds when players feel that the city is changing around them, that their resources are limited, and that their earlier decisions genuinely shape the final outcome.

The development priority is a polished and complete campaign, not the maximum possible map size or number of features.

**The first implementation milestone is a complete, playable opening mission. Every later system must build on that tested foundation.**
