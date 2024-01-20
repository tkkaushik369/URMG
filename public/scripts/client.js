import * as THREE from 'three';
import userData from "/scripts/userData.js";
import { CSS2DRenderer, CSS2DObject } from 'three_addons/renderers/CSS2DRenderer.js';
import Stats from 'three_addons/libs/stats.module.js';
import { GLTFLoader } from 'three_addons/loaders/GLTFLoader.js';
import { clone } from 'three_addons/utils/SkeletonUtils.js';
import { Octree } from 'three_addons/math/Octree.js';
import { OctreeHelper } from 'three_addons/helpers/OctreeHelper.js';
import { PositionalAudioHelper } from 'three_addons/helpers/PositionalAudioHelper.js';
import { GUI } from 'three_addons/libs/lil-gui.module.min.js';

var allModels = [
	// Male
	{
		name: "Astronaut",
		path: "/Male/Astronaut",
		type: "Character"
	},
	{
		name: "Business Man",
		path: "/Male/Business Man",
		type: "Character"
	},
	{
		name: "Hoodie Character",
		path: "/Male/Hoodie Character",
		type: "Character"
	},
	{
		name: "Swat",
		path: "/Male/Swat",
		type: "Character"
	},
	// Female
	{
		name: "Punk",
		path: "/Female/Punk",
		type: "Character"
	},
	{
		name: "Sci Fi Character",
		path: "/Female/Sci Fi Character",
		type: "Character"
	},
	{
		name: "Soldier",
		path: "/Female/Soldier",
		type: "Character"
	},
	{
		name: "Suit",
		path: "/Female/Suit",
		type: "Character"
	},
	// Wepons
	{
		name: "Scifi Grenade",
		path: "/Weapon/Scifi Grenade",
		type: "Weapon:Grenade"
	},
	{
		name: "Scifi Pistol",
		path: "/Weapon/Scifi Pistol",
		type: "Weapon:Pistol"
	},
	{
		name: "Scifi Smg",
		path: "/Weapon/Scifi Smg",
		type: "Weapon:Smg"
	},
	{
		name: "Scifi Assault Rifle",
		path: "/Weapon/Scifi Assault Rifle-j40c8VDdAQ",
		type: "Weapon:Assault Rifle"
	},
	{
		name: "Scifi Sniper",
		path: "/Weapon/Scifi Sniper-46615JyFm7",
		type: "Weapon:Sniper"
	},
	{
		name: "Collision World",
		path: "/Map/collision-world",
		type: "Map"
	},
	{
		name: "Scene",
		path: "/Map/scene",
		type: "Map"
	},
	{
		name: "Scene Test",
		path: "/Map/scene_test",
		type: "Map"
	}
];
const socket = io();

var clock, stats;
var hemiLight, dirLight;
var scene, floor, floorObject_1, renderer, labelRenderer;
var player, players = [];
const GRAVITY = 30;

var sphereGeometry, sphereMaterial;
const NUM_SPHERES = 20;
const spheres = [];
let sphereIdx = 0;

const gui = new GUI( { width: 200 } );
gui.close();
const settingsGui = {
	"Floor Helper": false,
	"Map Helper": false,
	"Audio Helper": false,
	"Show Capsules": false,
	"Brightness": 1
}

/*const audioElement = document.getElementById( 'music' );
const songElement = document.getElementById( 'song' );
const skullbeatzElement = document.getElementById( 'skullbeatz' );*/

const worldOctree = new Octree();
const audioListener = new THREE.AudioListener();
var worldOctreeHelper, audioHelper;
var vector1 = new THREE.Vector3();
var vector2 = new THREE.Vector3();
var vector3 = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2( 0, 0 );
const mesh = new THREE.InstancedMesh( new THREE.IcosahedronGeometry( 0.04, 3 ),  new THREE.MeshPhongMaterial( { color: 0xffffff } ), 25 );

var $userArea = $('#userArea');
var $userForm = $('#userForm');
var $charModel = $('#character-models');
var $actionArea = $('#actionArea');
var $blocker = $('#blocker');
var $usersOnline = $('#users');

$actionArea.hide();
$blocker.hide();

for(let i = 0; i < allModels.length; i++) {
	if(allModels[i].type == "Character")
		//$charModel.append("<option value='"+allModels[i].name+"'>"+allModels[i].name+"</option>");
		$charModel.append("<div style='background-image: url(\"models"+allModels[i].path+".webp\");' class='character-models-item'><input type='radio' name='character' id='character-"+(allModels[i].name.split(' ').join('_'))+"' value='"+allModels[i].name+"'><label for='character-"+(allModels[i].name.split(' ').join('_'))+"'>"+allModels[i].name+"</label></div>");
}

async function init() {
	//	Clock
	clock = new THREE.Clock()

	// Stats
	stats = new Stats();
	$actionArea.append( stats.domElement );

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);
	scene.fog = new THREE.Fog( 0x222222, 20, 100 );

	// lights
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0x222222, 2 );
	hemiLight.position.set( 0, 20, 0 );
	scene.add( hemiLight );

	dirLight = new THREE.DirectionalLight( 0xffffff, 2 );
	dirLight.position.set( 0, 20, 10 );
	scene.add( dirLight );

	// Ground Helper
	floor = new THREE.GridHelper( 60, 100 );
	floor.visible = false;
	scene.add(floor);

	// Ground Objects
	floorObject_1 = new THREE.Mesh( new THREE.BoxGeometry( 0.1, 0.1, 0.2 ), new THREE.MeshBasicMaterial( { color: new THREE.Color(0xFF0000) } ) );
	floorObject_1.visible = false;
	floor.add(floorObject_1);

	/*const matrix = new THREE.Matrix4();
	for(let i = 0, c = 0; i < 5; i++) {
		for(let j = 0; j < 5; j++) {
			matrix.setPosition( i*0.1, 0.2, j*0.1 );
			mesh.setMatrixAt( c, matrix );
			mesh.setColorAt( c, new THREE.Color().setHex( 0x0000ff ) );
			c++;
		}			
	}
	scene.add( mesh );*/
	
	// Renderer 3D
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	$actionArea.append( renderer.domElement );
	
	// Renderer 2D
	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	$actionArea.append( labelRenderer.domElement );

	// Player
	player = new userData(renderer.domElement, 'joystick-zone', scene, true);
	player.navigation = document.getElementById("navigation-zone");

	// Sphere
	for ( let i = 0; i < NUM_SPHERES; i ++ ) {
		const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
		sphere.castShadow = true;
		sphere.receiveShadow = true;
		scene.add( sphere );
	
		spheres.push( {
			mesh: sphere,
			collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), 0.2 ),
			velocity: new THREE.Vector3()
		} );
	
	}

	// Events
	$('#instructions').on('click', () => {
		if(player.controlsType == "Touch")
			$blocker.hide();
		else
			player.controls.lock()
	});

	player.joystick.on('start move end dir plain', (event, data) => {
		if(player.controlsType == "Touch") {
			let change = false;
			if (event.type == "end") {
				player.joystickEvent(event.type);
				change = true;
			} else if((data != undefined) && (data.direction != undefined)) {
				player.joystickEvent(data.direction.angle);
				change = true;
			}
			if(change)
				socket.emit("update", player.getUserData());
		}
	});
	player.controls.addEventListener('lock', () => { $blocker.hide(); });
	player.controls.addEventListener('unlock', () => { $blocker.show(); });
	player.controls.addEventListener('change', () => { socket.emit("update", player.getUserData()); });
	document.addEventListener('keydown', e => {
		if(e.key == '`') {
			if(player.controls.isLocked)
				player.controls.unlock();
			else 
				player.controls.lock();
		}
		if(player.controls.isLocked) {
			if(player.controlsType == "Keyboard") {
				player.keydownEvent(e);
				socket.emit("update", player.getUserData());
			}
		}
	});
	document.addEventListener('keyup', e => {
		if((player.controls.isLocked) && (player.controlsType == "Keyboard")) {
			player.keyupEvent(e);
			socket.emit("update", player.getUserData());
		}
	});
	document.addEventListener( 'mousedown', (e) => {
		if(player.controls.isLocked)
			player.onMouseStartEvent(e);
	});
	document.addEventListener( 'mousemove', (e) => {
		if(player.controls.isLocked)
			player.onMouseMoveEvent(e);
	});
	document.addEventListener( 'mouseup', (e) => {
		if(player.controls.isLocked) {
			player.onMouseEndEvent(e);
			player.throwBall(spheres, sphereIdx);
		}
	});
	player.navigation.addEventListener('touchstart', e => {
		if(player.controlsType == "Touch") {
			player.onTouchStartEvent(e);
			socket.emit("update", player.getUserData());
		}
	});
	player.navigation.addEventListener('touchmove', e => {
		if(player.controlsType == "Touch") {
			player.onTouchMoveEvent(e);
			socket.emit("update", player.getUserData());
		}
	});
	player.navigation.addEventListener('touchend', e => {
		if(player.controlsType == "Touch") {
			player.onTouchEndEvent(e);
			socket.emit("update", player.getUserData());
		}
	});
	window.addEventListener('resize', () => {
		player.camera.aspect = window.innerWidth / window.innerHeight;
		player.camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		labelRenderer.setSize( window.innerWidth, window.innerHeight );
	});
	
	allModels = await load_models(allModels);

	// Map
	const mapName = "Collision World";
	var Map = null;
	for(let i = 0, mi = 0; i < allModels.length; i++) {
		if(allModels[i].type == "Map") {
			if(mapName == allModels[i].name) {
				const gltf = allModels[i].gltf;
				Map = clone(gltf.scene);
				Map.traverse( child => {
					if ( child.isMesh ) {
						child.castShadow = true;
						child.receiveShadow = true;
						if ( child.material.map ) {
							child.material.map.anisotropy = 4;
						}
					}
				} );
				break;
			}
			mi++;
		}
	}

	if(Map != null)
	{
		scene.add( Map );
		worldOctree.fromGraphNode( Map );
	} else {
		console.log("No Map")
	}
	
	worldOctreeHelper = new OctreeHelper( worldOctree );
	worldOctreeHelper.visible = false;
	scene.add( worldOctreeHelper );

	// Audio
	/*const positionalAudio = new THREE.PositionalAudio( audioListener );
	positionalAudio.setMediaElementSource( audioElement );
	positionalAudio.setRefDistance( 1 );
	positionalAudio.setDirectionalCone( 180, 230, 0.1 );

	audioHelper = new PositionalAudioHelper( positionalAudio, 0.1 );
	audioHelper.visible = false;
	positionalAudio.add( audioHelper );

	const gltfLoader = new GLTFLoader();
	gltfLoader.load( 'models/BoomBox.glb', function ( gltf ) {
		const boomBox = gltf.scene;
		boomBox.position.set( -2, 0.2 + 0.8, 0 );
		boomBox.scale.set( 20, 20, 20 );
		boomBox.traverse( function ( object ) {
			if ( object.isMesh ) {
				object.geometry.rotateY( - Math.PI );
				object.castShadow = true;
				object.receiveShadow = true;
			}
		} );
		boomBox.add( positionalAudio );
		scene.add( boomBox );
		worldOctree.fromGraphNode( boomBox );
	} );

	gltfLoader.load( 'models/cube.glb', function ( gltf ) {
		const cube = gltf.scene;
		cube.position.set( 0, 0.2 + 0.8, 5 );
		cube.traverse( function ( object ) {
			if ( object.isMesh ) {
				object.castShadow = true;
				object.receiveShadow = true;
			}
		} );
		scene.add( cube );
		worldOctree.fromGraphNode( cube );
	} );

	const wallGeometry = new THREE.BoxGeometry( 2, 1, 0.1 );
	const wallMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
	const wall = new THREE.Mesh( wallGeometry, wallMaterial );
	wall.position.set( -2, 0.5 + 0.8, - 0.5 );
	scene.add( wall );
	worldOctree.fromGraphNode( wall );

	// Sound Spheres
	const sphere = new THREE.SphereGeometry( 1, 32, 16 );
	const material1 = new THREE.MeshPhongMaterial( { color: 0xffaa00, flatShading: true, shininess: 0 } );
	const material2 = new THREE.MeshPhongMaterial( { color: 0xff2200, flatShading: true, shininess: 0 } );

	const mesh1 = new THREE.Mesh( sphere, material1 );
	mesh1.position.set( -12, 3, 0 );
	scene.add( mesh1 );
	worldOctree.fromGraphNode( mesh1 );
	
	const sound1 = new THREE.PositionalAudio( audioListener );
	sound1.setMediaElementSource( songElement );
	sound1.setRefDistance( 5 );
	mesh1.add( sound1 );

	const mesh2 = new THREE.Mesh( sphere, material2 );
	mesh2.position.set( 14, 3, 0 );
	scene.add( mesh2 );
	worldOctree.fromGraphNode( mesh2 );
	
	const sound2 = new THREE.PositionalAudio( audioListener );
	sound2.setMediaElementSource( skullbeatzElement );
	sound2.setRefDistance( 5 );
	mesh2.add( sound2 );*/

	// Game Controls
	{
		const aA = document.getElementById("actionArea");
		{	// Menu Button
			const menuBtn = document.createElement("div");
			menuBtn.setAttribute("class", "gc-btn");
			menuBtn.innerHTML = "❖ Menu";
			menuBtn.style.position = "absolute";
			menuBtn.style.left = "10px";
			menuBtn.style.bottom = "10px";
			menuBtn.onclick = (e) => {
				if(player.controls.isLocked)
					player.controls.unlock();
				else 
					player.controls.lock();
			}
			menuBtn.ontouchstart = (e) => {
				if(player.controls.isLocked)
					player.controls.unlock();
				else 
					player.controls.lock();
			}
			aA.appendChild(menuBtn);
		}
		{	// Jump Button
			const jumpBtn = document.createElement("div");
			jumpBtn.setAttribute("class", "gc-btn");
			jumpBtn.innerHTML = "⇬ Jump";
			jumpBtn.style.position = "absolute";
			jumpBtn.style.right = "120px";
			jumpBtn.style.bottom = "60px";
			jumpBtn.onmousedown = (e) => {
				player.movements.moveJump = true;
				socket.emit("update", player.getUserData());
			}
			jumpBtn.onmouseup = (e) => {
				player.movements.moveJump = false;
				socket.emit("update", player.getUserData());
			}
			jumpBtn.ontouchstart = (e) => {
				player.movements.moveJump = true;
				socket.emit("update", player.getUserData());
			}
			jumpBtn.ontouchend = (e) => {
				player.movements.moveJump = false;
				socket.emit("update", player.getUserData());
			}
			aA.appendChild(jumpBtn);
		}
	}
}

// Load Models
async function load_models(models) {
	let loadModel = async (url) => {
		const loader = new GLTFLoader();
		let model = new Promise((res, rej) => loader.load(url, res, ( xhr ) => {
			document.getElementById("progress-model-load-sub").querySelector(".text").innerText =  ( xhr.loaded / xhr.total * 100 ).toFixed(2) + "% loaded";
			document.getElementById("progress-model-load-sub").querySelector(".juice").style.width =  "calc(" + ( xhr.loaded / xhr.total * 100 )+ "% - 4px)";
		}, rej));
		return model;
	}
	let modelData = async (url) => {
		const res = await fetch(url);
		let data = res.json();
		return data;
	}

	for (let i = 0; i < models.length; i++) {
		models[i].modDat = await modelData("/models"+models[i].path+".json");
		models[i].gltf = await loadModel("/models"+models[i].modDat.filename);
		//console.table(models[i].gltf.animations);
		document.getElementById("progress-model-load-total").querySelector(".text").innerText = models[i].type+" "+( (i+1) / models.length * 100).toFixed(2) + "% loaded";
		document.getElementById("progress-model-load-total").querySelector(".juice").style.width = "calc(" + ( (i+1) / models.length * 100) + "% - 4px)";
	}
	document.getElementById("progress-model-load").style.display = "none";
	document.getElementById("userArea").classList.remove("loading");
	return models;
}

// Add Label
function addLabel(object, id, text) {
	const divText = document.createElement( 'div' );
	divText.className = 'objLabel';
	divText.id = 'player-'+id;
	divText.textContent = text;
	const textObj = new CSS2DObject( divText );
	textObj.position.set( 0, 0.4, 0 );
	object.add( textObj );
	
	const divTextUser = document.createElement( 'div' );
	divTextUser.id = 'player-user-'+id;
	divTextUser.className = 'player-user';
	divTextUser.textContent = text;
	$usersOnline.append( divTextUser );
}

// Update Spheres
function updateSpheres( delta ) {
	spheres.forEach( sphere => {
		sphere.collider.center.addScaledVector( sphere.velocity, delta );
		const result = worldOctree.sphereIntersect( sphere.collider );
		if ( result ) {
			sphere.velocity.addScaledVector( result.normal, - result.normal.dot( sphere.velocity ) * 1.5 );
			sphere.collider.center.add( result.normal.multiplyScalar( result.depth ) );
		} else {
			sphere.velocity.y -= GRAVITY * delta;
		}

		const damping = Math.exp( - 1.5 * delta ) - 1;
		sphere.velocity.addScaledVector( sphere.velocity, damping );

		// player.playerSphereCollision( sphere );
	} );

	spheresCollisions();

	for ( const sphere of spheres ) {
		sphere.mesh.position.copy( sphere.collider.center );
	}
}

function spheresCollisions() {
	for ( let i = 0, length = spheres.length; i < length; i ++ ) {
		const s1 = spheres[ i ];
		for ( let j = i + 1; j < length; j ++ ) {
			const s2 = spheres[ j ];
			const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if ( d2 < r2 ) {
				const normal = vector1.subVectors( s1.collider.center, s2.collider.center ).normalize();
				const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( s1.velocity ) );
				const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( s2.velocity ) );

				s1.velocity.add( v2 ).sub( v1 );
				s2.velocity.add( v1 ).sub( v2 );

				const d = ( r - Math.sqrt( d2 ) ) / 2;

				s1.collider.center.addScaledVector( normal, d );
				s2.collider.center.addScaledVector( normal, - d );

			}
		}
	}
}

// Animation Loop Delta
function animate() {
	const STEPS_PER_FRAME = 5;
	const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;
	const delta = clock.getDelta();
	
	raycaster.setFromCamera( mouse, player.camera );
	const intersection = raycaster.intersectObject( mesh );
	for(let i = 0; i < mesh.count; i++) {
		mesh.setColorAt( i, new THREE.Color().setHex( 0x0000ff ) );
	}
	if ( intersection.length > 0 ) {
		mesh.setColorAt( intersection[ 0 ].instanceId, new THREE.Color().setHex( 0xff0000 ) );
	}
	mesh.instanceColor.needsUpdate = true;

	for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
		for(let i = 0; i < players.length; i++) {
			players[i].update(worldOctree, deltaTime, GRAVITY, (players[i].id == player.id));
		}
		updateSpheres( deltaTime ); // Bullets
	}


	renderer.render(scene, player.camera);
	labelRenderer.render( scene, player.camera );
	stats.update();
	requestAnimationFrame( animate );
}

// Add New User
function addNewUser(data) {
	if(data.username == undefined) return;
	// console.log(data);
	let newPlayer = new userData(renderer.domElement, 'joystick-zone', scene);
	newPlayer.createCharacter(data.modelName, allModels, false);
	newPlayer.setUserData(data, true);
	players.push(newPlayer);
	addLabel(newPlayer.model, newPlayer.id, newPlayer.username);
}


// Update Player
function updatePlayer(newData) {
	if(player.id != newData.id) {
		for(let i = 0; i < players.length; i++) {
			if (players[i].id == newData.id) {
				players[i].setUserData(newData);
				break;
			}
		}
	}
}

// Connect
socket.on("setId", data => {
	init();
	player.id = data.id;

	$userForm.submit(e => {
		e.preventDefault();
		player.username = $("input[name='username']").val();
		player.modelName = $("input[name='character']:checked").val();
		player.createCharacter(player.modelName, allModels, true);
		/*audioElement.play();
		songElement.play();
		skullbeatzElement.play();*/
		player.model.add( audioListener );
		players.push(player);
		addLabel(player.model, player.id, player.username + " (Me)");

		socket.emit('init',	player.getUserData(), data => {
			if(data.value) {
				$userArea.hide();
				$actionArea.show();
				$blocker.show();
				//openFullscreen();

				let device = deviceState()? "Touch": "Keyboard";
				if (confirm("Use "+device) == true)
					player.controlsType = device;
				else
					player.controlsType = device? "Touch": "Keyboard";	
				
				if(player.controlsType == "Touch")
					openFullscreen()

				for (let i = 0; i < data.players.length; i++) {
					if(data.players[i].id != player.id) {
						addNewUser(data.players[i]);
					}
				}
				animate();

				//var folderDebug  = gui.addFolder( 'Visibility' );
				gui.add( settingsGui, 'Floor Helper' ).onChange( ( value ) => {
					floor.visible = value;
					floorObject_1.visible = value;
				} );
				gui.add( settingsGui, 'Audio Helper' ).onChange( ( value ) => {
					audioHelper.visible = value;
				} );
				gui.add( settingsGui, 'Map Helper' ).onChange( ( value ) => {
					worldOctreeHelper.visible = value;
				} );
				gui.add( settingsGui, 'Show Capsules' ).onChange( ( value ) => {
					for(let i = 0; i < players.length; i++) {
						players[i].capsule.visible = value;
						players[i].nose.visible = value;
						players[i].model.visible = value;
					}
				} );
				gui.add( settingsGui, 'Brightness', 0, 1, 0.01 ).onChange ( ( value ) => {
					dirLight.intensity = value;
					hemiLight.intensity = value;
				} );
			}
		});
	});
});


// New Player
socket.on("newPlayer", data => {
	if( (player.id != data.id) ) { addNewUser(data); }
});

// Delete Player
socket.on("deletePlayer", data => {
	for(let i=0; i<players.length; i++) {
		if(data.id==players[i].id) {
			for( let j = players[i].model.children.length - 1; j >= 0; j--) { 
				scene.remove(players[i].model.children[j]); 
		   	}
			document.getElementById("player-"+data.id).remove();
			document.getElementById("player-user-"+data.id).remove();
			scene.remove(players[i].model);
			scene.remove(players[i].character);
			players.splice(i, 1);
			break;
		}
	}
});

// Send Message Group
socket.on("send_message", data => {
	console.log("send_message");
	console.log(data);
});
// Send Message ONO
socket.on("chat_message", data => {
	console.log("chat_message");
	console.log(data);
});

// Get Player Updates
socket.on("remoteData", data => {
	let newData = data.data;
	if(data.type == "list") {
		for(let i = 0; i<newData.length;i++) {
			updatePlayer(newData[i]);
		}
	} else if(data.type == "obj") {
		updatePlayer(newData);
	}
});



// static functions

/* View in fullscreen */
function openFullscreen(elem = document.documentElement) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

function deviceState() {
	//let check = false;
	//(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}