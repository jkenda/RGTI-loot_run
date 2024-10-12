import { vec3 } from "../lib/gl-matrix-module.js";
import { Node } from "./Node.js"
import { Utils } from "./Utils.js";

export const Caster = { POINT: 0, PLANE: 1 };

export class Light extends Node {

    constructor(options) {
        super(options);

        Utils.init(this, Light.defaults(this.caster === "plane"), options);
        this.caster = this.caster === "plane" ? Caster.PLANE : Caster.POINT;
        this.ambient = vec3.clone(this.ambient);
        this.diffuse = vec3.clone(this.diffuse);
        this.specular = vec3.clone(this.specular);
    }
}

Light.defaults = (plane) => plane
    ? {
        caster: Caster.PLANE,

        translation: [0, 0, 0],
        normal: [0, 1, 0],
        attenuation: [0, 0.05, 0], // constant, linear, quadratic 

        ambient: [0.3, 0.3, 0.3],
        diffuse: [1, 1, 1],
        specular: [0.5, 0.5, 0.5]
    }
    : {
        caster: Caster.POINT,

        translation: [0, 0, 0],
        attenuation: [1, 0, 0.2], // constant, linear, quadratic 

        ambient: [0.3, 0.3, 0.3],
        diffuse: [1, 1, 1],
        specular: [0.7, 0.7, 0.7]
    }