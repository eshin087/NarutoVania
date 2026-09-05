# Validation record

Local Chromium browser playtest used keyboard controls and the development WebMCP normal-input sequence adapter. The adapter holds the same move, jump, and combat actions; it does not teleport, set health, or bypass encounters.

- Cleared all three enemy waves, crossed forest/bridge gaps and raised platforms, defeated Zabuza including mist, and reached Haku's arena.
- Exercised melee combos, aerial attacks, ranged attacks, two-clone summoning/lifetime, log substitution/immunity, and charged Rasengan rush and impact.
- Triggered six mirrors, observed occupied-mirror flashes and senbon volleys, broke occupied mirrors with ordinary shuriken, punished stagger, and defeated Haku without using Rasengan. The successful Haku retry began with zero ultimate charge.
- Verified death and checkpoint retry for both bosses. Haku retry preserves Zabuza completion, restores health/chakra, resets ultimate/cooldowns, and removes support entities and mirrors. Scene baseline returned to 90 display children after repeat retry.
- Pause/resume, boss-intro continuation, controls dialog, mute, reduced shake, responsive canvas, and production smoke test are verified during delivery.
- No local browser console errors or warnings in the chapter completion pass. Observed approximately 165 fps on the available high-refresh desktop display; this is not a benchmark guarantee for other hardware.
- Automated tests cover damage immunity, chakra/cooldown gates, ultimate caps, facing hitboxes, safe substitution, reachable platform heights, real sprite alpha/frame bounds, standard controller mapping, controller disconnection, Start debounce, and lost-focus clearing.

Physical-controller hardware was unavailable. Controller behavior is verified with simulated standard gamepad input. Desktop keyboard play is browser-tested. Mobile touch and multiplayer are outside scope. First-play length depends on skill and retries; an experienced clear can be under five minutes.
