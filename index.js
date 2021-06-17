const app = require("express")(); // used to call express function
const server = require("http").createServer(app); // getting the app in the server
const cors = require("cors"); // used for cross over request and is highly useful in deploying the project

const io = require("socket.io")(server, {
    cors: {
        origin: "*", // allow access from all origin
        methods: ["GET", "POST"] // method is an array of two element get and post
    }
});

app.use(cors());

const PORT = process.env.PORT || 5000; // localhost - 5000

app.get('/', (req, res) => {
    res.send('Server is running.'); // when someone goes on localhost:5000 this message will come
});

//sockets are for realtime objects like messages, video, audio etc
io.on("connection",(socket) => {
    socket.emit("me", socket.id); // me because I joined , that is for my specific user and then it gives our own socket.id

    socket.on('disconnect', () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", ({ userToCall, signalData, from, name }) => {   // we will get all these info through front end
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

    socket.on("answercall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

});


server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));