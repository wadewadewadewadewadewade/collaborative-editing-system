import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db from '../../utils/db'
import { addMutation, IMutation, getConversationText, getMutations } from '../../utils/db/mutations'

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
        const mutations = await getMutations(db, mutation.conversationId)
        const text = await getConversationText(mutations)
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
