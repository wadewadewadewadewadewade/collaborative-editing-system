import { IMutation } from './mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'
import db, { addToCollection, deleteCollection, getCollection } from '../../utils/db';

export interface IConversation {
  id: string,
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
      /* const conversation: IConversation = {
        id: '1',
        lastMutation: {
          author: 'alice',
          conversationId: '1',
          data: {
            index: 1,
            length: 4,
            text: 'wade',
            type: 'insert'
          },
          origin: {
            alice: 5,
            bob: 0
          }
        },
        text: 'test'
      }
      const conversations: IConversations = [conversation] */
      res.status(200).json(await getCollection<IConversation>(db, 'conversations'))
      break
    case 'DELETE':
      try {
        await deleteCollection(db, 'conversations', 1000)
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
      }
      res.status(204).json(response)
      break
    case 'POST':
      const { text } = req.body
      try {
        response.msg = await addToCollection(db, 'conversations', { text })
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
