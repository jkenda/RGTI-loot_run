import { vec2, vec3 } from "../lib/gl-matrix-module.js";

export class Utils {

    static init(object, defaults, options) {
        let filtered = Utils.clone(options || {});
        let defaulted = Utils.clone(defaults || {});
        for (let key in filtered) {
            if (!defaulted.hasOwnProperty(key)) {
                delete filtered[key];
            }
        }
        Object.assign(object, defaulted, filtered);
    }

    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    static getPoint(index, points) {
        return new Ammo.btVector3(points[3 * index], points[3 * index + 1], points[3 * index + 2]);
    }

    static toAmmoMesh(triangles, points) {
        const mesh = new Ammo.btTriangleMesh(true, true);

        for (let i = 0; i < triangles.length; i += 3) {
            const p1 = this.getPoint(triangles[i], points);
            const p2 = this.getPoint(triangles[i + 1], points);
            const p3 = this.getPoint(triangles[i + 2], points);

            mesh.addTriangle(p1, p2, p3, false);
        }

        return mesh;
    }

    static getTangents(model) {
        const vertices = model.vertices;
        const texcoords = model.texcoords;
        const indices = model.indices;

        const tangents = new Array(vertices.length);
        const bitangents = new Array(vertices.length);

        for (let i = 0; i < indices.length; i += 3) {
            const [i1, i2, i3] = indices.slice(i, i + 3);

            const v1 = vertices.slice(3 * i1, 3 * i1 + 3);
            const v2 = vertices.slice(3 * i2, 3 * i2 + 3);
            const v3 = vertices.slice(3 * i3, 3 * i3 + 3);

            const uv1 = texcoords.slice(2 * i1, 2 * i1 + 2);
            const uv2 = texcoords.slice(2 * i2, 2 * i2 + 2);
            const uv3 = texcoords.slice(2 * i3, 2 * i3 + 2);

            const edge1 = vec3.sub(vec3.create(), v2, v1);
            const edge2 = vec3.sub(vec3.create(), v3, v1);
            const duv1 = vec2.sub(vec2.create(), uv2, uv1);
            const duv2 = vec2.sub(vec2.create(), uv3, uv1);

            const f = 1.0 / (duv1[0] * duv2[1] - duv2[0] * duv1[1]);

            let tanx = f * (duv2[1] * edge1[0] - duv1[1] * edge2[0]);
            let tany = f * (duv2[1] * edge1[1] - duv1[1] * edge2[1]);
            let tanz = f * (duv2[1] * edge1[2] - duv1[1] * edge2[2]);

            let bitx = f * (-duv2[0] * edge1[0] + duv1[0] * edge2[0]);
            let bity = f * (-duv2[0] * edge1[1] + duv1[0] * edge2[1]);
            let bitz = f * (-duv2[0] * edge1[2] + duv1[0] * edge2[2]);

            let l = Math.sqrt(tanx * tanx + tany * tany + tanz * tanz);
            tanx /= l; tany /= l; tanz /= l;
            l = Math.sqrt(bitx * bitx + bity * bity + bitz * bitz);
            bitx /= l; bity /= l; bitz /= l;

            tangents[3 * i1] = tanx; tangents[3 * i1 + 1] = tany; tangents[3 * i1 + 2] = tanz;
            tangents[3 * i2] = tanx; tangents[3 * i2 + 1] = tany; tangents[3 * i2 + 2] = tanz;
            tangents[3 * i3] = tanx; tangents[3 * i3 + 1] = tany; tangents[3 * i3 + 2] = tanz;

            bitangents[3 * i1] = bitx; bitangents[3 * i1 + 1] = bity; bitangents[3 * i1 + 2] = bitz;
            bitangents[3 * i2] = bitx; bitangents[3 * i2 + 1] = bity; bitangents[3 * i2 + 2] = bitz;
            bitangents[3 * i3] = bitx; bitangents[3 * i3 + 1] = bity; bitangents[3 * i3 + 2] = bitz;

        }

        return [tangents, bitangents];
    }

}
