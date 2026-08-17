const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) {
    const initial = { users: [], totalUsers: 0 };
    fs.writeFileSync(USERS_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  } catch (err) {
    return { users: [], totalUsers: 0 };
  }
}

function writeUsers(data) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
}

function registerSiteUser({ name, email, phone, registeredVia }) {
  const data = readUsers();
  const existing = data.users.find((u) => u.email === email);

  if (existing) {
    return { isNew: false, user: existing, totalUsers: data.totalUsers };
  }

  const newUser = {
    id: 'site_' + Date.now(),
    name,
    email,
    phone: phone || null,
    source: 'website',
    registeredVia: registeredVia || 'email',
    joinedAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  data.totalUsers = data.users.length;
  writeUsers(data);

  return { isNew: true, user: newUser, totalUsers: data.totalUsers };
}

module.exports = { readUsers, writeUsers, registerSiteUser };