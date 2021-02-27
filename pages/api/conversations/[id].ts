import { IMutation } from './../mutations';
import { IConversation } from '../conversations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'
import db, { getCollection, getCollectionItem } from '../../../utils/db'

export interface IDeleteResponse {
  msg?: string
  ok: boolean
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  const {
    query: { id }
  } = req
  switch (req.method) {
    case 'GET':
      const conversation = await getCollectionItem<IConversation>(db, 'conversations', id as string)
      const mutationListOf1 = await getCollection<IMutation>(db, 'mutations', ['conversationId', '==', conversation.id], 1)
      conversation.lastMutation = mutationListOf1[0]
      /* const conversation: IConversation = {
        id: '1',
        lastMutation: {
          author: 'alice',
          conversationId: '1',
          data: {
            index: 0,
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
      } */
      res.status(200).json(conversation)
      break
    case 'DELETE':
      const response: IDeleteResponse = {
        msg: undefined,
        ok: true
      }
      try {
        await db.collection('conversations').doc(id as string).delete()
      } catch (ex: any) {
        response.ok = false
        response.msg = JSON.stringify(ex)
      }
      res.status(204).json(response)
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
