# Combat, effects and sound

## Fight design

Use the existing shared action inputs. New bosses need distinctive patterns and counterplay, not extra buttons by default. Preserve defensive windows, costs and current chapter balance unless changing them is part of the request.

For each move define anticipation, locked targeting, active geometry, contact count, recovery, costs, cooldown, eligibility, interruption behavior and player response. Keep minimum readable tells and reachable ground routes. Alternate pressure and punish opportunities; avoid indefinite stun locks or mandatory perfect play.

Ordinary melee remains stationary. Animation events determine hit timing. Buffer/cancel rules remain explicit. Visual size changes must not silently alter collision, reach or damage.

Each signature barrage needs:
- A readable beginning, multiple meaningful positioning decisions and a visible recovery.
- Seeded authored variation with no surprise homing after target lock.
- Joint validation against existing shots and upcoming hazards.
- A reachable ground corridor accounting for player width, speed, stamina and available time.
- Pre-emission delay/thinning/omission for unsafe volleys, with a cadence fallback.
- Bounded entities/audio and cancellation on break, death, retry or scene change.

The current corridor baseline is at least180 logical pixels and hostile projectile cap48; inspect actual pattern-specific constraints before extending them. Check left/center/right starts with ordinary movement and imperfect defenses. Do not call a visually large pattern fair solely because a mathematical empty interval exists.

## Damage, feedback and ownership

Use a single contact identity to prevent duplicate damage. Distinguish attack hit, held block, genuine perfect parry, armored contact and guard break. Apply parry visuals near the actual defender.

Projectiles own release target, attachment, flight/impact/return state, per-pass hits and termination reason. Sweep fast movement for collision. A water impact stops damage before splash dissipation; a returning weapon must have exactly one owner.

Temporary effects must have owners and finite lifetimes. Queue additions made during updates; clear owned effects on interruption/retry/scene exit. Test spawned-during-update effects and repeated retries for accumulation.

Ultimates are roughly two-second in-arena sequences, with full effects and normal body scale. Freeze incoming combat consistently, restore state/camera/input on exit, and apply damage once at the designated event. Extra cinematic strikes do not generate extra damage or ultimate charge. Required story techniques cannot be blocked by a missing meter.

Preserve the current chapter's opening ultimate and fast second-charge economy. New chapter tuning must state the intended experience and measure actual fight durations rather than silently copying a historical target.

## Sound direction

Use clean, soft gaming recordings: compact punch/kick impacts, controlled swishes, crisp but non-harsh clashes/parries, gentle water/ice and restrained chakra cues. Preserve quiet water and muted placeholder voices by default; later user slider choices persist.

No continuous oscillator drone, abrasive noise loops, excessive pitch shifting or dense layered stacks. Prefer one primary recording per cue and modest variants for repetition. Bound volley sounds by volley, not projectile count. Prioritize damage/parry/ultimate cues, duck music when necessary and apply per-character vocal cooldowns.

Keep source URL, author, license, attribution, edits and runtime path for every recording. Official anime/video can guide qualities only when actually inspected; do not assume a mixed clip is clean individual audio or permission to redistribute. Do not claim timestamp/listening verification without it.

## Audio QA

1. Decode every new cue and inspect duration, leading/trailing silence, peaks, clicks and loop seams.
2. Audition isolated cues and the actual repeated mix: combo, parry streak, mirror volley, ultimate, dialogue transition and ending.
3. Check separate sliders, one music track/crossfade ownership, pause/resume and node cleanup across retries.
4. Record actual listening as passed, failed or not performed, separately from signal measurements.

A lower peak or low-pass filter does not prove a sound is soothing. If listening is unavailable, state that limitation; do not issue a subjective audio sign-off.
