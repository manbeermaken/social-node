import jwt from 'jsonwebtoken'
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken'
import redisClient from '../config/redis.js'
import bcrypt from 'bcrypt'
import type { Request, Response } from 'express';
import {prisma} from '../config/prisma.js'

interface CustomJwtPayload extends JwtPayload{
    id: string
}

const generateTokens = (userId: string): [string,string] => {
    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET!)
    return [accessToken, refreshToken]
}

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body
    try{
        const user = await prisma.user.findUnique({
            where:{
                username: username
            }
        })
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid username or password" })
        }
        const [accessToken, refreshToken] = generateTokens(user.id)
        const SEVEN_DAYS = 60 * 60 * 24 * 7
        await redisClient.setEx(refreshToken, SEVEN_DAYS, user.id)
        res.json({ accessToken, refreshToken })
    } catch (err) {
        console.log('Error during login: ', err)
        if (err instanceof Error) {
            res.status(500).json({ message: err.message })
        } else {
            res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
}

export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.body.token
    if (refreshToken == null) { return res.status(401).json({ message: "Token not provided" }) }
    try {
        const tokenExists = await redisClient.get(refreshToken)
        if (!tokenExists) { return res.status(403).json({ message: "Invalid token" }) }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!, 
            (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
            if (err || !decoded) { return res.status(403).json({ message: "Invalid token" }) }
            const payload = decoded as CustomJwtPayload
            const userId = payload.id
            const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' })
            res.json({ accessToken })
        })
    } catch (err) {
        console.error("Redis error during refresh:", err)
        res.status(500).json({ message: "Server Error" })
    }
}

export const signup = async (req: Request, res: Response) => {
    try {
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(req.body.password,saltRounds)
        const user = await prisma.user.create({
            data: {
                username: req.body.username,
                password: hashedPassword
            }
        })
        const [accessToken, refreshToken] = generateTokens(user.id)
        const SEVEN_DAYS = 60 * 60 * 24 * 7
        await redisClient.setEx(refreshToken, SEVEN_DAYS, user.id)
        res.status(201).json({ accessToken, refreshToken })
        } catch (err) {
        if(err instanceof Error){
            if ((err as any).code === 'P2002') {
                return res.status(400).json({ message: 'A user with this username already exists.' })
            }
            res.status(400).json({ message: err.message })
        } else {
            res.status(500).json({message: "An unexpected error occured"})
        }
    }
}

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.body.token
    if (refreshToken == null) { return res.status(401).json({ message: "Token not provided" }) }
    try {
        const tokenExists = await redisClient.get(refreshToken)
        if (!tokenExists) { return res.status(403).json({ message: "Invalid token" }) }
        await redisClient.del(refreshToken)
        res.status(204).send()
    } catch (err) {
        console.log("Redis error during logout: ", err)
        res.status(500).json({ message: "Server Error" })
    }
}