import { mat3, mat4, vec3 } from '../lib/gl-matrix-module.js';

import { WebGL } from '../common/engine/WebGL.js';

import { shaders } from './shaders.js';
import { Light, Caster } from './Light.js';
import { Utils } from './Utils.js';
import { Model } from './Model.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
        gl.useProgram(this.programs.shader.program);

        this.defaultTexture = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255, 255, 255, 255])
        });
    }

    prepare(scene, camera) {
        scene.root.traverse(node => {

            node.gl = {};
            if (node.mesh)
                Object.assign(node.gl, this.createModel(node.mesh));
            if (node.diffuseMap)
                node.gl.diffuseMap = this.createTexture(node.diffuseMap);
            if (node.specularMap)
                node.gl.specularMap = this.createTexture(node.specularMap);
            if (node.normalMap)
                node.gl.normalMap = this.createTexture(node.normalMap);
        });

        this.initLighting(scene, camera);
    }

    initLighting(scene, camera) {
        const program = this.programs.shader;
        const gl = this.gl;

        let nPointLights = 0;
        let nPlaneLights = 0;

        scene.traverse(node => {
            if (node instanceof Light) {
                if (node.caster === Caster.PLANE)
                    nPlaneLights++;
                else
                    nPointLights++;
            }
        });

        gl.uniform1i(program.uniforms.nPointLights, nPointLights);
        gl.uniform1i(program.uniforms.nPlaneLights, nPlaneLights);

        gl.uniform1i(program.uniforms.hasDirLight, scene.directionalLight !== undefined);
        gl.uniform1f(program.uniforms.uFar, camera.far);
    }

    render(scene, camera) {
        const gl = this.gl;
        const program = this.programs.shader;
        const dirLight = scene.directionalLight

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0, 0, 0, 1); // background = black

        const mvMatrixStack = [];

        const rotMatrix = mat3.create();
        let mvMatrix = camera.getNonScaledGlobalTransform();
        mat4.invert(mvMatrix, mvMatrix);

        const lightDir = vec3.create();
        const lightPosition = vec3.create();

        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        if (dirLight !== undefined) {
            // directional light (world -> camera) rotate
            vec3.transformMat3(lightDir, dirLight.direction, mat3.fromMat4(rotMatrix, mvMatrix));
            this.updateDirLight(dirLight, lightDir);
        }

        let i = 0, j = 0;

        scene.traverse(node => {
            mvMatrixStack.push(mat4.clone(mvMatrix));
            mat4.mul(mvMatrix, mvMatrix, node.transform);

            if (node instanceof Light) {
                // plane light (model -> camera)
                if (node.caster === Caster.PLANE) {
                    vec3.transformMat4(lightPosition, node.translation, mvMatrix);
                    vec3.transformMat3(lightDir, node.normal, mat3.fromMat4(rotMatrix, mvMatrix));
                    this.updatePlaneLight(node, j++, lightPosition, lightDir);
                }
                else {
                    vec3.transformMat4(lightPosition, node.translation, mvMatrix);
                    this.updatePointLight(node, i++, lightPosition);
                }
            }
        }, _ => {
            mvMatrix = mvMatrixStack.pop();
        });

        scene.traverse(node => {
            mvMatrixStack.push(mat4.clone(mvMatrix));
            mat4.mul(mvMatrix, mvMatrix, node.transform);

            if (node.gl.vao) {
                gl.bindVertexArray(node.gl.vao);

                gl.uniformMatrix4fv(program.uniforms.uViewModel, false, mvMatrix);
                gl.uniform1f(program.uniforms.uShininess, node.material.shininess);

                gl.uniform1i(program.uniforms.useNormalMap, node.normalMap !== undefined);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, node.gl.diffuseMap);
                gl.uniform1i(program.uniforms.uDiffuseMap, 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, node.gl.specularMap || node.gl.diffuseMap);
                gl.uniform1i(program.uniforms.uSpecularMap, 1);

                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, node.gl.normalMap);
                gl.uniform1i(program.uniforms.uNormalMap, 2);

                gl.drawElements(gl.TRIANGLES, node.gl.indices, gl.UNSIGNED_SHORT, 0);
            }
        }, _ => {
            mvMatrix = mvMatrixStack.pop();
        });
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        const [tangents, bitangents] = Utils.getTangents(model);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bitangents), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    createTexture(texture) {
        const gl = this.gl;
        return WebGL.createTexture(gl, {
            image: texture,
            min: gl.NEAREST,
            mag: gl.LINEAR
        });
    }

    updateDirLight(light, direction) {
        const program = this.programs.shader;
        const gl = this.gl;

        gl.uniform3fv(program.uniforms["dirLight.direction"], direction);
        gl.uniform3fv(program.uniforms["dirLight.ambient"], light.ambient);
        gl.uniform3fv(program.uniforms["dirLight.diffuse"], light.diffuse);
        gl.uniform3fv(program.uniforms["dirLight.specular"], light.specular);
    }

    updatePlaneLight(light, i, point, normal) {
        const program = this.programs.shader;
        const gl = this.gl;

        gl.uniform3fv(program.uniforms[`planeLights[${i}].point`], point);
        gl.uniform3fv(program.uniforms[`planeLights[${i}].normal`], normal);
        gl.uniform3fv(program.uniforms[`planeLights[${i}].attenuation`], light.attenuation);

        gl.uniform3fv(program.uniforms[`planeLights[${i}].ambient`], light.ambient);
        gl.uniform3fv(program.uniforms[`planeLights[${i}].diffuse`], light.diffuse);
        gl.uniform3fv(program.uniforms[`planeLights[${i}].specular`], light.specular);

    }

    updatePointLight(light, i, position) {
        const program = this.programs.shader;
        const gl = this.gl;

        gl.uniform3fv(program.uniforms[`pointLights[${i}].position`], position);
        gl.uniform3fv(program.uniforms[`pointLights[${i}].attenuation`], light.attenuation);

        gl.uniform3fv(program.uniforms[`pointLights[${i}].ambient`], light.ambient);
        gl.uniform3fv(program.uniforms[`pointLights[${i}].diffuse`], light.diffuse);
        gl.uniform3fv(program.uniforms[`pointLights[${i}].specular`], light.specular);
    }
}
