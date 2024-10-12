import { mat4, vec3 } from "../lib/gl-matrix-module.js";

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

export class Sound {

    constructor(audio) {
        this.audioElement = audio.cloneNode(true);
        this.audioElement.loop = true;

        this.panner = audioCtx.createPanner();
        this.panner.panningModel = "HRTF";
        this.panner.distanceModel = "exponential";
        this.panner.refDistance = 10;
        this.panner.rolloffFactor = 3;

        this.canvas = document.querySelector("canvas");

        const track = audioCtx.createMediaElementSource(this.audioElement);
        track.connect(this.panner).connect(audioCtx.destination);

        document.addEventListener("pointerlockchange", _ => {
            if (document.pointerLockElement === this.canvas)
                this.audioElement.play();
            else
                this.audioElement.pause();
        });
    }

    setPosition([x, y, z]) {
        this.panner.positionX.value = x;
        this.panner.positionY.value = y;
        this.panner.positionZ.value = z;
    }

    pause() {
        this.audioElement.pause();
    }

    play() {
        this.audioElement.play();
    }

}

const zero = vec3.clone([0, 0, 0]);
const position = vec3.create();

export default class AudioPosition {

    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.canvas = document.querySelector("canvas");

        document.addEventListener("pointerlockchange", _ => {
            if (document.pointerLockElement === this.canvas)
                audioCtx.resume();
            else
                audioCtx.suspend();
        });
    }

    update() {
        const mvMatrixStack = [];
        let mvMatrix = this.camera.getNonScaledGlobalTransform();
        mat4.invert(mvMatrix, mvMatrix);

        this.scene.traverse(node => {
            mvMatrixStack.push(mat4.clone(mvMatrix));
            mat4.mul(mvMatrix, mvMatrix, node.transform);

            if (node.audio) {
                vec3.transformMat4(position, zero, mvMatrix);
                node.audio.setPosition(position);
            }

        }, _ => {
            mvMatrix = mvMatrixStack.pop();
        });
    }

}