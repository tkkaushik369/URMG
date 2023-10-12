import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

export default class userData {
	id;
	username;
	modelName = "cube";
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	controls;
	color;
	controlsOBJ;
	movements = {
		moveForward: false,
		moveBackward: false,
		moveLeft: false,
		moveRight: false,
		canJump: false
	};
	velocity = new THREE.Vector3();
	direction = new THREE.Vector3();
	geometry;
	material;
	model;
	jumpHeight =  120;
	weight = 60;

	keydownEvent(event) {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.movements.moveForward = true;
			break;
			case 'ArrowLeft':
			case 'KeyA':
				this.movements.moveLeft = true;
			break;
			case 'ArrowDown':
			case 'KeyS':
				this.movements.moveBackward = true;
			break;
			case 'ArrowRight':
			case 'KeyD':
				this.movements.moveRight = true;
			break;
			case 'Space':
				if (this.movements.canJump === true) this.velocity.y += this.jumpHeight;
				this.movements.canJump = false;
			break;
		}
	}

	keyupEvent(event)  {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.movements.moveForward = false;
			break;
			case 'ArrowLeft':
			case 'KeyA':
				this.movements.moveLeft = false;
			break;
			case 'ArrowDown':
			case 'KeyS':
				this.movements.moveBackward = false;
			break;
			case 'ArrowRight':
			case 'KeyD':
				this.movements.moveRight = false;
			break;
		}
	}

	update(delta) {
		if (this.controls.isLocked === true) {
			this.velocity.x -= this.velocity.x * 10.0 * delta;
			this.velocity.z -= this.velocity.z * 10.0 * delta;
			this.velocity.y -= 9.8 * this.weight * delta;
			this.direction.z = Number(this.movements.moveForward) - Number(this.movements.moveBackward);
			this.direction.x = Number(this.movements.moveRight) - Number(this.movements.moveLeft);
			this.direction.normalize();
			if (this.movements.moveForward || this.movements.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
			if (this.movements.moveLeft || this.movements.moveRight) this.velocity.x -= this.direction.x * 400.0 * delta;
			this.controls.moveRight(-this.velocity.x * delta);
			this.controls.moveForward(-this.velocity.z * delta);
			this.controls.getObject().position.y += this.velocity.y * delta;
			if (this.controlsOBJ.position.y < 10) {
				this.velocity.y = 0;
				this.controlsOBJ.position.y = 10;
				this.movements.canJump = true;
			}
		}
	}

	getUserData() {
		return {
			id:				this.id,
			username:		this.username,
			modelName:		this.modelName,
			color:			this.color,
			px:				this.controlsOBJ.position.x,
			py:				this.controlsOBJ.position.y,
			pz:				this.controlsOBJ.position.z,
			rx:				this.controlsOBJ.rotation.x,
			ry:				this.controlsOBJ.rotation.y,
			rz:				this.controlsOBJ.rotation.z
		};
	}

	constructor(domElement) {
		this.controls			= new PointerLockControls( this.camera, domElement );
		this.controlsOBJ		= this.controls.getObject();
		this.color				= new THREE.Color( 0xffffff ).setHex( Math.random() * 0xffffff ).getHex();
		this.geometry			= new THREE.BoxGeometry( 1, 1, 1 );
		this.material			= new THREE.MeshBasicMaterial( { color: new THREE.Color(this.color) } );
		this.model				= new THREE.Mesh( this.geometry, this.material );
		//this.model.position.z	= -0.5;
		this.controlsOBJ.add( this.model );
	}
}