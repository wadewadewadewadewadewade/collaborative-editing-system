import { IMutation } from './mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addConversation, deleteCollection, getConversations } from '../../utils/db';

export interface IConversation {
  id: string
  mutations: number
  lastMutation: IMutation
  text: string
}

export type IConversations = Array<IConversation>

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  let response = {
    msg: undefined,
    ok: true
  }
  switch (req.method) {
    case 'GET':
      res.status(200).json(await getConversations(db))
      break
    case 'DELETE':
      try {
        await deleteCollection(db, 'conversations', 1000)
        await deleteCollection(db, 'keys', 1000)
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
      }
      res.status(204).json(response)
      break
    case 'POST':
      try {
        const key = await addConversation(db)
        response.msg = key.visible
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
