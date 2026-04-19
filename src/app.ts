import express, {type Application} from 'express'
import authRoutes from './routes/authRoutes.js'
import postsRoutes from './routes/postsRoutes.js'
import usersRoutes from './routes/usersRoutes.js'
import connectDB from './config/db.js'
import verifyJWT from './middlewares/verifyJWT.js'

connectDB()

const app: Application = express()
app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/posts', verifyJWT, postsRoutes)

app.use('/api/users', verifyJWT, usersRoutes)

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`)
})