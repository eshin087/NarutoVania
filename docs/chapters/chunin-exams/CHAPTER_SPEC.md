# Chapter 2 — The Power of Youth

## Approved scope
Rock Lee versus Gaara, ninth Chunin Exam preliminary. One continuous fight in three checkpointed phases; revised successful combat target **2–3 minutes**, confirmed 2026-09-11. Short automatic in-engine opening showing the indoor arena and observers. Brief canonical ending: completing the gameplay does not change Lee's loss. Publish to the existing Vercel game after QA. Preserve Chapter 1.

## Canon and adaptation
Authority: https://naruto-official.com/en/news/01_1652 and official episodes 48–50: https://naruto-official.com/en/anime/naruto1/list/01_272 , 01_273 , 01_274. Manga chapters 81–87. Indoor preliminary hall with upper galleries and stone hand-seal monument, Hayate proctor. Sasuke is absent, Hinata injured. Core observing cast: Naruto, Sakura, Kakashi, Guy, Neji, Temari, Kankuro, Baki, Shikamaru, Ino, Choji, Shino, Asuma. Exact shot positions/entrance were not frame-verified; the opening staging is an adaptation.

Sequence: automatic sand shield → Guy permits weight removal → speed defeats shield, Sand Armor exposed → Forward Lotus and sand shell → Fourth/Fifth Gates → Reverse Lotus → Gaara cushions landing, injures Lee → Guy intervenes → Lee stands unconscious. No Shukaku, all eight gates, ninjutsu for Lee, or second fight.

## Combat slice

2026-09-11 continuous revision: one 6000-HP Gaara, weight removal at 4200 (70%) and Gates at 2100 (35%). Threshold-crossing damage is retained; power-ups never refill Gaara. Retry/Continue restore the exact boss HP saved at the latest threshold, with full player resources. Older phase saves migrate to that threshold's entry HP. Natural power-ups retain Lee's injuries with a 20-HP recovery and the existing ready-ultimate reward. Target remains 2–3 minutes; efficient and less precise ordinary-input runs measured 97.91s and 109.79s excluding scenes, both without retries. These are automated measurements, not human difficulty certification.

Hurricane stops at contact distance instead of crossing Gaara. All travelling sand shots are parryable, with a 70ms same-emission group for inseparable pellets and one reward/returned damage event. Different volleys require new deliberate parries. Floor grabs/eruptions retain dodge-only behavior. See [revision artwork](REVISION_2026-09-11_ART.md) and the current production log.

Shared stationary light string, heavy, aerial, guard/parry, ground/air/slide dash. Lee uses stamina, no chakra bar or magical substitution. Q Leaf Hurricane: advancing kick. E **Lotus Launcher**: descriptive upward-kick gameplay name and posture pressure, not a claim about later-era Leaf Rising Wind. K quick palm. L evasive backstep. R Lotus (physical cinematic; Fifth Gate variant at final phase). Start each checkpoint with ultimate ready. Gaara automatic sand shield reduces hits outside his visible recovery; breaking his stamina creates a punish window. No invulnerable time gates.

Three power levels: Sand Shield, Weights Released, Fifth Gate. Distinct sand hand, ground sweep, pellet fans, closing walls, coffin and major sand storm patterns; locked targeting, >=650ms red tells, reachable ground routes, <=48 hostile objects. Selected storm needles bounce once on the floor after a harmless 180ms contact hold; they remain parryable and expire after their finite path. Fairness checks both legs and all existing shots, with 260ms reaction allowance plus remaining action lock. Unsafe new emissions wait or are omitted before release.

Shared double jump allows one fresh aerial jump independently of the air dash; coyote/buffer behavior remains. Parry works in the air with unchanged timing. Pale hand glints announce ordinary release without providing a perfect-parry countdown; ground spells show full-width boundaries and buildup. Chapter 2 gets a separate profile of 21 short recorded effects edited in Audacity; shared music, Chapter 1 sounds and stored sliders remain intact.

## Story and art ownership
One continuous arena. Intro approximately 11.5s; short automatic transitions preserve causal weight removal, Lotus, Gates and Guy intervention beats. Animation owner per actor; scripts and controls never act together. Skip resolves current scene only. No manga cards or portrait ultimate. New references, Lee/Gaara atlases, arena and sand/Gates effects generated before integration. All sprites use stable body scales and foot anchors independent of pose bounds. Render players above boss body. Quiet idle.

## Acceptance
All three phases, retry/pause/skip, controller mappings, saves isolated from debug and Chapter 1, no duplicate damage or effects. Independent rendered critique, revise blockers. Build and test Vercel preview before production. Physical controller and subjective audio limitations reported honestly.
