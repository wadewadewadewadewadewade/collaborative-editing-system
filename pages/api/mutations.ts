import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db from '../../utils/db'

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
      const mutationsCollection = await db.collection('mutations').orderBy('created', 'desc').get()
      const mutations = mutationsCollection.docs.map(entry => { return {...entry.data(), id: entry.id} }) as Array<IMutation>
      res.status(200).json(mutations)
      break
    case 'POST':
      const response = {
        msg: undefined,
        ok: true,
        text: undefined
      }
      try {
        const mutation: IMutation = req.body
        const result = await db.collection('mutations').add(mutation)
        response.msg = result.id
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
