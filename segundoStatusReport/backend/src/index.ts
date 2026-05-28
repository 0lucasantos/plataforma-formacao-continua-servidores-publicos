import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import coursesRouter from './routes/courses'
import { modulesRouter, moduleRoutes } from './routes/modules'
import progressRouter from './routes/progress'
import quizRouter from './routes/quiz'
import badgesRouter from './routes/badges'
import bulletinRouter from './routes/bulletin'
import aiChatRouter from './routes/ai-chat'
import quizHistoryRouter from './routes/quiz-history'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/courses/:courseId/modules', modulesRouter)
app.use('/api/modules', moduleRoutes())
app.use('/api/progress', progressRouter)
app.use('/api/quiz', quizRouter)
app.use('/api/badges', badgesRouter)
app.use('/api/bulletin', bulletinRouter)
app.use('/api/ai-chat', aiChatRouter)
app.use('/api/quiz-history', quizHistoryRouter)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Aprenda+ backend rodando em http://localhost:${PORT}`)
})
