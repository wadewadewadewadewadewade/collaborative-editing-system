import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addMutation, getConversationText } from '../../utils/db'

export interface IMutation {
  id?: string
  author: 'alice' | 'bob'
  conversationId: string
  data: {
    index: number
    text?: string // delete has no text
    length?: number // insert has no length
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
    case 'DELETE':
      res.status(400).json('bad request')
      break
    case 'POST':
      try {
        const mutation: IMutation = req.body
        await addMutation(db, mutation.conversationId, mutation)
        const text = await getConversationText(db, mutation.conversationId)
        res.status(201).json({ok: true, text})
      } catch (ex: any) {
        res.status(400).json({ok: false, msg: JSON.stringify(ex)})
      }
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
