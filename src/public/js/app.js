const socket = io();

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("#room");
const messageForm = room.querySelector("#msg");
const nicknameForm = room.querySelector("#nickname");
const h3 = document.querySelector("h3");

room.hidden = true;

let roomName;

function showRoom () {
    room.hidden = false;
    welcome.hidden = true;
    h3.textContent = `ROOM : ${roomName}`;
    messageForm.addEventListener("submit", handleMessageSubmit);
    nicknameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    const nickname = input.value;
    socket.emit("nickname", nickname ,roomName, (newName)=>{
       const msg = `Your nickname changed  **[ ${newName} ] `; 
        addNotice(msg);    
    });
    input.value = "";
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    const msg = input.value;
    socket.emit("new_message", msg ,roomName, ()=>{
        addMessage("You",msg);    
    });
    input.value = "";
}

function addMessage(sender="someone", message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    const time = new Date().toISOString().replace('T', ' ').substring(5, 19);
    li.innerText = `[${time}] 😊[ ${sender} ] : ${message}`;
    ul.appendChild(li);
}

function addNotice(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.className = "notice"
    const time = new Date().toISOString().replace('T', ' ').substring(5, 19);
    li.innerText = `[${time}] 🤖🤖🤖 Notice : ${message}`;
    ul.appendChild(li);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter-room", {payload: input.value}, showRoom);
    roomName = input.value;
    input.value = "";
    showRoom();
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (nickname, cnt) => {
    const msg = `🎉🎉🎉 ${nickname} joined`;
    addNotice(msg);  
    h3.textContent = `ROOM : ${roomName} ( ${cnt} )`;
})

socket.on("bye", (nickname, cnt)=>{
    const msg = `😒😒😒 ${nickname}  left...`;
    h3.textContent = `ROOM : ${roomName} ( ${cnt} )`;
    addNotice(msg);
})

socket.on("new_message", (nickname, message)=>{
    addMessage(nickname, message);
})

socket.on("nickname", (oldName, newName)=>{
    const msg = `changed nickname : [ ${oldName} ]   ==>  ***[ ${newName} ]**** `;
    addNotice(msg);
})

socket.on("room_change", (rooms)=>{
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length ===0){
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerHTML = room;
        roomList.appendChild(li);
    });
})