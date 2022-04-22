import express from "express";
import {
    Server
} from "socket.io";
import http from "http";
import path from 'path';
import { instrument } from '@socket.io/admin-ui';

const __dirname = path.resolve();

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"))
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log('Listen on http://localhost:3000')

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer,{
    cors: {
        origin: ["https://admin.socket.io"],
        credentials:true,

    }
});

instrument(wsServer, {
    auth:false
});

function getAllRoomInfo() {
    const allRoom = wsServer.sockets.adapter.rooms
    //allRoom.forEach(console.log)
    return allRoom;
}

function countRoom(roomName){
    console.log(roomName, wsServer.sockets.adapter.rooms.get(roomName)?.size)
   return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

function getPublicRooms() {
    const {
        sockets: {
            adapter: {
                sids,
                rooms
            },
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key)
        }
    });
    return publicRooms
}
wsServer.on("connection", socket => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(`Socket Event : ${event}`);
    });
    socket.on("enter-room", ({
        payload: roomName
    }, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", getPublicRooms());
        console.log(getAllRoomInfo());
        console.log(getPublicRooms());
    });
    
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => {
            socket.to(room).emit("bye", socket.nickname, countRoom(room)-1);
        })
    })
    
    socket.on("disconnect", ()=>{
        wsServer.sockets.emit("room_change", getPublicRooms());
        console.log(getAllRoomInfo());
        console.log(getPublicRooms());
    })

    socket.on("new_message", (msg, roomName, done) => {
        socket.to(roomName).emit("new_message", socket.nickname, msg);
        done(msg);
    })
    socket.on("nickname", (nickname, roomName, done) => {
        const oldName = socket.nickname;
        socket["nickname"] = nickname;
        const newName = socket.nickname;

        socket.to(roomName).emit("nickname", oldName, newName);
        done(newName);
    });
})



httpServer.listen(3000, handleListen);