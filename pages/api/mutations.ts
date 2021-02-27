import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addToCollection, deleteCollection, getCollection } from '../../utils/db'

export interface IMutation {
  id?: string
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
      res.status(200).json(await getCollection<IMutation>(db, 'mutations'))
      break
      case 'DELETE':
        try {
          await deleteCollection(db, 'mutations', 1000)
          res.status(204).json({ ok: true })
        } catch (ex: any) {
          res.status(204).json({ ok: false, msg: JSON.stringify(ex) })
        }
        break
    case 'POST':
      const response = {
        msg: undefined,
        ok: true,
        text: undefined
      }
      try {
        const mutation: IMutation = req.body
        await addToCollection(db, 'mutations', mutation)
        // TODO
        response.msg = 'the current text of the conversation, after applying the mutation'
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
