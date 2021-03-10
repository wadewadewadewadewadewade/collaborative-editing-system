import { addMutation, IMutation } from './../../../utils/db/mutations';
import { getKeyByVisibleId } from '../../../utils/db';
import { Server } from 'socket.io'
import db from '../../../utils/db'

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')

    const io = new Server(res.socket.server)

    io.on('connection', socket => {
      let unsubscribe = null
      let key = null
      
      socket.on('watch', async (conversationId: string) => {
        key = await getKeyByVisibleId(db, conversationId)
        if (key) {
          unsubscribe = db.collection('conversations').doc(key.conversationId).onSnapshot((snapshot) => {
            const conversation = {...snapshot.data(), id: conversationId}
            socket.broadcast.emit('update', conversation)
          })
        }
      })

      socket.on('update', async (mutation: IMutation) => {
        if (mutation && key) {
          addMutation(db, key.conversationId, mutation)
        }
      })

      socket.on('end', () => {
        unsubscribe && unsubscribe()
      })
    })

    res.socket.server.io = io
  } else {
    console.log('socket.io already running')
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false
  }
}

export default ioHandler