# V21 validation

- Generated 24 hound frames, 24 character frames, and 32 effect frames with built-in imagegen. Prompts retained in prompts.json. Existing transparent alpha preserved; row gutters extracted and complete figures re-padded without resizing.
- Three hound identities: pug, tan tracking dog, dark mastiff. New Haku recoil/fall/landing, Kakashi capture, Zabuza prison hold, and flame-free awakened Naruto body frames.
- 203 automated checks pass, plus TypeScript and lint. Production build succeeds.
- Full chapter input-pilot browser run completed all four fights and the natural snowy ending, with zero deaths and no page errors. Pilot only used shared player input actions; no health, position, timing, or outcome overrides.
- Two ultimates used in each fight. Rescue measured 8–13 seconds with the pilot, including three casual-defense samples. User explicitly selected keeping the very short rescue after reviewing that timing tradeoff; HP remains 550.
- Browser checks: water-prison staging, Chidori contact/hound removal, diving-dragon framing, Fury at the left arena edge, mirror exit with all reflections hidden, pause/skip, resize, standard controller stick movement and B dash.
- Physical-controller testing and subjective listening were not performed. Existing quieter water audio retained; no soundtrack extraction or new audio source added.
- Final browser checks also passed: natural death/retry restores full health and one ready ultimate; debug sessions leave saved progress unchanged; focus loss pauses. Final visual correction keeps cinematic bars aligned during ultimate zoom.
