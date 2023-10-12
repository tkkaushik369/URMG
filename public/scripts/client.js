import * as THREE from 'three';
import userData from "/scripts/userData.js";
import { CSS2DRenderer, CSS2DObject } from '/three/examples/jsm/renderers/CSS2DRenderer.js';
var socket = io();

let prevTime;
var scene, floorGeometry, renderer, labelRenderer;
var player, players = [];

var $userArea = $('#userArea');
var $userForm = $('#userForm');
var $users = $('#users');
var $username = $('#username');
var $actionArea = $('#actionArea');
var $blocker = $('#blocker');

$users.hide();
$actionArea.hide();
$blocker.hide();

function init() {
	// time
	prevTime = performance.now();

	// scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);
	//scene.fog = new THREE.Fog(0xcccccc, 100, 750);

	// floor
	floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
	floorGeometry.rotateX(-Math.PI / 2);
	let position = floorGeometry.attributes.position;
	let vertex = new THREE.Vector3();
	for (let i = 0, l = position.count; i < l; i++) {
		vertex.fromBufferAttribute(position, i);
		vertex.x += Math.random() * 20 - 10;
		vertex.y += Math.random() * 2;
		vertex.z += Math.random() * 20 - 10;
		position.setXYZ(i, vertex.x, vertex.y, vertex.z);
	}
	floorGeometry = floorGeometry.toNonIndexed();
	position = floorGeometry.attributes.position;
	const colorsFloor = [];
	let color = new THREE.Color();
	for (let i = 0, l = position.count; i < l; i++) {
		color.setHSL(Math.random() * 0.4, 0.2, Math.random() * 0.7);
		colorsFloor.push(color.r, color.g, color.b);
	}
	floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));
	const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	scene.add(floor);
  
	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	$actionArea.append( renderer.domElement );
	
	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	$actionArea.append( labelRenderer.domElement );

	// player
	player = new userData(renderer.domElement);
	scene.add(player.controlsOBJ);
	//addLabel(player.controlsOBJ, player.username);
	
	
	blocker.addEventListener('click', () => { player.controls.lock() });
	player.controls.addEventListener('lock', () => { blocker.style.display = 'none'; });
	player.controls.addEventListener('unlock', () => { blocker.style.display = 'block'; });
	player.controls.addEventListener('change', () => {
		if(player.controls.isLocked)
			socket.emit("update", player.getUserData());
	});
	document.addEventListener('keydown', e => {
		player.keydownEvent(e);
		if(player.controls.isLocked)
			socket.emit("update", player.getUserData());
	});
	document.addEventListener('keyup', e => {
		player.keyupEvent(e);
		if(player.controls.isLocked)
			socket.emit("update", player.getUserData());
	});
	
	
	window.addEventListener('resize', () => {
		player.camera.aspect = window.innerWidth / window.innerHeight;
		player.camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		labelRenderer.setSize( window.innerWidth, window.innerHeight );
	});
	
}

/*function addLabel(object, text) {
	const divText = document.createElement( 'div' );
	divText.className = 'objLabel';
	divText.textContent = text;
	const textObj = new CSS2DObject( divText );
	textObj.position.set( 0, 1.2, 0 );
	object.add( textObj );
}*/

function animate() {
	requestAnimationFrame( animate );
	const time = performance.now()
	const delta = (time - prevTime) / 1000;
	player.update(delta);
	prevTime = time;
	renderer.render(scene, player.camera);
	labelRenderer.render( scene, player.camera );
}

function addNewUser(data) {
	const geometry = new THREE.BoxGeometry( 1, 1, 1 );
	const material = new THREE.MeshBasicMaterial( { color: new THREE.Color(data.color) } );
	data.model = new THREE.Mesh( geometry, material );
	data.model.position.x = data.px;
	data.model.position.y = data.py;
	data.model.position.z = data.pz;
	data.model.rotation.x = data.rx;
	data.model.rotation.y = data.ry;
	data.model.rotation.z = data.rz;
	scene.add( data.model );
	
	const nose = new THREE.Mesh( new THREE.BoxGeometry( 0.1, 0.1, 0.4 ), new THREE.MeshBasicMaterial( { color: new THREE.Color(0x000000) } ) );
	nose.position.z = -0.7;
	data.model.add( nose );


	//addLabel(data.model, data.username);
	let divText = document.createElement( 'div' );
	divText.className = 'objLabel';
	divText.id = "player-"+data.id;
	divText.textContent = data.username;
	let textObj = new CSS2DObject( divText );
	textObj.position.set( 0, 1.2, 0 );
	data.model.add( textObj );
	players.push(data);
	//console.log("add");
}

function updatePlayers(newData) {
	if(player.id != newData.id) {
		for(let i = 0; i < players.length; i++) {
			if (players[i].id == newData.id) {
				players[i].model.position.x = newData.px;
				players[i].model.position.y = newData.py;
				players[i].model.position.z = newData.pz;
				players[i].model.rotation.x = newData.rx;
				players[i].model.rotation.y = newData.ry;
				players[i].model.rotation.z = newData.rz;
				break;
			}
		}
	}
}

// Connect
socket.on("setId", data => {
	//console.log(`setId ${data.id}`);
	init();
	animate();
	player.id = data.id;

	$userForm.submit(e => {
		e.preventDefault();
		player.username = $username.val();
		socket.emit('init',	player.getUserData(), data => {
			if(data.value) {
				$userArea.hide();
				$users.show();
				$actionArea.show();
				$blocker.show();

				//console.log(`Players Online: ${data.players.length - 1}`);
				for (let i = 0; i < data.players.length; i++) {
					if(data.players[i].id != player.id) {
						addNewUser(data.players[i]);
					}
				}
			}
		});
	});
});


// New Player
socket.on("newPlayer", data => {
	//console.log(data);
	if( (player.id != data.id) ) {
		addNewUser(data);
	}
});

// Delete Player
socket.on("deletePlayer", data => {
	for(let i=0; i<players.length; i++) {
		if(data.id==players[i].id) {
			for( let j = players[i].model.children.length - 1; j >= 0; j--) { 
				scene.remove(players[i].model.children[j]); 
		   	}
			document.getElementById("player-"+data.id).remove();
			scene.remove(players[i].model);
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
	//console.log(data.type);
	let newData = data.data;
	if(data.type == "list") {
		for(let i = 0; i<newData.length;i++) {
			updatePlayers(newData[i]);
		}
	} else if(data.type == "obj") {
		updatePlayers(newData);
	}
});