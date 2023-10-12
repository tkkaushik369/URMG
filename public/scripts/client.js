import * as THREE from 'three';
import { DragControls } from 'DragControls';
const socket = io();
var userData = {};
var players = [];

var scene, camera, renderer, controls, model;

function init () {
	// scene
	scene = new THREE.Scene();

	// camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.z = 5;

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// model
	userData.color = new THREE.Color( 0xffffff ).setHex( Math.random() * 0xffffff ).getHex();
	const geometry = new THREE.BoxGeometry( 1, 1, 1 );
	const material = new THREE.MeshBasicMaterial( { color: new THREE.Color(userData.color) } );
	model = new THREE.Mesh( geometry, material );
	scene.add( model );

	userData.model = "cube";
	userData.x = 0;
	userData.y = 0;
	userData.z = 0;

	// controls
	controls = new DragControls([model], camera, renderer.domElement); 
	controls.addEventListener( 'drag', ( event ) => {
		userData.x = model.position.x;
		userData.y = model.position.y;
		userData.z = model.position.z;
		socket.emit("update", userData);
	});

	userData.heading = "data.heading";
	userData.pb = "data.pb";
	userData.action = "Idle";
	players.push(userData);
	players[players.length - 1].id = userData.id;
}

function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}

init();
animate();


socket.on("setId", data => {
	console.log(`setId`);
	userData.id = data.id;
	socket.emit("init", userData);
});

socket.on("deletePlayer", data => {
	for(let i=0; i<players.length; i++) {
		if(userData.id!=players[i].id) {
			scene.remove(players[i].model);
			break;
		}
	}
});

socket.on("chat message", data => {
	console.log("chat message");
	console.log(data);
});

socket.on("remoteData", data => {
	let newPlayer = [];
	for(let i = 0; i<data.length;i++) {
		if(data[i].id != userData.id) {
			let flag = true;
			for(let j = 0; j<players.length;j++) {
				if (data[i].id == players[j].id) {
					players[j].model.position.x = data[i].x;
					players[j].model.position.y = data[i].y;
					players[j].model.position.z = data[i].z;
					flag = false;
					break;
				}
			}
			if(flag)
				newPlayer.push(data[i]);
		}
	}
	
	if(newPlayer.length>0) {
		console.log(newPlayer.length);
		console.log(newPlayer[0].id+" "+userData.id);
		for (let i=0; i<newPlayer.length; i++) {
			console.log(newPlayer[i].color);
			const geometry = new THREE.BoxGeometry( 1, 1, 1 );
			const material = new THREE.MeshBasicMaterial( { color: new THREE.Color(newPlayer[i].color) } );
			newPlayer[i].model = new THREE.Mesh( geometry, material );
			newPlayer[i].model.position.x = newPlayer[i].x;
			newPlayer[i].model.position.y = newPlayer[i].y;
			newPlayer[i].model.position.z = newPlayer[i].z;
			scene.add( newPlayer[i].model );
			players.push(newPlayer[i]);
		}
	}

});