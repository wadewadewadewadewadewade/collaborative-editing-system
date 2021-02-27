import { IMutation } from './../mutations';
import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../../utils/cors'
import db from '../../../utils/db'

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
      const mutationsRef = await db.collection('mutations').doc(id as string).get();
      const mutation = {...mutationsRef.data(), id: mutationsRef.id} as IMutation;
      res.status(200).json(mutation)
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
