import jwt from 'jsonwebtoken'
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    userId?: string;
}
interface CustomJwtPayload extends JwtPayload{
    id: string
}

const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization as string
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
            if (err || !decoded) return res.status(403).json({ message: "Invalid or Expired token" })
            const payload = decoded as CustomJwtPayload
            req.userId = payload.id
            next()
        }
    )
}

export default verifyJWT