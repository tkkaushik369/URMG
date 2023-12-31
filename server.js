const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

const consoleMode = {
	table: false
}

const data_fix_buffer = {
	isFix: false,
	delay: 40
}

app.use(express.static(__dirname + "/public"));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/nipplejs', express.static(__dirname + '/node_modules/nipplejs/dist/'));
app.use('/three', express.static(__dirname + '/node_modules/three/'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

io.sockets.on("connection", socket => {
    socket.userData = { x:0, y:0, z:0, heading: 0};
	if(consoleMode.table) consoleTable();
	else console.log(`${socket.id} Connected`);
    socket.emit('setId', { id:socket.id});
    
    // Disconnect
    socket.on("disconnect", data => {
		if(consoleMode.table) consoleTable();
		else console.log(`Player ${socket.id} Disonnected`);
		io.emit('deletePlayer', { id: socket.id });
    });

    // Init User Data
    socket.on('init', (data, callback) => {
		if(consoleMode.table) consoleTable();
		else console.log(`socket.init ${data.username} -> ${data.modelName}`);
		socket.userData = data;
		callback({
			value		: true,
			players		: getSocketUsers()
		});
		io.emit('newPlayer', socket.userData);
	});

    // Update User Data
    socket.on('update', data => {
		socket.userData = data;
		if(!data_fix_buffer.isFix) {
			io.emit('remoteData', { type: "obj", data: socket.userData });
		}
	});

    // Send Message Group
    socket.on("send_message", data => {
		if(consoleMode.table) consoleTable();
		else console.log(`new_message:${socket.id} -> ${data}`);
		io.sockets.emit("new_message", {id: socket.id, msg: data});
    });

    // Send Message ONO
    socket.on('chat_message', data => {
		if(consoleMode.table) consoleTable();
		else console.log(`chat_message:${socket.id} -> ${data.id}: ${data.message}`);
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
	return pack;
}

function consoleTable() {
	console.clear();
	console.log(`Listening on *:${port} - origin set`);
	console.table(getSocketUsers());
}

if(data_fix_buffer.isFix) {
	setInterval(function(){
		let pack = getSocketUsers();
		if (pack.length>0) io.emit('remoteData', {type: "list", data: pack});
	}, data_fix_buffer.delay);
}

http.listen(port, () => {
	if(consoleMode.table) consoleTable();
	else console.log(`Listening on *:${port} - origin set`);
});