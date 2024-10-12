import { Model } from './Model.js';
import { vec3 } from '../lib/gl-matrix-module.js';

import { Utils } from './Utils.js';
import { Hud } from './Hud.js';
import { Menus } from './Menus.js';

export class Player extends Model {

    constructor(mesh, diffuseMap, specularMap, normalMap, audio, options) {
        super(mesh, diffuseMap, specularMap, normalMap, audio, options);
        Utils.init(this, this.constructor.defaults, options);
        this.keys = {};

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        this.damageCooldown = 1;
        this.currentDamageCooldown = 0;
        this.health = 3;
        this.dead = false;
        this.hud = new Hud();
        this.menu = new Menus();
        this.menu.addEventListeners();

        this.victorySound = new Audio("/common/audio/victory.mp3")
        this.damageSound = new Audio("/common/audio/damage.mp3")
        this.deathSound = new Audio("/common/audio/death.mp3")
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    takeDamage(num) {
        this.damageSound.play();
        this.health -= num;
        this.hud.displayHp(this.health);
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.dead) return;
        this.deathSound.play();
        this.hud.displayHp(0);
        this.resetChildren = [...this.children];
        this.oldRigid = this.rigidbody;

        const toRemove = [];
        let camera = null;
        for (let bodyPart of this.children) {
            if (bodyPart.bodyPart) {
                toRemove.push(bodyPart);
            } else {
                camera = bodyPart;
            }
        }

        for (let body of toRemove) {
            body.translation = [...this.translation];
            body.oldRigid = body.rigidbody;
            body.rigidbody = this.physics.createRagdol(body);

            this.scene.animation.removeRotation(body);
            this.scene.addChild(body);
        }

        if (camera) {
            camera.yRot = this.yRot;
            let globalCamera = camera.getGlobalTransform();
            this.scene.addChild(camera);

            let ms = camera.rigidbody.getMotionState();

            let transform = new Ammo.btTransform()
            ms.getWorldTransform(transform);
            let p = transform.getOrigin();
            p.setX(globalCamera[12]);
            p.setY(globalCamera[13]);
            p.setZ(globalCamera[14]);
            transform.setOrigin(p);
            ms.setWorldTransform(transform);
        }

        this.rigidbody = this.physics.createRagdol(this);
        this.dead = true;

        setTimeout(() => { this.menu.showDeathMenu() }, 1500);
        setTimeout(() => { this.reset() }, 2500);
    }

    reset() {
        this.health = 3;
        this.hud.displayHp(3);
        this.dead = false;
        this.yRot = 0;
        this.physics.restart(this);

        for (let child of this.resetChildren) {
            if (child.oldRigid) {
                this.physics.switchBodies(child);
                child.translation = [...child.startPos]
                child.rotation = [0, 0, 0]
                this.scene.animation.addRotation(child);
            } else if (child.tag == "camera") {
                this.physics.restart(child);
                child.yRot = 0;
            }
            this.addChild(child);
        }
        this.dead = false;
        this.victory = false;
    }

    update(dt) {
        if (this.dead || this.victory) return;
        //if (this.keys["KeyR"]) this.die();
        const c = this;

        if (this.currentDamageCooldown < 0) {
            // index 2 so "non insta kill" traps
            if (this.physics.colided(2)) {
                this.currentDamageCooldown = this.damageCooldown;
                this.takeDamage(1);
            }

            // index 3 so "insta kill" traps
            if (this.physics.colided(3)) {
                this.currentDamageCooldown = this.damageCooldown;
                this.die();
            }
        }

        if (this.physics.colided(10)) {
            this.victory = true;
            this.victorySound.play();
            this.resetChildren = [...this.children];
            setTimeout(() => { this.menu.showVictoryMenu() }, 1000);
            setTimeout(() => { this.reset() }, 2000);
            this.children.forEach((child) => {
                if (child.animation) {
                    child.animation.rotation.amplitude = 0;
                }
            });
            return;
        }
        this.currentDamageCooldown -= dt;

        const forward = vec3.rotateY(vec3.create(), [0, 0, -1], [0, 0, 0], this.yRot);
        const right = vec3.rotateY(vec3.create(), [1, 0, 0], [0, 0, 0], this.yRot);
        const up = vec3.fromValues(0, 1, 0);

        let velocity = vec3.create();
        const grounded = this.physics.isGrounded();
        const notOnWall = this.physics.notOnWall();

        if (grounded || notOnWall) {
            if (this.keys['KeyW']) {
                vec3.add(velocity, velocity, forward);
            }
            if (this.keys['KeyS']) {
                vec3.sub(velocity, velocity, forward);
            }
            if (this.keys['KeyD']) {
                vec3.add(velocity, velocity, right);
            }
            if (this.keys['KeyA']) {
                vec3.sub(velocity, velocity, right);
            }
        }

        if (!this.godMode) {
            if (this.keys["Space"] && grounded) {
                this.rigidbody.applyForce(new Ammo.btVector3(0, this.jumpyForce, 0));
            }

            // 2: update velocity
            vec3.scaleAndAdd(velocity, velocity, velocity, dt * c.maxSpeed);
            this.setVelocity(velocity, this.godMode);
        } else {
            this.rigidbody.setGravity(new Ammo.btVector3(0, 0, 0));
            if (this.keys["Space"]) {
                vec3.add(velocity, velocity, up);
            }
            if (this.keys["ShiftLeft"]) {
                vec3.sub(velocity, velocity, up);
            }

            vec3.scaleAndAdd(velocity, velocity, velocity, 10)
            this.setVelocity(velocity, this.godMode);
        }

        let amplitude;
        const vel = vec3.len(velocity);
        if (vel > 0.1 && grounded) {
            this.audio.play();
            amplitude = 0.4;
        }
        else {
            this.audio.pause();
            amplitude = 0;
        }

        this.children.forEach((child) => {
            if (child.animation) {
                child.animation.rotation.amplitude = amplitude;
            }
        })
    }


    enable() {
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disable() {
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);

        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

    mousemoveHandler(e) {
        const dx = e.movementX;
        this.yRot -= dx * this.mouseSensitivity;
    }

}

Player.defaults = {
    godMode: false,
    maxSpeed: 300,
    jumpyForce: 500,
    yRot: 0,
    velocity: [0, 0, 0],
    mouseSensitivity: 0.02
}
