
const socket = io({
    auth: { 
        token: localStorage.getItem("token") 
    }
});

// UI Element References
const messageList = document.getElementById("private-messages");
const userList = document.getElementById("users");
const msgInput = document.getElementById("msg");
const chatTitle = document.getElementById("chat-title");
const inputArea = document.getElementById("input-area");
const typingIndicator = document.getElementById("typing-indicator");

// State Variables
let selectedUser = null;
const myUsername = localStorage.getItem("username");

// Updates the sidebar when users connect or disconnect
socket.on("users", (usersArray) => {
    userList.innerHTML = "";

    if (usersArray.length <= 1) {
        userList.innerHTML = '<li style="padding:10px; color:var(--text-dim); font-size:0.8rem;">No other users online</li>';
        return;
    }

    usersArray.forEach((user) => {
        if (user !== myUsername) {
            const li = document.createElement("li");
            li.className = "user-item";
            li.setAttribute('data-username', user);
            
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

//CHAT SELECTION ---
function selectUser(user) {
    selectedUser = user;
    chatTitle.innerText = `Chat with ${user}`;
    inputArea.style.display = "flex";
    messageList.innerHTML = ""; // Clear the message view for the new conversation

    // Remove red dot if present
    const userLi = document.querySelector(`li[data-username="${user}"]`);
    if (userLi) {
        const dot = userLi.querySelector('.unread-dot');
        if (dot) dot.remove();
    }

    // Request message history from the server
    socket.emit("getChatHistory", user);
}

// Load historical messages
socket.on("chatHistory", (history) => {
    history.forEach((msg) => {
        appendMessage(msg.sender === myUsername ? "my" : "their", msg.text);
    });
});

// Send a message
function sendMessage() {
    const text = msgInput.value.trim();
    if (text && selectedUser) {
        socket.emit("privateMessage", { toUser: selectedUser, text });
        appendMessage("my", text);
        msgInput.value = "";
    }
}

// Receive a new message
socket.on("privateMessage", (data) => {
    // Check if the message is from the person we are currently chatting with
    if (selectedUser === data.fromUser) {
        appendMessage("their", data.text);
    } else {
        const userLi = document.querySelector(`li[data-username="${data.fromUser}"]`);
        if (userLi) {t
            if (!userLi.querySelector('.unread-dot')) {
                const dot = document.createElement('div');
                dot.className = 'unread-dot';
                userLi.querySelector('.user-link').appendChild(dot);
            }
        }
    }
});

// UI Helper: Render message to screen
function appendMessage(type, text) {
    const li = document.createElement("li");
    li.className = type === "my" ? "my-message" : "their-message";
    li.innerText = text;
    messageList.appendChild(li);
    
    // Auto-scroll to the bottom
    messageList.scrollTop = messageList.scrollHeight;
}


msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

msgInput.addEventListener("input", () => {
    if (selectedUser) {
        socket.emit("typing", { toUser: selectedUser });
    }
});

socket.on("typing", (data) => {
    if (data.fromUser === selectedUser) {
        typingIndicator.innerText = `${data.fromUser} is typing...`;
        setTimeout(() => { 
            typingIndicator.innerText = ""; 
        }, 2000);
    }
});

//CONNECTION & AUTH ERROR HANDLING ---
socket.on("connect", () => {
    console.log("Connected to ChatPulse server!");
});

socket.on("connect_error", (err) => {
    console.error("Socket Error:", err.message);
    if (err.message === "Authentication error") {
        alert("Your session has expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
    }
});