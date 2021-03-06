import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'
import db from '../../../utils/db'
import { deleteMutations, getMutations } from '../../../utils/db/mutations'

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
      const conversation = await getMutations(db, id as string)
      res.status(200).json(conversation)
      break
    case 'DELETE':
      try {
        await deleteMutations(db, id as string)
        res.status(204).json({ok: true})
      } catch (ex: any) {
        res.status(400).json({ok: false, msg: JSON.stringify(ex)})
      }
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
