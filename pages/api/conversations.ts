import { IMutation } from './mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addConversation, deleteCollection, deleteConversation, deleteMutationsWithinConversation, getConversation, getConversations } from '../../utils/db';

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
        const conversations = await getConversations(db)
        conversations.forEach(async (conversation) => {
          const conversationRef = db.collection('conversations').doc(conversation.id)
          await deleteMutationsWithinConversation(db, conversationRef, 1000)
        })
        await deleteCollection(db, 'conversations', 1000)
        await deleteCollection(db, 'keys', 1000)
        res.status(204).json(response)
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
        res.status(400).json(response)
      }
      break
    case 'POST':
      try {
        const key = await addConversation(db)
        response.msg = key.visible
        res.status(201).json(response)
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
        res.status(400).json(response)
      }
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
