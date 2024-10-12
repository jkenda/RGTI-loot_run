import { vec3 } from "../lib/gl-matrix-module.js"
import { Light } from "./Light.js";

export class Animation {

    constructor(scene) {
        scene.animation = this;
        this.animated = getAnimatedNodes(scene);
    }

    removeRotation(node) {
        const index = this.animated.rotation.indexOf(node);

        if (index > -1)
            this.animated.rotation.splice(index, 1);
    }

    addRotation(node) {
        if (node.animation) {
            setOrig(node)

            if (node.animation.translation !== undefined)
                this.animated.translation.push(node)

            if (node.animation.rotation?.type == "linear")
                this.animated.linearRotation.push(node)
            else if (node.animation.rotation?.type !== undefined)
                this.animated.rotation.push(node)
        }
    }

    update(t, dt) {
        this.animated.translation.forEach(node => {
            const scalar = getScalar(t,
                node.animation.translation.type,
                node.animation.translation.frequency || Infinity,
                node.animation.translation.amplitude || 0,
                node.animation.translation.fi || 0
            );

            const deviation = vec3.clone(node.animation.translation.axis);
            vec3.scaleAndAdd(node.translation, node.origPosition, deviation, scalar);
            node.degrees();
        });

        this.animated.rotation.forEach(node => {
            const scalar = getScalar(t,
                node.animation.rotation.type,
                node.animation.rotation.frequency || Infinity,
                node.animation.rotation.amplitude || 0,
                node.animation.rotation.fi || 0
            );

            const deviation = vec3.clone(node.animation.rotation.axis);
            vec3.scaleAndAdd(node.rotation, node.origRotation, deviation, scalar);
            node.degrees();
        });

        this.animated.linearRotation.forEach((node) => {
            const diff = vec3.clone(node.animation.rotation.axis);
            const angleVelocity = node.animation.rotation.velocity;
            vec3.scaleAndAdd(node.rotation, node.rotation, diff, angleVelocity * dt);
            node.degrees();
        });

        this.animated.light.forEach((node) => {
            const scalar = getScalar(t,
                node.animation.type,
                node.animation.frequency || Infinity,
                node.animation.amplitude || 0,
                node.animation.fi || 0
            );

            if (node.animation.property == "ambient" || node.animation.property == "all")
                vec3.scaleAndAdd(node.ambient, node.origAmbient, node.ambient, scalar);
            if (node.animation.property == "diffuse" || node.animation.property == "all")
                vec3.scaleAndAdd(node.diffuse, node.origDiffuse, node.diffuse, scalar);
            if (node.animation.property == "specular" || node.animation.property == "all")
                vec3.scaleAndAdd(node.specular, node.origSpecular, node.specular, scalar);
        })
    }
}

function getScalar(t, type, freq, amplitude, fi) {

    let angularVelocity, t0;

    switch (type) {
        case "sin":
            angularVelocity = 2 * Math.PI * freq;
            return amplitude * Math.sin(angularVelocity * t + fi);
        case "cos":
            angularVelocity = 2 * Math.PI * freq;
            return amplitude * Math.cos(angularVelocity * t + fi);
        case "triangle":
            t0 = 1 / freq;
            return 4 * amplitude * freq * Math.abs(t % t0 - t0 / 2 + fi) - amplitude;
        case "square":
            t0 = 1 / freq;
            return (t + fi) % t0 < t0 / 2 ? amplitude : -amplitude;
        case "sawtooth":
            t0 = 1 / freq;
            return 2 * amplitude * (t + fi) % t0 - amplitude;
        case "perlin":
            angularVelocity = 2 * Math.PI * freq;
            return amplitude * (
                -Math.sin(angularVelocity * 1.1 * t)
                - 0.7 * Math.sin(angularVelocity * 1.7 * Math.E * t)
                + 1.1 * Math.sin(angularVelocity * 0.97 * Math.PI * t)
            ) / 3;
        default:
            return 0;
    }
}

function getAnimatedNodes(scene) {
    const trans = [];
    const rot = [];
    const rotLinear = [];
    const light = [];

    if (scene.directionalLight?.animation) {
        setOrigLight(scene.directionalLight);
        light.push(scene.directionalLight);
    }

    scene.traverse(node => {
        if (node.animation) {
            setOrig(node);

            if (node.animation.translation !== undefined)
                trans.push(node);

            if (node.animation.rotation?.type == "linear")
                rotLinear.push(node);
            else if (node.animation.rotation?.type !== undefined)
                rot.push(node);

            if (node instanceof Light) {
                light.push(node);
                setOrigLight(node);
            }
        }
    });

    return { translation: trans, rotation: rot, linearRotation: rotLinear, light: light };
}

function setOrig(node) {
    if (node.animation.translation) {
        node.origPosition = vec3.clone(node.translation);
        node.animation.translation.axis = vec3.clone(node.animation.translation.axis);
        vec3.normalize(node.animation.translation.axis, node.animation.translation.axis);
    }

    if (node.animation.rotation) {
        node.origRotation = vec3.clone(node.rotation);
        node.animation.rotation.axis = vec3.clone(node.animation.rotation.axis);
        vec3.normalize(node.animation.rotation.axis, node.animation.rotation.axis);
    }
}

function setOrigLight(node) {
    if (!node.animation.property) {
        node.animation.property = "all";
    }

    if (node.animation.property == "ambient" || node.animation.property == "all")
        node.origAmbient = vec3.clone(node.ambient);
    if (node.animation.property == "diffuse" || node.animation.property == "all")
        node.origDiffuse = vec3.clone(node.diffuse);
    if (node.animation.property == "specular" || node.animation.property == "all")
        node.origSpecular = vec3.clone(node.specular);
}