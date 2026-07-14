const bcrypt = require("bcryptjs");

const passwordHash = bcrypt.hashSync("password", 10);
const Database = require("better-sqlite3");

const db = new Database("data/app.db");

const users = [
  ["rand", "rand@wheel.com", "Rand al'Thor"],
  ["mat", "mat@wheel.com", "Matrim Cauthon"],
  ["perrin", "perrin@wheel.com", "Perrin Aybara"],
  ["egwene", "egwene@wheel.com", "Egwene al'Vere"],
  ["nynaeve", "nynaeve@wheel.com", "Nynaeve al'Meara"],
  ["elayne", "elayne@wheel.com", "Elayne Trakand"],
  ["moiraine", "moiraine@wheel.com", "Moiraine Damodred"],
  ["lan", "lan@wheel.com", "Lan Mandragoran"],
  ["aviendha", "aviendha@wheel.com", "Aviendha"],
  ["min", "min@wheel.com", "Min Farshaw"],
  ["loial", "loial@wheel.com", "Loial"],
  ["thom", "thom@wheel.com", "Thom Merrilin"],
  ["siuan", "siuan@wheel.com", "Siuan Sanche"],
  ["faile", "faile@wheel.com", "Faile Bashere"],
  ["tuon", "tuon@wheel.com", "Tuon Athaem Kore Paendrag"],
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (
    username,
    email,
    display_name,
    password_hash
  ) VALUES (?, ?, ?, ?)
`);

const seedUsers = db.transaction(() => {
  for (const [username, email, displayName] of users) {
    insertUser.run(username, email, displayName, passwordHash);
  }
});

seedUsers();
