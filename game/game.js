
import { Application } from "../common/engine/Application.js";

import { Renderer } from "./Renderer.js";
import { Physics } from "./Physics.js";
import { Animation } from "./Animation.js";
import { Camera } from "./Camera.js";
import { SceneLoader } from "./SceneLoader.js";
import { SceneBuilder } from "./SceneBuilder.js";
import { Hud } from "./Hud.js";
import AudioPosition from "./AudioPosition.js";

class App extends Application {
    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);
        this.time = Date.now() * 0.001;
        this.prevTime = this.time;
        this.startTime = this.time;
        this.aspect = 1;

        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener(
            "pointerlockchange",
            this.pointerlockchangeHandler
        );

        await this.load("game/scene.json");
    }

    async load(url) {
        const scene = await SceneLoader.loadScene(url);
        const builder = new SceneBuilder(scene);
        this.scene = builder.build();
        this.physics = new Physics(this.scene);
        this.physics.init();
        this.animation = new Animation(this.scene);

        // Find first camera.
        this.camera = null;
        this.scene.traverse((node) => {
            if (node instanceof Camera) {
                this.camera = node;
            }
        });

        this.camera.aspect = this.aspect;
        this.camera.updateProjection();
        this.renderer.prepare(this.scene, this.camera);
        this.audio = new AudioPosition(this.scene, this.camera);

        this.scene.player.addChild(this.camera);
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.scene.player.enable();
        } else {
            this.scene.player.disable();
        }
    }

    update() {
        this.time = Date.now() * 0.001 - this.startTime
        const t = this.time;
        const dt = this.time - this.prevTime;
        this.prevTime = this.time;

        if (this.scene?.player) {
            this.scene.player.update(dt);
            const x = this.scene.player.translation[0];
            const y = this.scene.player.translation[1];
            const z = this.scene.player.translation[2];
            Hud.displayCoords(x, y, z);
            Hud.displayFPS(dt);
        }

        if (this.animation) {
            this.animation.update(t, dt);
        }

        if (this.physics) {
            this.physics.update(dt);
        }

        if (this.audio) {
            this.audio.update();
        }
    }

    render() {
        if (this.scene) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.aspect = w / h;
        if (this.camera) {
            this.camera.aspect = this.aspect;
            this.camera.updateProjection();
        }
    }
}

Ammo().then(async _ => {
    const canvas = document.querySelector("canvas");
    const app = new App(canvas);

    canvas.addEventListener("click", _ => { app.enableCamera() });
});