import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

export default class userData {
	id;
	username;
	modelName = "cube";
	camera;
	controls;
	color;
	controlsOBJ;
	nose;
	movements = {
		moveForward: false,
		moveBackward: false,
		moveLeft: false,
		moveRight: false,
		moveJump: false,
		canJump: false
	};
	velocity;
	direction;
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
				this.movements.moveJump  = true;
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

	update(delta, me = false) {
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
		
		if(me) {
			this.model.rotation.x = this.controlsOBJ.rotation.x;
			this.model.rotation.y = this.controlsOBJ.rotation.y;
			this.model.rotation.z = this.controlsOBJ.rotation.z;
		}

		this.model.position.x = this.controlsOBJ.position.x;
		this.model.position.z = this.controlsOBJ.position.z;
		this.model.position.y += this.velocity.y * delta;

		if (this.model.position.y < 10) {
			this.velocity.y = 0;
			this.model.position.y = 10;
			this.movements.canJump = true;
		}
	}

	getUserData() {
		return {
			id:				this.id,
			username:		this.username,
			modelName:		this.modelName,
			color:			this.color,
			mf:				this.movements.moveForward,
			mb:				this.movements.moveBackward,
			ml:				this.movements.moveLeft,
			mr:				this.movements.moveRight,
			mj:				this.movements.moveJump,
			cj:				this.movements.canJump,
			px:				this.model.position.x,
			py:				this.model.position.y,
			pz:				this.model.position.z,
			rx:				this.model.rotation.x,
			ry:				this.model.rotation.y,
			rz:				this.model.rotation.z,
			vx:				this.velocity.x,
			vy:				this.velocity.y,
			vz:				this.velocity.z,
			dx:				this.direction.x,
			dy:				this.direction.y,
			dz:				this.direction.z
		};
	}

	setUserData(data, init = false) {
		this.model.rotation.x		= data.rx;
		this.model.rotation.y		= data.ry;
		this.model.rotation.z		= data.rz;
		this.controlsOBJ.rotation.x	= data.rx;
		this.controlsOBJ.rotation.y	= data.ry;
		this.controlsOBJ.rotation.z	= data.rz;

		this.movements.moveForward	= data.mf;
		this.movements.moveBackward	= data.mb;
		this.movements.moveLeft		= data.ml;
		this.movements.moveRight	= data.mr;
		this.movements.moveJump		= data.mj;
		this.movements.canJump		= data.cj;

		if(this.movements.moveJump && this.movements.canJump === true ) this.velocity.y += 150;
		this.movements.canJump = false;

		this.velocity.x = data.vx;
		this.velocity.y = data.vy;
		this.velocity.z = data.vz;
		this.direction.x = data.dx;
		this.direction.y = data.dy;
		this.direction.z = data.dz;

		this.controlsOBJ.position.x = data.px;
		this.controlsOBJ.position.y = data.py;
		this.controlsOBJ.position.z = data.pz;
		
		if (init) {
			this.id						= data.id;
			this.username				= data.username;
			this.modelName				= data.modelName;
			this.color					= new THREE.Color(data.color);
			this.model.material.color	= this.color;
			this.nose.material.visible 	= true;
		}
	}

	constructor(domElement) {
		this.camera 			= new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.controls			= new PointerLockControls( new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ), domElement );
		this.controlsOBJ		= this.controls.getObject();
		this.color				= new THREE.Color( 0xffffff ).setHex( Math.random() * 0xffffff );
		this.geometry			= new THREE.BoxGeometry( 1, 1, 1 );
		this.material			= new THREE.MeshBasicMaterial( { color: this.color } );
		this.model				= new THREE.Mesh( this.geometry, this.material );
		this.velocity			= new THREE.Vector3();
		this.direction			= new THREE.Vector3();
		this.nose				= new THREE.Mesh( new THREE.BoxGeometry( 0.1, 0.1, 0.4 ), new THREE.MeshBasicMaterial( { color: new THREE.Color(0x000000) } ) );
		
		this.model.add( this.camera );
		this.camera.position.z = 5;
		this.model.add( this.nose );
		this.nose.position.z = -0.7;
		this.nose.material.visible = false;
	}
}