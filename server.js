const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

const data_fix_buffer = {
	isFix: false,
	delay: 40
}

var totalPlayers = 0;

app.use(express.static(__dirname + "/public"));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/three', express.static(__dirname + '/node_modules/three/'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

io.sockets.on("connection", socket => {
    socket.userData = { x:0, y:0, z:0, heading: 0};
    console.log(`${socket.id} Connected`);
    console.log("Connections: %s socket connected", totalPlayers);
    socket.emit('setId', { id:socket.id});
    
    // Disconnect
    socket.on("disconnect", data => {
        console.log(`Player ${socket.id} Disonnected`);
        console.log("Connections: %s socket connected", totalPlayers);
		io.emit('deletePlayer', { id: socket.id });
    });

    // init User Data
    socket.on('init', (data, callback) => {
		console.log(`socket.init ${data.username} -> ${data.modelName}`);
		socket.userData.id			= data.id,
		socket.userData.username	= data.username;
		socket.userData.modelName	= data.modelName;
		socket.userData.color		= data.color;
		socket.userData.px			= data.px;
		socket.userData.py			= data.py;
		socket.userData.pz			= data.pz;
		socket.userData.rx			= data.rx;
		socket.userData.ry			= data.ry;
		socket.userData.rz			= data.rz;
		/*socket.userData.heading		= data.h;
		socket.userData.pb			= data.pb;
		socket.userData.action		= "Idle";*/
		callback({
			value		: true,
			players		: getSocketUsers()
		});
		io.emit('newPlayer', socket.userData);
	});

    // Update User Data
    socket.on('update', data => {
		/*socket.userData.id			= data.id,
		socket.userData.username	= data.username,
		socket.userData.modelName	= data.modelName,*/
		socket.userData.color		= data.color;
		socket.userData.px			= data.px;
		socket.userData.py			= data.py;
		socket.userData.pz			= data.pz;
		socket.userData.rx			= data.rx;
		socket.userData.ry			= data.ry;
		socket.userData.rz			= data.rz;
		/*socket.userData.heading		= data.h;
		socket.userData.pb			= data.pb;
		socket.userData.action		= data.action;*/
		if(!data_fix_buffer.isFix) {
			io.emit('remoteData', { type: "obj", data: socket.userData });
		}
	});

    // Send Message Group
    socket.on("send_message", data => {
        io.sockets.emit("new_message", {id: socket.id, msg: data});
    });

    // Send Message ONO
    socket.on('chat_message', data => {
		console.log(`chat_message:${socket.id} -> ${data.id}: ${data.message}`);
		io.to(data.io).emit("chat message", { from: socket.id, to: data.id, message: data.message });
	});

});

function getSocketUsers() {
	const nsp = io.of('/');
	let pack = [];
	for (let [id, socket] of io.sockets.sockets) {
		if (socket.userData.username != undefined){
			pack.push(socket.userData);
		}
	}
	totalPlayers = pack.length;
	return pack;
}

if(data_fix_buffer.isFix) {
	setInterval(function(){
		let pack = getSocketUsers();
		if (pack.length>0) io.emit('remoteData', {type: "list", data: pack});
	}, data_fix_buffer.delay);
}

http.listen(port, () => {
	console.log(`Listening on *:${port} - origin set`);
});