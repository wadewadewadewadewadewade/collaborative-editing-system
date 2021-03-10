import type { NextApiRequest, NextApiResponse } from 'next'
import cors, { runMiddleware } from '../../utils/cors'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors)
  switch (req.method) {
    case 'GET':
      res.status(200).json({
        ok: true,
        author: {
          name: 'Wade McDaniel',
          email: 'wadessocool@gmail.com'
        },
        frontend: {
          url: 'https://collaborativeeditingsystem.herokuapp.com/'
        },
        language: 'node.js',
        sources: 'https://github.com/wadewadewadewadewadewade/collaborative-editing-system',
        answers: {
          '1': 'string, answer to the question 1',
          '2': 'string, answer to the question 2',
          '3': 'string, answer to the question 3'
        }
      })
      break
    case 'POST':
      res.status(400).json('bad request')
      break
    default:
      res.status(400).json('bad request')
      break
  }
}
