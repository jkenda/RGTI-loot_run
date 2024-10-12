import { Mesh } from './Mesh.js';

import { Node } from './Node.js';
import { Model } from './Model.js';
import { Camera } from './Camera.js';

import { Scene } from './Scene.js';
import { Player } from './Player.js';
import { Light } from './Light.js';

export class SceneBuilder {

    constructor(spec) {
        this.spec = spec;
    }

    createNode(spec) {
        switch (spec.type) {
            case "camera": {
                const audio = this.spec.audio[spec.model];
                return new Camera(audio, spec);
            }
            case "player": {
                const mesh = new Mesh(this.spec.meshes[spec.model]);
                const diffuseMap = this.spec.diffuseMaps[spec.model];
                const specularMap = this.spec.specularMaps[spec.model];
                const normalMap = this.spec.normalMaps[spec.model];
                const audio = this.spec.audio[spec.model];
                return new Player(mesh, diffuseMap, specularMap, normalMap, audio, spec);
            }
            case "model": {
                const mesh = new Mesh(this.spec.meshes[spec.model]);
                const diffuseMap = this.spec.diffuseMaps[spec.model];
                const specularMap = this.spec.specularMaps[spec.model];
                const normal = this.spec.normalMaps[spec.model];
                const audio = this.spec.audio[spec.model];
                return new Model(mesh, diffuseMap, specularMap, normal, audio, spec);
            }
            case "light": {
                spec.colide = false;
                return new Light(spec);
            }
            default: return new Node(spec);
        }
    }

    addNewNodeToParent(parent, spec) {
        const node = this.createNode(spec);
        parent.addChild(node);
        node.childrenNodes.forEach(child => {
            this.addNewNodeToParent(node, child);
        });
    }

    build() {
        let scene = new Scene(new Node({ colide: false, tag: "ROOT" }));
        scene.directionalLight = this.spec.directionalLight;
        this.spec.nodes.forEach(spec => {
            this.addNewNodeToParent(scene, spec);
        });
        return scene;
    }

}
