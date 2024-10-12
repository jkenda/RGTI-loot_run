const imgPath = "common/images/";
const modelPath = "common/models/";
const audioPath = "common/audio/";

export class SceneLoader {

    static async loadScene(url) {
        const scene = await this.loadJson(url);

        scene.meshes = {};
        scene.diffuseMaps = {};
        scene.specularMaps = {};
        scene.normalMaps = {};
        scene.audio = {};

        const promises = [];

        for (const [key, value] of Object.entries(scene.models)) {
            if (value.mesh) promises.push(this.loadJson(modelPath + value.mesh).then(r => scene.meshes[key] = r));
            if (value.texture) promises.push(this.loadImage(imgPath + value.texture + "/diffuse.jpg").then(r => scene.diffuseMaps[key] = r));
            if (value.texture) promises.push(this.loadImage(imgPath + value.texture + "/specular.jpg").then(r => scene.specularMaps[key] = r));
            if (value.texture) promises.push(this.loadImage(imgPath + value.texture + "/normal.jpg").then(r => scene.normalMaps[key] = r));
            if (value.audio) promises.push(this.loadAudio(audioPath + value.audio).then(r => scene.audio[key] = r));
        }

        await Promise.all(promises);
        console.clear();

        return scene;
    }

    static loadImage(url) {
        return new Promise((resolve, _) => {
            const image = new Image();
            image.addEventListener("load", _ => resolve(image));
            image.addEventListener("error", _ => resolve(undefined));
            image.src = url;
        });
    }

    static loadAudio(url) {
        return new Promise((resolve, _) => {
            const audio = new Audio(url);
            audio.addEventListener("canplaythrough", _ => resolve(audio));
            audio.addEventListener("error", _ => resolve(undefined));
        });
    }

    static loadJson(url) {
        return fetch(url).then(response => response.json());
    }

}
