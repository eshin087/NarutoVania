export interface SupportSense {now:number; canAct:boolean; stamina:number; distance:number; redIn:number; ordinaryIn:number; recovering:boolean; spellReady:boolean;}
export type SupportAction = 'wait' | 'dodge' | 'parry' | 'spell' | 'retreat' | 'approach' | 'melee' | 'tool';
/** Support reacts to attack anticipation, keeps spacing, and has bounded defensive cadence. */
export class SupportBrain {
  defenseAt = 0; attackAt = 1800; spellAt = 3000;
  decide(s:SupportSense):SupportAction {
    if (!s.canAct) return 'wait';
    if (s.now >= this.defenseAt && s.redIn < 340 && s.stamina >= 22) {this.defenseAt=s.now+900;return 'dodge';}
    if (s.now >= this.defenseAt && s.ordinaryIn < 125 && s.stamina > 0) {this.defenseAt=s.now+750;return 'parry';}
    if (s.distance < 175 && !s.recovering) return 'retreat';
    if (s.now >= this.spellAt && s.spellReady && s.distance < 720 && s.redIn > 800 && s.ordinaryIn > 700) {this.spellAt=s.now+6500;this.attackAt=s.now+1200;return 'spell';}
    if (s.distance > 390) return 'approach';
    if (s.now >= this.attackAt && s.stamina > 25 && s.redIn > 600 && s.ordinaryIn > 550) {this.attackAt=s.now+1600;return s.recovering && s.distance<145?'melee':'tool';}
    return 'wait';
  }
}
