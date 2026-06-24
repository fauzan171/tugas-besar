const authService = require("../services/auth.service");

function login(req, res) {
  const { password } = req.body;
  const result = authService.login(password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json(result.data);
}

module.exports = { login };
