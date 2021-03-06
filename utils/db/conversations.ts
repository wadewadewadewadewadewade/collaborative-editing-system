import { deleteMutationsWithinConversation, IMutation } from './mutations';
import { addKey, getKeyByVisibleId, IKey, deleteKeyByConversationId } from "."

export interface IConversation {
  id: string
  created?: string
  lastMutation: IMutation
  text: string
}

export type IConversations = Array<IConversation>

export async function getConversations(db: FirebaseFirestore.Firestore) {
  const conversationRef = await db.collection('conversations').get()
  const conversations = conversationRef.docs.map((doc) => {
    const conv = {...doc.data(), id: doc.id} as IConversation
    const { created, ...rest } = conv
    return rest as IConversation
  })
  const keysRef = await db.collection('keys').get()
  const keys = keysRef.docs.map((doc) => {
    return {...doc.data(), id: doc.id} as IKey
  })
  // plug the visible IDs into the cionversation objects, if they exist
  conversations.forEach((conversation) => {
    const keyMapping = keys.filter((k) => k.conversationId === conversation.id)
    if (keyMapping.length > 0) {
      const key = keyMapping[0]
      if (key && typeof key.visible !=='undefined') {
        conversation.id = key.visible
      }
    }
  })
  return conversations
}

export async function getConversation(db: FirebaseFirestore.Firestore, visible: string) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    return undefined
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const conversation = {...conversationData.data(), id: visible} as IConversation
  return conversation
}

export async function addConversation(db: FirebaseFirestore.Firestore, visible?: string) {
  const result = await db.collection('conversations').add({text: '', created: new Date().toISOString() })
  const key = await addKey(db, result.id, visible)
  return key
}

export async function deleteConversation(db : FirebaseFirestore.Firestore, visible: string) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    return undefined
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  await deleteMutationsWithinConversation(db, conversationRef, 1000)
  await conversationRef.delete()
  await deleteKeyByConversationId(db, key.conversationId)
}
