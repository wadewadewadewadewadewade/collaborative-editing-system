import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addMutation, getConversationText } from '../../utils/db'

export interface IMutation {
  id?: string
  author: 'alice' | 'bob'
  conversationId: string
  data: {
    index: number,
    text: string,
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
      const response = {
        msg: undefined,
        ok: true,
        text: undefined
      }
      try {
        const mutation: IMutation = req.body
        await addMutation(db, mutation.conversationId, mutation)
        const text = await getConversationText(db, mutation.conversationId)
        response.msg = text
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
