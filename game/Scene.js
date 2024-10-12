import { Player } from "./Player.js";
export class Scene {

    constructor(root) {
        this.root = root;
        this.player = null;
    }

    addChild(node) {
        if (node instanceof Player) {
            this.player = node;
            node.scene = this;
        }
        this.root.addChild(node);
    }

    traverse(before, after) {
        this.root.traverse(before, after);
    }

}
