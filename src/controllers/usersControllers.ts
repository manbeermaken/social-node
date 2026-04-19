import type { Request, Response } from 'express';
import redisClient from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { generateTokens } from './authContorllers.js';

export async function changeUsername( req : Request, res : Response ){
    const username = req.username
    const newUsername = req.body.newUsername
    console.log(username,newUsername)
    if(!newUsername){
        return res.status(400).json({message: 'New username not provided'})
    }
    try{
        const user = await prisma.user.findUnique({
            where:{
                username : username
            }
        })
        console.log(user)
        if(!user){
            return res.status(401).json({message : 'Username not found'})
        } 

        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                username: newUsername
            }
        })
        if(!updatedUser){
            throw new Error('postgres update error')
        }

        const xAddResult = await redisClient.xAdd('changeUsername','*',{
            userId:user.id,
            newUsername:newUsername
        })
        // if(!xAddResult){
        //     throw new Error('redis error')
        // }

        const [accessToken,refreshToken] = generateTokens(user.id,newUsername)
        return res.status(200).json({accessToken,refreshToken})

    } catch (err) {
        console.log('Error during changing username: ', err)
        if (err instanceof Error) {
            res.status(500).json({ message: err.message })
        } else {
            res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
}

export async function changePassword( req : Request, res : Response ){

}
