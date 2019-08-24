const users = [];

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: "Username and room are required"
    };
  } else {
    // Check for an existing user
    const existingUser = users.find(
      user => user.room === room && user.username === username
    );

    // Validate username
    if (existingUser) {
      return {
        error: "Username is in use"
      };
    } else {
      // Store user
      const user = { id, username, room };
      users.push(user);

      return { user };
    }
  }
};

// Remove a user
const removeUser = id => {
  // Find an index of a user to be removed
  const index = users.findIndex(user => user.id === id);

  // Check if the user was found
  if (index !== -1) {
    return users.splice(index, 1);
  }
};

// Get a user by its id
const getUser = id => {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users[index];
  }
};

// Get users from a specific room
const getUsersInRoom = roomName => {
  roomName = roomName.trim().toLowerCase();
  const filteredUsers = users.filter(user => user.room === roomName);

  if (filteredUsers.length === 0) {
    return [];
  } else {
    return filteredUsers;
  }
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};
