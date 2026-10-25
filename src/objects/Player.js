import * as Phaser from 'phaser';
import { CONFIG, SCALE } from '../config.js';
import { metrics } from '../systems/metrics.js';

const P = CONFIG.player;
const G = CONFIG.groundY;

// The runner. Stays at a fixed x; Arcade handles gravity and the floor (world
// bounds bottom = ground). Emits 'player-jump' (air: boolean), 'player-land',
// 'player-slide' and 'player-dive' for sound and particles.
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x) {
    super(scene, x, 0, 'hero', 0);
    this.hero = metrics.hero;
    this.jumpCfg = metrics.jump;
    this.y = G - this.hero.feet + this.hero.frameH / 2;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(0, P.maxFall);
    this.body.setGravityY(P.gravity);

    this.mode = 'run'; // run | dead | exit
    this.grounded = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.coyote = 0;
    this.buffer = 0;
    this.airJumps = P.airJumps;
    this.rising = false;
    this.jumpTime = 0;
    this.releasedEarly = false;

    this.setHitbox(this.hero.body);
    this.play('hero-run');
  }

  setHitbox(b) {
    this.body.setSize(b.w, b.h, false);
    this.body.setOffset(b.x, b.y);
  }

  get onGround() {
    return this.body.blocked.down;
  }

  tick(dt, input) {
    const body = this.body;
    const onGround = this.onGround;
    body.setGravityY(body.velocity.y > 0 ? P.gravity * P.fallGravityMul : P.gravity);

    if (this.mode !== 'run') {
      this.updateAnim(onGround);
      return;
    }

    let jumpedNow = false;
    if (onGround) {
      if (!this.grounded) this.land(input);
      this.grounded = true;
      this.coyote = P.coyoteTime;
      this.airJumps = P.airJumps;
    } else {
      this.grounded = false;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    // Jump: buffered presses, coyote time, then the air jump.
    this.buffer = input.jumpPressed ? P.jumpBuffer : Math.max(0, this.buffer - dt);
    if (this.buffer > 0) {
      if (onGround || this.coyote > 0) {
        this.jump(false);
        jumpedNow = true;
      } else if (input.jumpPressed && this.airJumps > 0 && !this.landingSoon()) {
        this.jump(true);
        jumpedNow = true;
      }
    }

    // Variable height: letting go early cuts the rise (after a minimum hop).
    if (this.rising) {
      this.jumpTime += dt;
      if (!input.jumpHeld) this.releasedEarly = true;
      if (body.velocity.y >= 0) {
        this.rising = false;
      } else if (this.releasedEarly && this.jumpTime >= P.minJumpTime) {
        body.velocity.y *= P.jumpCut;
        this.rising = false;
      }
    }

    // Down: slide on the ground, dive in the air.
    if (input.downPressed) {
      if (onGround && !jumpedNow) {
        this.startSlide();
      } else if (!onGround) {
        body.velocity.y = Math.max(body.velocity.y, P.fastFall);
        this.rising = false;
        this.emit('player-dive');
      }
    }
    if (this.sliding) {
      this.slideTimer += dt;
      if (!onGround || (this.slideTimer >= P.slideTime && !input.downHeld)) this.endSlide();
    }

    this.updateAnim(onGround && !jumpedNow);
  }

  // Falling and about to touch down: keep the air jump, buffer a ground jump.
  landingSoon() {
    const vy = this.body.velocity.y;
    if (vy <= 0) return false;
    return (G - this.body.bottom) / vy < P.jumpBuffer;
  }

  jump(air) {
    if (this.sliding) this.endSlide();
    this.body.setVelocityY(-(air ? this.jumpCfg.v2 : this.jumpCfg.v1));
    if (air) this.airJumps -= 1;
    this.buffer = 0;
    this.coyote = 0;
    this.grounded = false;
    this.rising = true;
    this.jumpTime = 0;
    this.releasedEarly = false;
    this.emit('player-jump', air);
  }

  land(input) {
    this.emit('player-land');
    if (input.downHeld) this.startSlide();
  }

  startSlide() {
    this.slideTimer = 0;
    if (this.sliding) return;
    this.sliding = true;
    this.setHitbox(this.hero.slideBody);
    this.emit('player-slide');
  }

  endSlide() {
    if (!this.sliding) return;
    this.sliding = false;
    this.setHitbox(this.hero.body);
  }

  die() {
    this.mode = 'dead';
    this.endSlide();
    this.rising = false;
    this.body.setVelocityY(-220 * SCALE);
    this.play('hero-hurt');
  }

  // Walk-off at the exit door: physics keeps her on the floor, the scene tweens x.
  exit() {
    this.mode = 'exit';
    this.endSlide();
    this.rising = false;
  }

  updateAnim(onGround) {
    let key;
    if (this.mode === 'dead') key = 'hero-hurt';
    else if (this.sliding) key = 'hero-slide';
    else if (!onGround) key = this.body.velocity.y < 0 ? 'hero-jump' : 'hero-fall';
    else key = 'hero-run';
    if (this.anims.currentAnim?.key !== key) this.play(key);
  }
}
