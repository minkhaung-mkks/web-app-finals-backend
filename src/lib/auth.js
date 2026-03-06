// TODO: Students must implement authentication and role-based access control here.
// Remove this stub and implement JWT verification and role checking as required in the exam.

import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import cookie from "cookie";
const JWT_SECRET = process.env.JWT_SECRET || "mydefaulyjwtsecret"; // Use a  strong secret in production
export function verifyJWT(req) {
    try {
        const cookies = req.headers.get("cookie") || "";
        const { token } = cookie.parse(cookies);
        if (!token) {
            return null;
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        return null;
    }
}
export function requireRole(req, ...allowedRoles) {
    const user = verifyJWT(req);    
    console.log(user)
    if (!user) return { user: null, error: "Unauthorized", status: 401 };
    if (!allowedRoles.includes(user.role.toLowerCase())) return { user, error: "Forbidden", status: 403 };
    return { user, error: null, status: null };
}


