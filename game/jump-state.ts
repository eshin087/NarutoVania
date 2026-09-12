import { COMBAT } from './combat-core';

/** One fresh airborne jump, independent of the one-air-dash allowance. */
export class JumpState {
  private queuedAt = -Infinity;
  private lastGround = -Infinity;
  private launchUntil = -Infinity;
  private airAvailable = true;
  reset() {
    this.queuedAt = this.lastGround = this.launchUntil = -Infinity;
    this.airAvailable = true;
  }
  observe(now: number, grounded: boolean, velocityY: number) {
    if (grounded && velocityY >= 0 && now >= this.launchUntil) {
      this.lastGround = now;
      this.airAvailable = true;
    }
  }
  press(now: number) {
    this.queuedAt = now;
  }
  consume(now: number, allowed: boolean): 'ground' | 'air' | null {
    if (
      !allowed ||
      now - this.queuedAt > COMBAT.jumpBuffer ||
      now < this.launchUntil
    )
      return null;
    const ground = now - this.lastGround <= COMBAT.coyote;
    if (!ground && !this.airAvailable) return null;
    if (!ground) this.airAvailable = false;
    this.queuedAt = this.lastGround = -Infinity;
    this.launchUntil = now + 80;
    return ground ? 'ground' : 'air';
  }
}
