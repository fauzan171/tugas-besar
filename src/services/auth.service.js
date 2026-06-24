const jwt = require("jsonwebtoken");
const config = require("../config");

function login(password) {
  if (!password) {
    return { error: "Password wajib diisi", status: 400 };
  }

  if (password !== config.adminPassword) {
    return { error: "Password salah", status: 401 };
  }

  const token = jwt.sign({ role: "admin" }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { data: { token }, status: 200 };
}

module.exports = { login };
