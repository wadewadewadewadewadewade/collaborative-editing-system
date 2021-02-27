import { IConversation } from '../conversations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'

export interface IDeleteResponse {
  msg?: string
  ok: boolean
}

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
      }
      res.status(200).json(conversation)
      break
    case 'DELETE':
      const response: IDeleteResponse = {
        msg: undefined,
        ok: true
      }
      try {
        // do delete here
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
