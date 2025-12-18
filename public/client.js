const socket = io({
    auth: { token: localStorage.getItem("token") }
});

const messageList = document.getElementById("private-messages");
const userList = document.getElementById("users");
const msgInput = document.getElementById("msg");
const chatTitle = document.getElementById("chat-title");
const inputArea = document.getElementById("input-area");
const typingIndicator = document.getElementById("typing-indicator");

let selectedUser = null;
const myUsername = localStorage.getItem("username");

// 1. Handle Online Users List
socket.on("users", (usersArray) => {
    console.log("Online users received:", usersArray); // CHECK YOUR CONSOLE (F12)
    
    const userList = document.getElementById("users");
    const myUsername = localStorage.getItem("username");
    
    userList.innerHTML = ""; // Clear current list

    if (usersArray.length <= 1) {
        userList.innerHTML = '<li style="padding:10px; color:var(--text-dim); font-size:0.8rem;">No other users online</li>';
        return;
    }

    usersArray.forEach((user) => {
        // Only show users that are NOT me
        if (user !== myUsername) {
            const li = document.createElement("li");
            li.className = "user-item";
            li.style.cursor = "pointer";
            li.innerHTML = `
                <div class="user-link">
                    <div class="avatar-small">${user.substring(0,2).toUpperCase()}</div>
                    <span>${user}</span>
                    <div class="online-indicator"></div>
                </div>
            `;
            li.onclick = () => selectUser(user);
            userList.appendChild(li);
        }
    });
});

// 2. Select a contact to chat
function selectUser(user) {
    selectedUser = user;
    chatTitle.innerText = `Chat with ${user}`;
    inputArea.style.display = "flex";
    messageList.innerHTML = ""; // Clear view
    socket.emit("getChatHistory", user);
}

// 3. Load Chat History
socket.on("chatHistory", (history) => {
    history.forEach((msg) => {
        appendMessage(msg.sender === myUsername ? "my" : "their", msg.text);
    });
});

// 4. Sending Messages
function sendMessage() {
    const text = msgInput.value.trim();
    if (text && selectedUser) {
        socket.emit("privateMessage", { toUser: selectedUser, text });
        appendMessage("my", text);
        msgInput.value = "";
    }
}

// 5. Receiving Messages
socket.on("privateMessage", (data) => {
    if (selectedUser === data.fromUser) {
        appendMessage("their", data.text);
    } else {
        alert(`New message from ${data.fromUser}`);
    }
});

// 6. UI Helper
function appendMessage(type, text) {
    const li = document.createElement("li");
    li.className = type === "my" ? "my-message" : "their-message";
    li.innerText = text;
    messageList.appendChild(li);
    messageList.scrollTop = messageList.scrollHeight;
}

// Typing Indicator logic
msgInput.addEventListener("input", () => {
    if (selectedUser) socket.emit("typing", { toUser: selectedUser });
});

socket.on("typing", (data) => {
    if (data.fromUser === selectedUser) {
        typingIndicator.innerText = `${data.fromUser} is typing...`;
        setTimeout(() => { typingIndicator.innerText = ""; }, 2000);
    }
});

socket.on("connect_error", (err) => {
    console.error("Socket Connection Error:", err.message);
    if (err.message === "Authentication error") {
        alert("Session expired. Please login again.");
        window.location.href = "login.html";
    }
});

socket.on("connect", () => {
    console.log("Connected to server successfully!");
});