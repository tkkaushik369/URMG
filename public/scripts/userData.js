import * as THREE from 'three';
import { PointerLockControls } from 'three_addons/controls/PointerLockControls.js';
import { clone } from 'three_addons/utils/SkeletonUtils.js';
import { Capsule } from 'three_addons/math/Capsule.js';

export default class userData {
	id;
	scene;
	username;
	modelName;
	camera;
	controlType;
	controls;
	joystick;
	navigation;
	color;
	nose;
	movements = {
		moveShift: false,

		moveForward: false,
		moveBackward: false,
		moveLeft: false,
		moveRight: false,
		moveJump: false,
		
		canJump: false,
		canMove: {
			front: true,
			back: true,
			left: true,
			right: true,
		},
		contMove: false,
		lastKeyDown: null,
		lastKeyUp: null,

		moveDistance: 1,
		weight: 1,
		jumpHeight: 1,
		idleHeight: 1
	};

	animationCommands = {
		noAnim: null,
		idle: "Idle",
		walk: "Walking",
        walkback: null,
        walkleft: null,
        walkright: null,
        run: "Running",
		jump: "Jump"
	}

	velocity;
	direction;
	geometry;
	material;

	mock = new THREE.Object3D();
	cameraDirection = new THREE.Vector3();
	model;
	character;
	animations;
	gui;
	mixer;
	actions;
	activeAction;
	previousAction;
	api = { state: this.animationCommands.idle };
	lastActionName = this.api.state;
	previousTouch = null;
	currentTouchIndex = 0;
	euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
	capsule;
	Collider;
	mouseTime;

	debug = {
		camlock: false
	}

	keydownEvent(event) {
		this.lastKeyDown = event.key;
		if(event.shiftKey) this.movements.moveShift = true;
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
			break;
		}
	}

	keyupEvent(event)  {
		this.lastKeyUp = event.key;
		if(event.shiftKey) this.movements.moveShift = false;
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
			case 'Space':
				this.movements.moveJump = false;
				break;
		}
	}

	joystickEvent(code) {
		this.lastKeyUp = this.lastKeyDown;
		switch (code) {
			case 'up':
				this.movements.moveForward	= true;
				this.movements.moveBackward	= false;
				this.movements.moveLeft		= false;
				this.movements.moveRight	= false;
				this.lastKeyDown			= "w";
			break;
			case 'down':
				this.movements.moveForward	= false;
				this.movements.moveBackward	= true;
				this.movements.moveLeft		= false;
				this.movements.moveRight	= false;
				this.lastKeyDown			= "s";
			break;
			case 'left':
				this.movements.moveForward	= false;
				this.movements.moveBackward	= false;
				this.movements.moveLeft		= true;
				this.movements.moveRight	= false;
				this.lastKeyDown			= "a";
			break;
			case 'right':
				this.movements.moveForward	= false;
				this.movements.moveBackward	= false;
				this.movements.moveLeft		= false;
				this.movements.moveRight	= true;
				this.lastKeyDown			= "d";
			break;
			case 'end':
				this.movements.moveForward	= false;
				this.movements.moveBackward	= false;
				this.movements.moveLeft		= false;
				this.movements.moveRight	= false;
			break;
		}
	}

	onMouseStartEvent(event) {
		this.mouseTime = performance.now();
	}

	onMouseMoveEvent(event) {
		const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		this.euler.setFromQuaternion( this.model.quaternion );
		this.euler.y -= movementX * 0.002;
		this.euler.x -= movementY * 0.002;
		this.euler.x = Math.max( -((Math.PI / 2) - (Math.PI/180)), Math.min( (Math.PI / 2) - (Math.PI/180), this.euler.x ) );
		this.model.quaternion.setFromEuler( this.euler );
	}

	onMouseEndEvent(event) {
		//	this.throwBall(spheres, sphereIdx, mouseTime); // Shoot Bullets
	}
	
	onTouchStartEvent(event) {
		this.currentTouchIndex = event.touches.length - 1;
	}

	onTouchMoveEvent(event) {
		const touch = event.touches[this.currentTouchIndex];
		const camera = this.camera;
		if(this.previousTouch)
		{
			let sensivity = 0.004;
			const movementX = touch.pageX - this.previousTouch.pageX;
			const movementY = touch.pageY - this.previousTouch.pageY;
			this.euler.setFromQuaternion( this.model.quaternion );
			this.euler.y -= movementX * sensivity;
			this.euler.x -= movementY * sensivity;
			this.euler.x = Math.max( -((Math.PI / 2) - (Math.PI/180)), Math.min( (Math.PI / 2) - (Math.PI/180), this.euler.x ) );
			this.model.quaternion.setFromEuler( this.euler );
		}
		this.previousTouch = touch;
	}

	onTouchEndEvent(event) {
		this.previousTouch = null;
	}

	playerCollisions(worldOctree) {
		const result = worldOctree.capsuleIntersect( this.Collider );
		this.movements.canJump = false;
		if ( result ) {
			this.movements.canJump = result.normal.y > 0;
			if ( !this.movements.canJump ) {
				this.velocity.addScaledVector( result.normal, - result.normal.dot( this.velocity ) );
			}
			this.Collider.translate( result.normal.multiplyScalar( result.depth ) );
		}
	}

	getForwardVector() {
		this.model.getWorldDirection( this.direction );
		this.direction.y = 0;
		this.direction.normalize();
		return this.direction;
	}

	getSideVector() {
		this.model.getWorldDirection( this.direction );
		this.direction.y = 0;
		this.direction.normalize();
		this.direction.cross( this.model.up );
		return this.direction;
	}

	teleportPlayerIfOob() {
		if ( this.model.position.y <= - 25 ) {
			this.Collider.start.set( 0, 0, 0 );
			this.Collider.end.set( 0, 1.2, 0 );
			this.Collider.radius = 0.3;
			this.model.position.copy( this.Collider.end );
			this.model.rotation.set( 0, 0, 0 );
			this.character.position.copy( this.Collider.start );
			this.character.position.y -= 0.9;
			this.character.rotation.set( 0, 0, 0 );
		}
	}

	update(worldOctree, delta, GRAVITY, me = false) {
		if ( this.mixer ) this.mixer.update( delta );
		const speedDelta = delta * ( this.movements.canJump ? 25 : 8 );

		// Movement
		{
			if(this.movements.moveForward) {
				this.velocity.add( this.getForwardVector().multiplyScalar( -speedDelta ) );
			}
			if(this.movements.moveBackward) {
				this.velocity.add( this.getForwardVector().multiplyScalar( speedDelta ) );
			}
			if(this.movements.moveLeft) {
				this.velocity.add( this.getSideVector().multiplyScalar( speedDelta ) );
			}
			if(this.movements.moveRight) {
				this.velocity.add( this.getSideVector().multiplyScalar( -speedDelta ) );
			}
			if ( this.movements.canJump ) {
				if ( this.movements.moveJump ) {
					this.velocity.y = 15;
				}
			}
		}

		// Animation
		{
			// Walking/Running Forward
			let onShiftWalk = true;
			if (((this.lastKeyDown == "ArrowUp") || (this.lastKeyDown == "w")|| (this.lastKeyDown == "W")) && ((this.movements.moveShift? this.animationCommands.run :this.animationCommands.walk) != null) && this.movements.moveForward && this.movements.canMove.front) {
				this.movements.canMove.front = false;
				this.fadeToAction( this.movements.moveShift? (onShiftWalk? this.animationCommands.walk: this.animationCommands.run) :(onShiftWalk? this.animationCommands.run :this.animationCommands.walk), 0.5 );
				const Self = this;
				let restoreState = (evt) => {
					if(!Self.movements.moveForward) {
						Self.mixer.removeEventListener( 'finished', restoreState );
						if(Self.movements.contMove)
							Self.fadeToAction( Self.api.state, 0.2 );
						else
							Self.fadeToAction( Self.api.state, 0.06 );
						Self.movements.canMove.front = true;
						Self.movements.contMove = false;
					} else {
						Self.mixer.removeEventListener( 'finished', restoreState );
						Self.fadeToAction( Self.movements.moveShift? (onShiftWalk? Self.animationCommands.walk: Self.animationCommands.run) :(onShiftWalk? Self.animationCommands.run :Self.animationCommands.walk), 0 ); // -0.02
						Self.mixer.addEventListener( 'finished', restoreState );
						Self.movements.contMove = true;
					}
				}
				this.mixer.addEventListener( 'finished', restoreState );
			}

			// Walking Backward
			if (((this.lastKeyDown == "ArrowDown") || (this.lastKeyDown == "s")|| (this.lastKeyDown == "S")) && (this.animationCommands.walkback != null) && this.movements.moveBackward && this.movements.canMove.back) {
				this.movements.canMove.back = false;
				this.fadeToAction( this.animationCommands.walkback, 0.2 );
				const Self = this;
				let restoreState = (evt) => {
					if(!Self.movements.moveBackward) {
						Self.mixer.removeEventListener( 'finished', restoreState );
						if(Self.movements.contMove)
							Self.fadeToAction( Self.api.state, 0.2 );
						else
							Self.fadeToAction( Self.api.state, 0.06 );
						Self.movements.canMove.back = true;
						Self.movements.contMove = false;
					} else {
						Self.mixer.removeEventListener( 'finished', restoreState );
						Self.fadeToAction( Self.animationCommands.walkback, 0 ); // -0.01
						Self.mixer.addEventListener( 'finished', restoreState );
						Self.movements.contMove = true;
					}
				}
				this.mixer.addEventListener( 'finished', restoreState );
			}

			// Walking Left
			if (((this.lastKeyDown == "ArrowLeft") || (this.lastKeyDown == "a") || (this.lastKeyDown == "A")) && (this.animationCommands.walkleft != null) && this.movements.moveLeft && this.movements.canMove.left) {
				this.movements.canMove.left = false;
				this.fadeToAction( this.animationCommands.walkleft, 0.2 );
				const Self = this;
				let restoreState = (evt) => {
					if(!Self.movements.moveLeft) {
						Self.mixer.removeEventListener( 'finished', restoreState );
						if(Self.movements.contMove)
							Self.fadeToAction( Self.api.state, 0.2 );
						else
							Self.fadeToAction( Self.api.state, 0.06 );
						Self.movements.canMove.left = true;
						Self.movements.contMove = false;
					} else {
						Self.mixer.removeEventListener( 'finished', restoreState );
						Self.fadeToAction( Self.animationCommands.walkleft, 0 ); // -0.01
						Self.mixer.addEventListener( 'finished', restoreState );
						Self.movements.contMove = true;
					}
				}
				this.mixer.addEventListener( 'finished', restoreState );
			}

			// Walking Right
			if (((this.lastKeyDown == "ArrowRight") || (this.lastKeyDown == "d") || (this.lastKeyDown == "D")) && (this.animationCommands.walkright != null) && this.movements.moveRight && this.movements.canMove.right) {
				this.movements.canMove.right = false;
				this.fadeToAction( this.animationCommands.walkright, 0.2 );
				const Self = this;
				let restoreState = (evt) => {
					if(!Self.movements.moveRight) {
						Self.mixer.removeEventListener( 'finished', restoreState );
						if(Self.movements.contMove)
							Self.fadeToAction( Self.api.state, 0.2 );
						else
							Self.fadeToAction( Self.api.state, 0.06 );
						Self.movements.canMove.right = true;
						Self.movements.contMove = false;
					} else {
						Self.mixer.removeEventListener( 'finished', restoreState );
						Self.fadeToAction( Self.animationCommands.walkright, 0 ); // -0.01
						Self.mixer.addEventListener( 'finished', restoreState );
						Self.movements.contMove = true;
					}
				}
				this.mixer.addEventListener( 'finished', restoreState );
			}

			// Jumping
			if (((this.lastKeyDown == "Space") || (this.lastKeyDown == " ")) && (this.animationCommands.jump != null) && this.movements.canJump === true && this.movements.moveJump) {
				this.fadeToAction( this.animationCommands.jump, 0.5 );
				const Self = this;
				let restoreState = (evt) => {
					Self.mixer.removeEventListener( 'finished', restoreState );
					Self.fadeToAction( Self.api.state, 0.2 );
				}
				this.mixer.addEventListener( 'finished', restoreState );
			}
		}

		// Gravity
		let damping = Math.exp( - 4 * delta ) - 1;
		if ( !this.movements.canJump ) {
			this.velocity.y -= GRAVITY * delta;
			damping *= 0.1;
		}

		this.velocity.addScaledVector( this.velocity, damping );
		const deltaPosition = this.velocity.clone().multiplyScalar( delta );
		this.Collider.translate( deltaPosition );
		this.playerCollisions(worldOctree);
		this.model.position.copy( this.Collider.end );
		this.character.position.copy( this.Collider.start );
		this.character.position.y -= 0.3;

		if(this.character) {
			this.character.getWorldPosition(this.mock.position);
			this.camera.getWorldDirection(this.cameraDirection);
			this.cameraDirection.y = 0.0;
			this.cameraDirection.add(this.mock.position);
			this.mock.lookAt(this.cameraDirection);
			this.character.quaternion.copy(this.mock.quaternion);
		}
		this.teleportPlayerIfOob();
	}

	getUserData() {
		return {
			id:				this.id,
			username:		this.username,
			modelName:		this.modelName,
			color:			this.color,
			ms:				this.movements.moveShift,
			mf:				this.movements.moveForward,
			mb:				this.movements.moveBackward,
			ml:				this.movements.moveLeft,
			mr:				this.movements.moveRight,
			mj:				this.movements.moveJump,
			cj:				this.movements.canJump,
			cmf:			this.movements.canMove.front,
			cmb:			this.movements.canMove.back,
			cml:			this.movements.canMove.left,
			cmr:			this.movements.canMove.right,
			cm:				this.movements.contMove,
			lkd:			this.lastKeyDown,
			lku:			this.lastKeyUp,
			px:				this.Collider.start.x, //	this.model.position.x,
			py:				this.Collider.start.y, //	this.model.position.y,
			pz:				this.Collider.start.z, //	this.model.position.z,
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

		this.movements.moveShift	= data.ms;
		this.movements.moveForward	= data.mf;
		this.movements.moveBackward	= data.mb;
		this.movements.moveLeft		= data.ml;
		this.movements.moveRight	= data.mr;
		this.movements.moveJump		= data.mj;
		this.movements.canJump		= data.cj;
		this.movements.canMove.front= data.cmf;
		this.movements.canMove.back	= data.cmb;
		this.movements.canMove.left	= data.cml;
		this.movements.canMove.right= data.cmr;

		this.lastKeyDown			= data.lkd;
		this.lastKeyUp				= data.lku;

		this.velocity.x = data.vx;
		this.velocity.y = data.vy;
		this.velocity.z = data.vz;
		this.direction.x = data.dx;
		this.direction.y = data.dy;
		this.direction.z = data.dz;

		if(this.Collider.start.distanceTo(new THREE.Vector3( data.px, data.py, data.pz )) > 1)
			this.Collider.set( new THREE.Vector3( data.px, data.py, data.pz ), new THREE.Vector3( data.px, 1.2 + data.py, data.pz ), 0.3 );


		if (init) {
			this.id						= data.id;
			this.username				= data.username;
			this.modelName				= data.modelName;
			this.model.material.color	= this.color;
			this.model.material.visible = false;
			this.color					= new THREE.Color(data.color);
			this.nose.material.visible 	= false;
			this.Collider.set( new THREE.Vector3( data.px, data.py, data.pz ), new THREE.Vector3( data.px, 1.2 + data.py, data.pz ), 0.3 );
		}
	}

	async createCharacter(modelName, charecterModels, me) {
		this.modelName = modelName;
		if(this.model != undefined) {
			this.model.removeFromParent();
		}
		this.model = new THREE.Mesh( this.geometry, this.material );
		this.nose = new THREE.Mesh( new THREE.BoxGeometry( 0.01, 0.01, 2 ), new THREE.MeshBasicMaterial( { color: new THREE.Color(0x000000) } ) );
		this.capsule = new THREE.Mesh( new THREE.CapsuleGeometry( 0.3, 1.2, 4, 8 ), new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } ) );
		this.Collider = new Capsule( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1.2, 0 ), 0.3 );		
		let charMod = null;
		for(let i = 0; i < charecterModels.length; i++) {
			if(charecterModels[i].name == this.modelName) {
				charMod = charecterModels[i];
				break;
			}
		}
		const modDat = charMod.modDat;
		const gltf = charMod.gltf;
		this.character = clone(gltf.scene);
		this.animations = gltf.animations;

		{	// Scene
			this.scene.add(this.model);
			{ 	// Model
				this.model.add( this.camera );
				{// Camera
					this.camera.position.x = modDat.cameraPos.x;
					this.camera.position.y = modDat.cameraPos.y;
					this.camera.position.z = modDat.cameraPos.z;
				}
				this.model.add( this.nose );
				{	// Nose
					this.nose.position.z = -1;
					this.nose.material.visible = false;
				}
				this.model.material.visible = false;
			}
			this.scene.add(this.character);
			{	// Character
				this.character.add( this.capsule );
				this.capsule.position.y = 0.9;
				this.capsule.visible = false;
			}
		}

		// Setting Model Data
		this.movements.moveDistance			= modDat.movements.moveDistance;
		this.movements.weight				= modDat.movements.weight;
		this.movements.jumpHeight			= modDat.movements.jumpHeight;
		this.movements.idleHeight			= modDat.movements.idleHeight;
		this.animationCommands.noAnim		= modDat.animationCommands.noAnim;
		this.animationCommands.idle			= modDat.animationCommands.idle;
		this.animationCommands.walk			= modDat.animationCommands.walk;
		this.animationCommands.walkback		= modDat.animationCommands.walkback;
		this.animationCommands.walkleft		= modDat.animationCommands.walkleft;
		this.animationCommands.walkright	= modDat.animationCommands.walkright;
		this.animationCommands.run			= modDat.animationCommands.run;
		this.animationCommands.jump			= modDat.animationCommands.jump;
		this.api = { state: this.animationCommands.idle };
		this.lastActionName = this.api.state;

		this.createGUI(modDat.states);
	}

	createGUI(states) {
		if(this.mixer == undefined) this.mixer = new THREE.AnimationMixer( this.character );
		this.actions = {};
		for ( let i = 0; i < this.animations.length; i ++ ) {
			const clip = this.animations[ i ];
			const action = this.mixer.clipAction( clip );
			this.actions[ clip.name ] = action;
			if (clip.name != this.animationCommands.idle) {
				action.clampWhenFinished = true;
				action.loop = THREE.LoopOnce;
			}
		}

		let Self = this;
		function createCallback( name, self ) {
			self.api[ name ] = function (evt, se = self) {
				self.fadeToAction( name, 0.2 );
				self.mixer.addEventListener( 'finished', restoreState );
			};
		}

		function restoreState(evt) {
			Self.mixer.removeEventListener( 'finished', restoreState );
			Self.fadeToAction( Self.api.state, 0.2 );
		}

		for ( let i = 0; i < states.length; i ++ ) {
			createCallback( states[ i ], this );
		}

		this.activeAction = this.actions[ this.api.state ];
		this.activeAction.play();
	}

	fadeToAction( name, duration, rev = false) {
		this.lastActionName = name;
		this.previousAction = this.activeAction;
		this.activeAction = this.actions[ name ];
		if ( this.previousAction !== this.activeAction ) {
			this.previousAction.fadeOut( duration );
		}
		this.activeAction
			.reset()
			.setEffectiveTimeScale( 1 )
			.setEffectiveWeight( 1 )
			.fadeIn( duration )
			.play();
	}

	constructor(domElement, joystickID, scene, me = false) {
		this.scene				= scene;
		this.camera 			= new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.controls			= new PointerLockControls( new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ), domElement );
		this.joystick			= nipplejs.create({ zone: document.getElementById(joystickID), color: "gray", size: 100 });
		this.color				= new THREE.Color( 0xffffff ).setHex( Math.random() * 0xffffff );
		this.geometry			= new THREE.SphereGeometry( 0.1, 8, 4 )
		this.material			= new THREE.MeshBasicMaterial( { color: this.color, wireframe: true } );
		this.velocity			= new THREE.Vector3();
		this.direction			= new THREE.Vector3();
	}
}