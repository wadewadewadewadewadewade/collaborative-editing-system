import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'

export interface IMutation {
  author: 'alice' | 'bob'
  conversationId: string
  data: {
    index: number,
    length?: number,
    text?: string,
    type: 'insert' | 'delete'
  }
  origin: {
    alice: number,
    bob: number
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  switch (req.method) {
    case 'GET':
      res.status(400).json('bad request')
      break
    case 'POST':
      const response = {
        msg: undefined,
        ok: true,
        text: undefined
      }
      try {
        const mutation: IMutation = req.body
        response.text = mutation.data.text
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
      }
      res.status(201).json(response)
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
