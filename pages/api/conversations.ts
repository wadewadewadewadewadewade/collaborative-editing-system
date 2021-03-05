import { IMutation } from './mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addConversation, deleteCollection, deleteMutationsWithinConversation, getConversations } from '../../utils/db';

export interface IConversation {
  id: string
  created?: string
  lastMutation: IMutation
  text: string
}

export type IConversations = Array<IConversation>

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  switch (req.method) {
    case 'GET':
      res.status(200).json({ conversations: await getConversations(db), ok: true })
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
        res.status(204).json({ok: true})
      } catch (ex: any) {
        res.status(400).json({ok: false, msg: JSON.stringify(ex)})
      }
      break
    case 'POST':
      try {
        const key = await addConversation(db)
        res.status(201).json({ok: true, msg: key.visible})
      } catch (ex: any) {
        res.status(400).json({ok: false, msg: JSON.stringify(ex)})
      }
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
