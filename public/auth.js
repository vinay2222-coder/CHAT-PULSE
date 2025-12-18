async function authAction(url, body, successMsg, redirect) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", body.username);
            }
            if (successMsg) alert(successMsg);
            window.location.href = redirect;
        } else {
            alert(data.error);
        }
    } catch (e) { alert("Server Error"); }
}

function login() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    authAction("/api/auth/login", { username: u, password: p }, null, "chat.html");
}

function register() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    authAction("/api/auth/register", { username: u, password: p }, "Success! Please login.", "login.html");
}