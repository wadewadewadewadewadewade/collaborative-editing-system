import { addMutation, IMutation } from './../../../utils/db/mutations';
import { getKeyByVisibleId } from '../../../utils/db';
import { Server } from 'socket.io'
import db from '../../../utils/db'

const unsubscribe: {[conversationId: string]: () => void} = {}

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')

    const io = new Server(res.socket.server)

    io.on('connection', socket => {
      
      socket.on('watch', async (conversationId: string) => {
        const key = await getKeyByVisibleId(db, conversationId)
        if (key) {
          unsubscribe[key.conversationId] = db.collection('conversations').doc(key.conversationId).onSnapshot((snapshot) => {
            const conversation = {...snapshot.data(), id: conversationId}
            socket.broadcast.emit('update', conversation)
          })
        }
      })

      socket.on('update', async (mutation: IMutation) => {
        if (mutation) {
          const key = await getKeyByVisibleId(db, mutation.conversationId)
          if (key) {
            addMutation(db, key.conversationId, mutation)
          }
        }
      })

      socket.on('end', async (visible: string) => {
        const key = await getKeyByVisibleId(db, visible)
        if (key && unsubscribe[key.conversationId]) {
          unsubscribe[key.conversationId]()
          delete unsubscribe[key.conversationId]
        }
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