import { IMutation } from './../../pages/api/mutations'
import { IConversation } from './../../pages/api/conversations'
import admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.firestoreServiceAccountKey) as admin.ServiceAccount
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack)
  }
}
export default admin.firestore()

async function deleteQueryBatch(db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>, resolve: Function) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

type PathType = 'conversations'

export async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: PathType, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

export async function getConversations(db: FirebaseFirestore.Firestore) {
  const conversationRef = await db.collection('conversations').get()
  const conversations = conversationRef.docs.map((doc) => {
    return {...doc.data(), id: doc.id} as IConversation
  })
  return conversations
}

export async function getMutations(db: FirebaseFirestore.Firestore, id: string) {
  const conversationRef = db.collection('conversations').doc(id)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const mutationRef = await conversationRef.collection('mutations').orderBy('created', 'desc').get()
  const mutations = mutationRef.docs.map((doc) => {
    return {...doc.data(), id: doc.id} as IMutation
  })
  return mutations
}

export async function getConversation(db: FirebaseFirestore.Firestore, id: string) {
  const conversationRef = db.collection('conversations').doc(id)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const conversation = {...conversationData.data(), id: conversationData.id} as IConversation
  return conversation
}

export async function getMutation(db: FirebaseFirestore.Firestore, conversationId: string, id: string) {
  const conversationRef = db.collection('conversations').doc(conversationId)
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

export async function addConversation(db : FirebaseFirestore.Firestore) {
  const result = await db.collection('conversations').add({text: '', created: new Date().toISOString() })
  return result.id
}

export async function addMutation(db : FirebaseFirestore.Firestore, id: string, mutation: IMutation) {
  const conversationRef = db.collection('conversations').doc(id)
  const conversationData = await conversationRef.get()
  if (!conversationData.exists) {
    return undefined
  }
  const result = await conversationRef.collection('mutations').add({...mutation, created: new Date().toISOString() })
  const text = await getConversationText(db, id)
  await conversationRef.update({text, lastMutation: mutation})
  return result.id
}

export async function deleteConversation(db : FirebaseFirestore.Firestore, id: string) {
  await db.collection('conversations').doc(id).delete()
}

export async function deleteMutation(db : FirebaseFirestore.Firestore, conversationId: string, id: string) {
  await db.collection('conversations').doc(conversationId).collection('mutations').doc(id).delete()
}

export async function getConversationText(db : FirebaseFirestore.Firestore, id: string) {
  const mutations = await getMutations(db, id)
  // build new text
  let text = ''
  mutations.reverse()
  mutations.forEach((mut) => {
    if (mut.data.type === 'insert') {
      const after = text.slice(mut.data.index)
      text = text.slice(0, mut.data.index) + mut.data.text + after
    } else if (mut.data.type === 'delete') {
      const after = text.slice(mut.data.index + mut.data.text.length)
      text = text.slice(0, mut.data.index) + after
    }
  })
  // TODO: store this as a snapshot to save calculations in the future, using
  // the numebr of mutations as the 'version' 
  return text
}