const socket = io();

// Elements
const $messageForm = document.querySelector("#messageForm");
const $messageInput = document.querySelector("#messageInput");
const $messageButton = document.querySelector("#messageButton");
const $locationButton = document.querySelector("#locationButton");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#messageTemplate").innerHTML;
const locationTemplate = document.querySelector("#locationTemplate").innerHTML;
const sidebarTemplate = document.querySelector("#sidebarTemplate").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
}); // ignoreQueryPrefix => makes the ? mark go away

// Automatic scroll feature
const autoScroll = _ => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of the messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// Render a message
socket.on("message", (message, cb) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

// Render a location
socket.on("locationMessage", locationObject => {
  const html = Mustache.render(locationTemplate, {
    username: locationObject.username,
    url: locationObject.url,
    createdAt: moment(locationObject.createdAt).format("h:mm a")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

// Sending a
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  document.querySelector("#sidebar").innerHTML = html;
});

// Events
// Submit a message
$messageForm.addEventListener("submit", event => {
  event.preventDefault();
  $messageButton.setAttribute("disabled", "disabled");

  const message = event.target.elements.message.value;

  // send a message to the server
  socket.emit("sendMessage", message, error => {
    // enable
    $messageButton.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();

    if (error) {
      return console.log(error);
    } else {
      console.log("The message was delivered");
    }
  });
});

// Share location
$locationButton.addEventListener("click", event => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  } else {
    navigator.geolocation.getCurrentPosition(position => {
      $locationButton.setAttribute("disabled", "disabled");

      socket.emit(
        "sendLocation",
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        _ => {
          $locationButton.removeAttribute("disabled");
          console.log("Location shared successfully!");
        }
      );
    });
  }
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
