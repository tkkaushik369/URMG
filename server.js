const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

const data_fix_buffer = {
	isFix: true,
	delay: 40
}


app.use(express.static(__dirname + "/public"));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/three', express.static(__dirname + '/node_modules/three/'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

io.on('connection', socket => {
	socket.userData = { x:0, y:0, z:0, heading: 0};
	console.log(`${socket.id} Connected`);
	socket.emit('setId', { id:socket.id});

	socket.on('disconnect', () => {
		console.log(`Player ${socket.id} Disonnected`);
		io.emit('deletePlayer', { id:socket.id });
	});

	socket.on('init', data => {
		console.log(`socket.init ${data.model}`);
		socket.userData.model = data.model;
		socket.userData.color = data.color;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb;
		socket.userData.action = "Idle";
	});
    
	socket.on('update', data => {
		socket.userData.color = data.color;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb;
		socket.userData.action = data.action;
		if(!data_fix_buffer.isFix) {
			let pack = getSocketUsers();
			if (pack.length>0)
				io.emit('remoteData', pack);
		}
	});

	socket.on('chat message', data => {
		console.log(`chat message:${data.id} ${data.message}`);
		io.to(data.io).emit("chat message", { id:socket.id, message:data.message });
	});
});

function getSocketUsers() {
	const nsp = io.of('/');
	let pack = [];
	for (let [id, socket] of io.sockets.sockets) {
		if (socket.userData.model != undefined){
			pack.push({
				id: socket.id,
				model: socket.userData.model,
				color: socket.userData.color,
				x: socket.userData.x,
				y: socket.userData.y,
				z: socket.userData.z,
				heading: socket.userData.heading,
				pb: socket.userData.pb,
				action: socket.userData.action
			});
		}
	}
	return pack;
}

if(data_fix_buffer.isFix) {
	setInterval(function(){
		let pack = getSocketUsers();
		if (pack.length>0) io.emit('remoteData', pack);
	}, data_fix_buffer.delay);
}

http.listen(port, () => {
	//console.log(`Server Running at http://localhost:${port}`);
	console.log(`Listening on *:${port} - origin set`);
});