import { IConversation } from '../../conversations';
import db from '../../../../utils/db'
import { NextApiRequest, NextApiResponse } from 'next';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { id }
  } = req
  const conversationId = id as string

  let unsubscribe = null
  
  const conversationRef = db.collection('conversations').doc(conversationId)
  const conversationDoc = await conversationRef.get()
  if (!conversationDoc.exists) {
    res.status(404).send({ok: false, msg: `conversation ${conversationId} not found`})
  } else {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
    res.writeHead(200, headers)

    unsubscribe = conversationRef.onSnapshot((snapshot) => {
      console.log('snapshot recieved')
      const conversation = {...snapshot.data(), id: snapshot.id} as IConversation
      res.write('data: ' + JSON.stringify(conversation) + '\n\n')
      res.writeContinue()
      //res.flush() // this is deprecated, but still seems to work
    })

    let connectionOpen = true
    req.on('close', () => {
      connectionOpen = false
    })
  
    let inc = 0
    while (req.socket.writable && connectionOpen) {
      console.log(inc++)
      await sleep(5000)
    }
    console.log('unsubscribing')
    unsubscribe && unsubscribe()
  }
  
  res.end()
}

export const config = {
  api: {
    bodyParser: false
  }
}