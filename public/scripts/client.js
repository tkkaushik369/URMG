import * as THREE from 'three';
import userData from "/scripts/userData.js";
import { CSS2DRenderer, CSS2DObject } from '/three/examples/jsm/renderers/CSS2DRenderer.js';
var socket = io();

var clock;
var scene, floor, renderer, labelRenderer;
var player, players = [];

var $userArea = $('#userArea');
var $userForm = $('#userForm');
var $username = $('#username');
var $actionArea = $('#actionArea');
var $blocker = $('#blocker');

$actionArea.hide();
$blocker.hide();

function init() {
	//	Clock
	clock = new THREE.Clock()

	// scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	floor = new THREE.GridHelper( 100, 10 );
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

	// Events
	$blocker.on('click', () => { player.controls.lock() });
	player.controls.addEventListener('lock', () => { $blocker.hide(); });
	player.controls.addEventListener('unlock', () => { $blocker.show(); });
	player.controls.addEventListener('change', () => {
		//if(player.controls.isLocked) socket.emit("update", player.getUserData());
	});
	document.addEventListener('keydown', e => {
		player.keydownEvent(e);
		//if(player.controls.isLocked)	socket.emit("update", player.getUserData());
	});
	document.addEventListener('keyup', e => {
		player.keyupEvent(e);
		//if(player.controls.isLocked) socket.emit("update", player.getUserData());
	});
	
	
	window.addEventListener('resize', () => {
		player.camera.aspect = window.innerWidth / window.innerHeight;
		player.camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		labelRenderer.setSize( window.innerWidth, window.innerHeight );
	});
	
}

function addLabel(object, id, text) {
	const divText = document.createElement( 'div' );
	divText.className = 'objLabel';
	divText.id = 'player-'+id;
	divText.textContent = text;
	const textObj = new CSS2DObject( divText );
	textObj.position.set( 0, 1.2, 0 );
	object.add( textObj );
}

function animate() {
	socket.emit("update", player.getUserData());
	const delta = clock.getDelta();
	/*for(let i = 0; i < players.length; i++) {
		players[i].update(delta, (players[i].id == player.id));
	}*/
	player.update(delta, true);
	renderer.render(scene, player.camera);
	labelRenderer.render( scene, player.camera );
	requestAnimationFrame( animate );
}

function addNewUser(data) {
	if(data.username == undefined) return;

	let newPlayer = new userData(renderer.domElement);
	newPlayer.setUserData(data, true);
	scene.add(newPlayer.controlsOBJ);
	addLabel(newPlayer.model, newPlayer.id, newPlayer.username);
	players.push(newPlayer);
}

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
	animate();
	player.id = data.id;

	$userForm.submit(e => {
		e.preventDefault();
		player.username = $username.val();
		players.push(player);
		//	addLabel(player.model, player.id, player.username + " (Me)");
		socket.emit('init',	player.getUserData(), data => {
			if(data.value) {
				$userArea.hide();
				$actionArea.show();
				$blocker.show();

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
			scene.remove(players[i].controlsOBJ);
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