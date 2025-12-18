const token = localStorage.getItem("token");
const myName = localStorage.getItem("username");
if (!token) window.location.href = "login.html";

// Initialization
const socket = io({ auth: { token } });
let recipient = null;
let unreadCounts = {}; 
let typingTimeout;

// 1. User List & Interactivity
socket.on("users", users => {
    const list = document.getElementById("users");
    list.innerHTML = "";
    
    users.forEach(u => {
        if (u === myName) return;
        const li = document.createElement("li");
        
        li.innerHTML = `
            <div style="position: relative;">
                <div class="avatar">${u[0].toUpperCase()}</div>
                <div class="status-dot pulse"></div>
            </div>
            <div style="flex:1; margin-left: 10px;"><strong>${u}</strong></div>
            <span class="badge" id="badge-${u}" style="display:none"></span>
        `;
        
        li.onclick = () => {
            recipient = u;
            document.getElementById("chat-title").innerText = "Chatting with " + u;
            document.getElementById("input-area").style.display = "flex";
            
            unreadCounts[u] = 0;
            const badge = document.getElementById(`badge-${u}`);
            if (badge) {
                badge.innerText = "";
                badge.style.display = "none";
            }

            socket.emit("getChatHistory", u); 
        };
        list.appendChild(li);
    });
});

// 2. Real-time Messaging (Sound Effects Removed)
socket.on("privateMessage", data => {
    // We only check if the message is from the active recipient
    if (recipient === data.fromUser) {
        appendMsg(data.fromUser, data.text);
    } else {
        // Increment unread count if not currently chatting with them
        unreadCounts[data.fromUser] = (unreadCounts[data.fromUser] || 0) + 1;
        updateBadge(data.fromUser);
    }
});

function updateBadge(username) {
    const badge = document.getElementById(`badge-${username}`);
    if (badge && unreadCounts[username] > 0) {
        badge.innerText = unreadCounts[username];
        badge.style.display = "inline-block";
    }
}

// 3. Typing Indicator Logic
document.getElementById("msg").addEventListener("input", () => {
    if (recipient) {
        socket.emit("typing", { toUser: recipient });
    }
});

socket.on("typing", (data) => {
    if (recipient === data.fromUser) {
        const indicator = document.getElementById("typing-indicator");
        indicator.innerText = `${data.fromUser} is typing...`;
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            indicator.innerText = "";
        }, 2000);
    }
});

// 4. Core Functions
function sendMessage() {
    const input = document.getElementById("msg");
    const text = input.value.trim();
    if (!text || !recipient) return;
    
    socket.emit("privateMessage", { toUser: recipient, text });
    appendMsg("You", text);
    input.value = "";
}

function appendMsg(user, text) {
    const li = document.createElement("li");
    li.className = user === "You" ? "my-message" : "their-message";
    li.innerText = text;
    
    const box = document.getElementById("private-messages");
    box.appendChild(li);
    box.scrollTop = box.scrollHeight;
}

socket.on("chatHistory", messages => {
    const box = document.getElementById("private-messages");
    box.innerHTML = ""; 
    messages.forEach(msg => {
        const senderName = msg.sender === myName ? "You" : msg.sender;
        appendMsg(senderName, msg.text);
    });
});

function logout() { 
    localStorage.clear(); 
    window.location.href = "login.html"; 
}