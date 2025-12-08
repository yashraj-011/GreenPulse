import jwt from "jsonwebtoken";

export function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) return res.status(401).json({ message: "Missing token" });

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
