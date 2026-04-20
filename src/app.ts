import express, {type Application} from 'express'
import authRoutes from './routes/authRoutes.js'
import postsRoutes from './routes/postsRoutes.js'
import usersRoutes from './routes/usersRoutes.js'
import connectDB from './config/mongodb.js'
import requireAuth from './middlewares/auth.js'
import errorHandler from './middlewares/errorHandler.js'
import notFound from './middlewares/notFound.js'

connectDB()

const app: Application = express()
app.use(express.json())

app.use('/api/v1/auth', authRoutes)

app.use('/api/v1/posts', requireAuth, postsRoutes)

app.use('/api/v1/users', requireAuth, usersRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`)
})