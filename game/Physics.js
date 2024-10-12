import { vec3 } from "../lib/gl-matrix-module.js";
import { Utils } from "./Utils.js"

export class Physics {

    constructor(scene) {
        this.scene = scene;
        this.nodes = this.getNodes(scene);
        this.gravity = scene.root.gravity;
        this.physicsWorld;
    }

    init() {
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        let overlappingPairCache = new Ammo.btDbvtBroadphase();
        let solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0, this.gravity, 0));

        for (let node of this.nodes) {
            this.createRigidBody(node);
        }
    }

    createRigidBody(node) {
        let transform = new Ammo.btTransform();

        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(...node.translation));

        transform.setRotation(new Ammo.btQuaternion(...node.quaternion));
        let motionState = new Ammo.btDefaultMotionState(transform);
        let colShape;
        if (node.mesh && node.mass == 0 && !node.bodyPart) {
            const mesh = Utils.toAmmoMesh(node.mesh.indices, node.mesh.vertices);
            colShape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);
            colShape.setLocalScaling(new Ammo.btVector3(node.scale[0], node.scale[1], node.scale[2]));
        } else if (node.shape == "cylinder") {
            const size = node.colliderSize;
            colShape = new Ammo.btCylinderShape(new Ammo.btVector3(size[0], size[1], size[2]));
        } else {
            const size = node.colliderSize;
            colShape = new Ammo.btBoxShape(new Ammo.btVector3(size[0], size[1], size[2]));
        }
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(node.mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(node.mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        if (node.trap) {
            body.setCollisionFlags(2);
            body.setActivationState(4);
            body.setUserIndex(node.trapIndex);
        }

        if (node.tag == "player") {
            body.setDamping(0.9, 0.9);
            body.setAngularFactor(new Ammo.btVector3(0, 0, 0));
            body.setUserIndex(1);
            body.setActivationState(4);
        }

        if (node.tag == "chest") {
            body.setUserIndex(10);
        }

        // za potrebe respawna
        if (node.tag == "player" || node.tag == "camera" || node.bodyPart) {
            let trans = new Ammo.btTransform();
            body.getMotionState().getWorldTransform(trans);
            let p = trans.getOrigin();
            let q = trans.getRotation();
            node.startPos = [p.x(), p.y(), p.z()]
            node.startRotation = [q.x(), q.y(), q.z(), q.w()]
        }

        node.rigidbody = body;
        node.physics = this;
        this.physicsWorld.addRigidBody(body);
    }

    createRagdol(node) {
        this.physicsWorld.removeRigidBody(node.rigidbody);
        let transform = new Ammo.btTransform();

        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(...node.translation));

        transform.setRotation(new Ammo.btQuaternion(...node.quaternion));
        let motionState = new Ammo.btDefaultMotionState(transform);
        let colShape = new Ammo.btBoxShape(new Ammo.btVector3(0.2, 0.5, 0.2));

        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(1, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(1, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        this.physicsWorld.addRigidBody(body);
        return body;
    }

    switchBodies(node) {
        this.physicsWorld.removeRigidBody(node.rigidbody);
        this.physicsWorld.addRigidBody(node.oldRigid);
        node.rigidbody = node.oldRigid;
    }

    restart(node) {
        this.physicsWorld.removeRigidBody(node.rigidbody);
        let transform = new Ammo.btTransform();

        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(...node.startPos));
        transform.setRotation(new Ammo.btQuaternion(...node.startRotation));
        let motionState = new Ammo.btDefaultMotionState(transform);

        const size = node.colliderSize;
        let colShape = new Ammo.btBoxShape(new Ammo.btVector3(size[0], size[1], size[2]));
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(node.mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(node.mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        if (node.tag == "player") {
            body.setDamping(0.9, 0.9);
            body.setAngularFactor(new Ammo.btVector3(0, 0, 0));
            body.setUserIndex(1);
            body.setActivationState(4);
        }

        node.rigidbody = body;
        node.physics = this;
        this.physicsWorld.addRigidBody(body);
    }

    update(dt) {
        this.physicsWorld.stepSimulation(dt, 10);

        this.nodes.forEach(node => {
            let rigidbody = node.rigidbody;
            let ms = rigidbody.getMotionState();

            if (ms) {
                let transform = new Ammo.btTransform()
                ms.getWorldTransform(transform);
                let p = transform.getOrigin();
                let rot = transform.getRotation();
                node.translation = [p.x(), p.y(), p.z()];
                node.quaternion = [rot.x(), rot.y(), rot.z(), rot.w()];
                node.updateTransform();
            }
        });
    }

    getNodes(scene) {
        const nodes = [];
        scene.traverse(node => {
            if (node.colide) {
                nodes.push(node);
            }
        })
        return nodes;
    }

    colided(index) {
        for (let i = 0; i < this.dispatcher.getNumManifolds(); i++) {
            const pair = this.dispatcher.getManifoldByIndexInternal(i);

            if (pair.getNumContacts() == 0) continue;

            const body0 = pair.getBody0();
            const body1 = pair.getBody1();
            let player = null;
            let other = null;

            if (body0.getUserIndex() == 1) {
                player = body0;
                other = body1;
            }

            if (body1.getUserIndex() == 1) {
                player = body1;
                other = body0;
            }


            if (player) {
                if (other.getUserIndex() == index) return true;
            }
        }
        return false;
    }

    isGrounded() {
        for (let i = 0; i < this.dispatcher.getNumManifolds(); i++) {
            const pair = this.dispatcher.getManifoldByIndexInternal(i);
            const body0 = pair.getBody0();
            const body1 = pair.getBody1();
            let player = null;
            let playerNum;

            if (body0.getUserIndex() == 1) {
                player = body0;
                playerNum = 0;
            }

            if (body1.getUserIndex() == 1) {
                player = body1;
                playerNum = 1;
            }

            if (player) {

                for (let j = 0; j < pair.getNumContacts(); j++) {
                    const point = pair.getContactPoint(j);
                    const pointA = point.getPositionWorldOnA();
                    const pointB = point.getPositionWorldOnB();

                    let playerPoint, otherPoint;
                    if (playerNum == 1) {
                        playerPoint = pointA;
                        otherPoint = pointB;
                    } else {
                        playerPoint = pointB;
                        otherPoint = pointA;
                    }
                    let normal = point.get_m_normalWorldOnB();
                    if (normal.y() > 0.95) return true;
                }
            }
        }
        return false;
    }

    notOnWall() {
        for (let i = 0; i < this.dispatcher.getNumManifolds(); i++) {
            const pair = this.dispatcher.getManifoldByIndexInternal(i);
            const body0 = pair.getBody0();
            const body1 = pair.getBody1();
            let player = null;
            let playerNum;

            if (body0.getUserIndex() == 1) {
                player = body0;
                playerNum = 0;
            }

            if (body1.getUserIndex() == 1) {
                player = body1;
                playerNum = 1;
            }

            if (player) {
                for (let j = 0; j < pair.getNumContacts(); j++) {
                    const point = pair.getContactPoint(j);
                    const pointA = point.getPositionWorldOnA();
                    const pointB = point.getPositionWorldOnB();

                    let playerPoint, otherPoint;
                    if (playerNum == 1) {
                        playerPoint = pointA;
                        otherPoint = pointB;
                    } else {
                        playerPoint = pointB;
                        otherPoint = pointA;
                    }
                    let normal = point.get_m_normalWorldOnB();
                    if (Math.abs(normal.x()) > 0.7 || Math.abs(normal.z()) > 0.7) return false;
                }
            }
        }
        return true;
    }
}
