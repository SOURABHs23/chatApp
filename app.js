const socket = io.connect("http://localhost:3000");

function joinChat(username) {
  socket.emit("join", username);
}

// Prompt the user to enter their name and join the chat
let username = prompt("Enter your name:");
while (!username) {
  username = prompt("Enter your name:"); // Keep prompting until a valid name is entered
}
joinChat(username);

document
  .getElementById("message")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

document.getElementById("send-message").addEventListener("click", sendMessage);

function sendMessage() {
  const messageInput = document.getElementById("message");
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("message", message);
    messageInput.value = "";
    messageInput.focus(); // Focus back to the input after sending the message
  }
}

socket.on("message", (data) => {
  const chatHistory = document.getElementById("chat-history");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.currentTime} - ${data.username}: ${data.message}`;
  chatHistory.appendChild(messageElement);
  chatHistory.scrollTop = chatHistory.scrollHeight;
});

// socket.on("typing", (username) => {
//   const typingIndicator = document.getElementById("typing-indicator");
//   typingIndicator.textContent = `${username} is typing...`;
//   setTimeout(() => {
//     typingIndicator.textContent = "";
//   }, 2000);
// });

socket.on("typing", (username) => {
  const typingIndicator = document.getElementById("typing-indicator");
  typingIndicator.textContent = `${username} is typing...`;
});

socket.on("stop-typing", () => {
  const typingIndicator = document.getElementById("typing-indicator");
  typingIndicator.textContent = "";
});

const messageInput = document.getElementById("message");
messageInput.addEventListener("input", () => {
  socket.emit("typing");
});

messageInput.addEventListener("blur", () => {
  socket.emit("stop-typing");
});

socket.on("chat-history", (messages) => {
  const chatHistory = document.getElementById("chat-history");
  messages.forEach((msg) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${msg.timestamp} - ${msg.username}: ${msg.message}`;
    chatHistory.appendChild(messageElement);
  });
  chatHistory.scrollTop = chatHistory.scrollHeight;
});

socket.on("user-joined", ({ username, users }) => {
  const notificationPanel = document.getElementById("notification-panel");
  const userElement = document.createElement("div");
  userElement.textContent = `${username} joined the chat`;
  notificationPanel.appendChild(userElement);
  updateUserList(users);
});

socket.on("user-disconnected", ({ username, users }) => {
  const notificationPanel = document.getElementById("notification-panel");
  const userElement = document.createElement("div");
  userElement.textContent = `${username} left the chat`;
  notificationPanel.appendChild(userElement);
  updateUserList(users);
});

function updateUserList(users) {
  const userCount = document.getElementById("user-count");
  const userList = document.getElementById("user-list");

  userCount.textContent = users.length;
  userList.innerHTML = "";
  users.forEach((user) => {
    const userItem = document.createElement("li");
    userItem.textContent = user;
    userList.appendChild(userItem);
  });
}
