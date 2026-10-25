import * as Phaser from 'phaser';
import { CONFIG, SCALE } from '../config.js';
import { metrics } from '../systems/metrics.js';

const P = CONFIG.player;
const G = CONFIG.groundY;

// The runner. Stays at a fixed x; Arcade handles gravity and the floor (world
// bounds bottom = ground). Emits 'player-jump' (air: boolean), 'player-land'
// and 'player-down' (fall) for sound and particles.
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

    this.skin = 'hero'; // outfit: sprite / anim prefix, see setSkin
    this.mode = 'run'; // run | dead | exit
    this.grounded = true;
    this.flashTime = 0; // s left holding the phone up
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

    this.flashTime = Math.max(0, this.flashTime - dt);
    if (this.mode !== 'run') {
      if (this.mode === 'dead') this.settle(dt, onGround);
      this.updateAnim(onGround);
      return;
    }

    let jumpedNow = false;
    if (onGround) {
      if (!this.grounded) this.emit('player-land');
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


    this.updateAnim(onGround && !jumpedNow);
  }

  // Falling and about to touch down: keep the air jump, buffer a ground jump.
  landingSoon() {
    const vy = this.body.velocity.y;
    if (vy <= 0) return false;
    return (G - this.body.bottom) / vy < P.jumpBuffer;
  }

  jump(air) {
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

  // Outfit for this level: 'hero' or 'heroWinter'; the knocked-down poses
  // come from the matching `${skin}Down` sheet.
  setSkin(skin) {
    this.skin = skin;
    this.play(`${skin}-run`);
  }

  // Holds the phone up for a camera flash.
  flash() {
    this.flashTime = 0.3;
  }

  // fall: 'trip' (forward onto her stomach), 'knock' (bounced back onto her
  // bottom) or 'hurt' (a plain hurt hop).
  die(fall = 'hurt') {
    this.mode = 'dead';
    this.rising = false;
    this.fall = fall;
    this.downTime = 0;
    this.downed = false;
    const hop = { trip: 170, knock: 200, hurt: 220 }[fall];
    this.body.setVelocityY(-hop * SCALE);
    this.deadAnim = fall === 'hurt' ? `${this.skin}-hurt` : `${this.skin}Down-${fall}`;
    if (fall !== 'hurt') this.setHitbox(this.hero.downBody);
    this.play(this.deadAnim);
  }

  // Back on the floor after a trip or knock-back: lie / sit there, dazed.
  settle(dt, onGround) {
    this.downTime += dt;
    if (this.downed || this.fall === 'hurt' || !onGround || this.downTime < 0.1) return;
    this.downed = true;
    this.deadAnim = `${this.skin}Down-${this.fall === 'trip' ? 'prone' : 'sit'}`;
    this.emit('player-down', this.fall);
  }

  // Walk-off at the exit door: physics keeps her on the floor, the scene tweens x.
  exit() {
    this.mode = 'exit';
    this.rising = false;
  }

  // Running again after walking out through a level's door.
  reenter(x) {
    this.mode = 'run';
    this.x = x;
    this.setAlpha(1);
  }

  updateAnim(onGround) {
    let key;
    if (this.mode === 'dead') key = this.deadAnim;
    else if (this.flashTime > 0 && this.mode === 'run') key = `${this.skin}-flash`;
    else if (!onGround) key = `${this.skin}-${this.body.velocity.y < 0 ? 'jump' : 'fall'}`;
    else key = `${this.skin}-run`;
    if (this.anims.currentAnim?.key !== key) this.play(key);
  }
}
