import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'
import db, { deleteConversation, getConversation } from '../../../utils/db'

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
      const conversation = await getConversation(db, id as string)
      res.status(200).json(conversation)
      break
    case 'DELETE':
      const response: IDeleteResponse = {
        msg: undefined,
        ok: true
      }
      try {
        await deleteConversation(db, id as string)
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
