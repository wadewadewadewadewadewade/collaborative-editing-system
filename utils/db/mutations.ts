import admin from 'firebase-admin'
import { addConversation } from './conversations';
import { deleteQueryBatch, getKeyByVisibleId, addKey } from './index'

const authors = ['bob', 'alice'] // so we can have unlimited authors

export interface IMutation {
  id?: string,
  created?: string
  author: 'alice' | 'bob'
  conversationId: string
  data: {
    index: number
    text?: string // delete has no text
    length?: number // insert has no length
    type: 'insert' | 'delete'
  }
  origin: {
    alice: number,
    bob: number
  }
}

export async function getConversationText(mutations: Array<IMutation>) {
  mutations.sort(mutationsSort)
  // build new text
  let text = ''
  mutations.forEach((mut) => {
    if (mut.data.type === 'insert') {
      const after = text.slice(mut.data.index)
      text = text.slice(0, mut.data.index) + mut.data.text + after
    } else if (mut.data.type === 'delete') {
      const after = text.slice(mut.data.index + mut.data.length)
      text = text.slice(0, mut.data.index) + after
    }
  })
  return text
}

export const mutationsSort = (a: IMutation, b: IMutation) => {
  return a.origin.bob - b.origin.bob ||
    a.origin.alice - b.origin.alice ||
    a.data.index - b.data.index
}

export async function deleteMutationsWithinConversation(db: FirebaseFirestore.Firestore, conversationRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>, batchSize: number) {
  const collectionRef = conversationRef.collection('mutations');
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

export async function deleteMutations(db: FirebaseFirestore.Firestore, visible: string) {
  const key = await getKeyByVisibleId(db, visible)
  if (!key) {
    return undefined
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  await conversationRef.update({ lastMutation: admin.firestore.FieldValue.delete(), text: '' })
  await deleteMutationsWithinConversation(db, conversationRef, 1000)
}

export async function getMutations(db: FirebaseFirestore.Firestore, visible: string) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    const conversationNewRef = await db.collection('conversations').add({text: '', created: new Date().toISOString() })
    key = await addKey(db, conversationNewRef.id, visible)
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const mutationRef = await conversationRef.collection('mutations').orderBy('created', 'desc').get()
  const mutations = mutationRef.docs.map((doc) => {
    return {...doc.data(), id: doc.id} as IMutation
  })
  mutations.sort(mutationsSort)
  return mutations
}

export async function getMutation(db: FirebaseFirestore.Firestore, visible: string, id: string) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    return undefined
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const mutationRef = conversationRef.collection('mutations').doc(id)
  const mutationData = await mutationRef.get()
  if (!mutationData.exists) {
    return undefined
  }
  return {...mutationData.data(), id: mutationData.id} as IMutation
}

function parseMutations(mutationsList: Array<IMutation>, conversationRef?: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>) {
  mutationsList.sort(mutationsSort)
  let previousMutation = mutationsList[0]
  for(let i=1;i<mutationsList.length;i++) {
    let modifiedThisMutation = false
    const mutation = mutationsList[i]
    const thisAuthor = mutation.author
    const otherAuthors = authors.filter(a=>a!==thisAuthor)
    if (previousMutation.origin[thisAuthor] >= mutation.origin[thisAuthor]) {
      if (mutation.data.index >= previousMutation.data.index) {
        if (previousMutation.data.type === 'insert') {
          mutation.data.index += previousMutation.data.text.length
        } else {
          mutation.data.index -= previousMutation.data.length
        }
        modifiedThisMutation = true
      }
      // fix origin of this author
      if (previousMutation.origin[thisAuthor] === mutation.origin[thisAuthor]) {
        mutation.origin[thisAuthor] = previousMutation.origin[thisAuthor] + 1
        modifiedThisMutation = true
      }
    }
    // adjust origin of other authors if necessary
    otherAuthors.forEach(author => {
    	if (previousMutation.origin[author] > mutation.origin[author]) {
      	mutation.origin[author] = previousMutation.origin[author] + 1
        modifiedThisMutation = true
      }
    })
    if (conversationRef && modifiedThisMutation) {
      const { id, ...rest } = mutation
      conversationRef.collection('mutations').doc(mutation.id).update(rest)
    }
    previousMutation = mutation
  }
  return mutationsList
}

export async function addMutation(db : FirebaseFirestore.Firestore, visible: string, mutation: IMutation) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    key = await addConversation(db, visible)
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const result = await conversationRef.collection('mutations').add({
    ...mutation,
    created: new Date().toISOString()
  })
  mutation.id = result.id
  let mutations = await getMutations(db, visible)
  mutations = parseMutations(mutations)
  const text = await getConversationText(mutations)
  const { id, ...rest } = mutation
  await conversationRef.update({text, lastMutation: rest})
  return result.id
}

export async function deleteMutation(db : FirebaseFirestore.Firestore, visible: string, mutationId: string) {
  let key = await getKeyByVisibleId(db, visible)
  if (!key) {
    return undefined
  }
  const conversationRef = db.collection('conversations').doc(key.conversationId)
  const mutationsRef = conversationRef.collection('mutations')
  await mutationsRef.doc(mutationId).delete()
  const mutations = await getMutations(db, key.conversationId)
  if (mutations.length < 1) {
    await conversationRef.update({ lastMutation: admin.firestore.FieldValue.delete(), text: '' })
  } else {
    const { created, id, ...rest } = mutations[mutations.length - 1]
    await conversationRef.update({ lastMutation: rest, text: getConversationText(mutations) })
  }

}
