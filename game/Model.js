import { Node } from './Node.js';
import { Utils } from './Utils.js';

export class Model extends Node {

    constructor(mesh, diffuseMap, specularMap, normalMap, audio, options) {
        super(options, audio);
        Utils.init(this, Model.defaults, options);
        this.mesh = mesh;
        this.diffuseMap = diffuseMap;
        this.specularMap = specularMap;
        this.normalMap = normalMap;
    }
}

Model.defaults = {
    material: {
        shininess: 10
    }
}