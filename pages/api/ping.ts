import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  switch (req.method) {
    case 'GET':
      res.status(200).json({ ok: true, msg: 'pong' })
      break
    case 'POST':
      res.status(400).json('bad request')
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
