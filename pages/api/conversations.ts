import { IMutation } from './mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'

export interface IConversation {
  id: string,
  lastMutation: IMutation
  text: string
}

export type IConversations = Array<IConversation>

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  switch (req.method) {
    case 'GET':
      const conversation: IConversation = {
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
      const conversations: IConversations = [conversation]
      res.status(200).json(conversations)
      break
    case 'DELETE':
      const response = {
        msg: undefined,
        ok: true
      }
      try {
        // do delete of all conversations here
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
