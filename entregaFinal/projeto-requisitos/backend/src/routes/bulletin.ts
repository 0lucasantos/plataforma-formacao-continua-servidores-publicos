import { Router, Response } from 'express'
import { requireAuth, requireAdmin, AuthRequest } from '../lib/auth'
import { listBulletinPosts, insertBulletinPost, removeBulletinPost } from '../lib/store'

const router = Router()

router.get('/:courseId', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json(listBulletinPosts(String(req.params['courseId'])))
})

router.post('/:courseId', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, content, url, expires_at } = req.body
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' })
  const post = insertBulletinPost(String(req.params['courseId']), title, content, url, expires_at)
  return res.status(201).json(post)
})

router.delete('/:courseId/:postId', requireAdmin, (req: AuthRequest, res: Response) => {
  removeBulletinPost(String(req.params['postId']))
  return res.json({ ok: true })
})

export default router
