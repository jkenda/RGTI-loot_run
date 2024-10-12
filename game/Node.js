import { vec3, mat4, quat } from '../lib/gl-matrix-module.js';
import { Sound } from './AudioPosition.js';

import { Utils } from './Utils.js';

export class Node {

    constructor(options, audio) {
        Utils.init(this, Node.defaults, options);
        this.transform = mat4.create();

        this.quaternion = quat.fromEuler(quat.create(), ...this.rotation);

        this.children = [];
        this.parent = null;
        this.updateTransform();

        if (audio) this.audio = new Sound(audio);
    }

    updateTransform() {
        const t = this.transform;
        const q = this.quaternion;

        if (this.yRot)
            quat.rotateY(q, q, this.yRot)

        const v = vec3.clone(this.translation);
        const s = vec3.clone(this.scale);
        mat4.fromRotationTranslationScale(t, q, v, s);
    }

    getNonScaledTransform() {
        const t = mat4.create();
        const q = this.quaternion;
        const v = vec3.clone(this.translation);
        const s = vec3.fromValues(1, 1, 1);
        mat4.fromRotationTranslationScale(t, q, v, s);
        return t;
    }

    getNonScaledGlobalTransform() {
        if (!this.parent) {
            return this.getNonScaledTransform();
        } else {
            let transform = this.parent.getNonScaledGlobalTransform();
            return mat4.mul(transform, transform, this.getNonScaledTransform());
        }
    }

    getGlobalTransform() {
        if (!this.parent) {
            return mat4.clone(this.transform);
        } else {
            let transform = this.parent.getGlobalTransform();
            return mat4.mul(transform, transform, this.transform);
        }
    }

    getGlobalTranslation() {
        if (!this.parent) {
            return [...this.translation]
        } else {
            let translation = this.parent.getGlobalTranslation();
            return vec3.add(vec3.create(), translation, vec3.fromValues(...this.translation));
        }
    }

    setVelocity(velocity, jump) {
        let oldVelocity = this.rigidbody.getLinearVelocity();
        oldVelocity.setX(velocity[0]);
        if (jump) oldVelocity.setY(velocity[1]);
        oldVelocity.setZ(velocity[2]);
        this.rigidbody.setLinearVelocity(oldVelocity);
    }

    rotate(angular) {
        this.rigidbody.setAngularVelocity(new Ammo.btVector3(...angular));
    }

    printPos() {
        let ms = this.rigidbody.getMotionState();

        let transform = new Ammo.btTransform()
        ms.getWorldTransform(transform);
        let p = transform.getOrigin();
        console.log(p.x(), p.y(), p.z())
    }

    degrees() {
        let ms = this.rigidbody.getMotionState();

        // ta koda je at this point ratala tak špaget da še sam nevem kaj se dogaja
        if (ms) {
            let transform = new Ammo.btTransform()
            ms.getWorldTransform(transform);

            let p = transform.getOrigin();
            p.setX(this.translation[0]);
            p.setY(this.translation[1]);
            p.setZ(this.translation[2]);

            let q = transform.getRotation();
            let degrees = this.rotation.map(x => x * 180 / Math.PI);
            let rot = quat.fromEuler(quat.create(), ...degrees);
            q.setX(rot[0]);
            q.setY(rot[1]);
            q.setZ(rot[2]);
            q.setW(rot[3]);

            transform.setRotation(q);
            transform.setOrigin(p);
            ms.setWorldTransform(transform);
        }
    }

    addChild(node) {
        if (node.parent) {
            node.parent.removeChild(node);
        }
        this.children.push(node);
        node.parent = this;
    }

    removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }

    traverse(before, after) {
        if (before) {
            before(this);
        }
        for (let child of this.children) {
            child.traverse(before, after);
        }
        if (after) {
            after(this);
        }
    }

}

Node.defaults = {
    tag: "default",
    mass: 0,
    translation: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    colide: true,
    aabb: {
        min: [0, 0, 0],
        max: [0, 0, 0],
    },
    animation: null,
    gravity: -20,
    trap: false,
    trapIndex: 0,

    childrenNodes: [],
    shape: null,
    colliderSize: [0, 0, 0],

    caster: null,
    normal: null,
    attenuation: null,
    ambient: null,
    diffuse: null,
    specular: null,

    bodyPart: false
};
