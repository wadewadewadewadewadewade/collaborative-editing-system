import { IMutation } from './../mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'
import db, { deleteCollectionItem, getCollectionItem } from '../../../utils/db'

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
      res.status(200).json(await getCollectionItem<IMutation>(db, 'mutations', id as string))
      break
    case 'DELETE':
      try {
        await deleteCollectionItem(db, 'conversations', id as string)
        res.status(204).json({ ok:true })
      } catch (ex: any) {
        res.status(204).json({ ok: false, msg: JSON.stringify(ex) })
      }
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
