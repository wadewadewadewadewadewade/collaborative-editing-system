import { IMutation } from './../../pages/api/mutations'
import { IConversation } from './../../pages/api/conversations'
import admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'

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

type PathType = 'conversations' | 'keys'

export async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: PathType, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

export async function deleteMutationsWithinConversation(db: FirebaseFirestore.Firestore, conversationRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>, batchSize: number) {
  const collectionRef = conversationRef.collection('mutations');
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

interface IKey {
  visible: string
  conversationId: string
  id: string
}

// get the FB conversation ID from the visible ID
export async function getKeyByVisibleId(db: FirebaseFirestore.Firestore, visible: string) {
  const keyRef = await db.collection('keys').where('visible', '==', visible).get()
  if (keyRef.empty) {
    return undefined
  } else {
    const key = keyRef.docs[0]
    return {...key.data(), id: key.id} as IKey
  }
}

// get the visible ID FB from the conversation ID 
export async function getKeyByConversationId(db: FirebaseFirestore.Firestore, conversationId: string) {
  const keyRef = await db.collection('keys').where('conversationId', '==', conversationId).get()
  if (keyRef.empty) {
    return undefined
  } else {
    const key = keyRef.docs[0]
    return {...key.data(), id: key.id} as IKey
  }
}

// generate a key for a new visible -> FB conversation ID mapping
export async function addKey(db: FirebaseFirestore.Firestore, conversationId: string, visible: string = undefined) {
  const checkExists = await getKeyByConversationId(db, conversationId)
  if (checkExists) {
    return checkExists
  }
  let visibleValue = visible
  if (visibleValue === undefined) { // make a new key
    visibleValue = uuidv4()
    while (await getKeyByVisibleId(db, visibleValue) !== undefined) {
      visibleValue = uuidv4()
    }
  }
  const data = {visible: visibleValue, conversationId}
  const key = await db.collection('keys').add(data)
  return {...data, id: key.id} as IKey
}

// delete the  key by FB conversation ID
export async function deleteKeyByConversationId(db: FirebaseFirestore.Firestore, conversationId: string) {
  const key = await getKeyByConversationId(db, conversationId)
  if (key) {
    await db.collection('keys').doc(key.id).delete()
    return true
  } else {
    return false
  }
}

// get the visible ID FB from the conversation ID 
export async function deleteKeyByVisibleId(db: FirebaseFirestore.Firestore, visible: string) {
  const key = await getKeyByVisibleId(db, visible)
  if (key) {
    await db.collection('keys').doc(key.id).delete()
    return true
  } else {
    return false
  }
}

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
    const mut = {...doc.data(), id: doc.id} as IMutation
    const { created, ...rest } = mut
    return rest
  })
  return mutations
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

export async function addConversation(db: FirebaseFirestore.Firestore, visible?: string) {
  const result = await db.collection('conversations').add({text: '', created: new Date().toISOString() })
  const key = await addKey(db, result.id, visible)
  return key
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
  const conversation = {...conversationData.data(), id: visible} as IConversation
  const { lastMutation } = conversation;
  // adjust next mutation if origin matches last mutation
  if (lastMutation && (lastMutation.origin.bob === mutation.origin.bob && lastMutation.origin.alice === mutation.origin.alice)) {
    // two came in at the same time so transform this one
    if (mutation.data.index >= lastMutation.data.index) {
      if (lastMutation.data.type === 'insert') {
        mutation.data.index += lastMutation.data.index + 1
      } else {
        mutation.data.index -= lastMutation.data.index
      }
    }
    //and adjust the origin
    mutation.origin[mutation.author]++
  }
  // the above transofrm doesn't ajust for older mutations than simeltanious
  // coming in late, like someone that was offline for a long period of time...
  const result = await conversationRef.collection('mutations').add(mutation)
  const text = await getConversationText(db, visible)
  await conversationRef.update({text, lastMutation: mutation})
  return result.id
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

export async function deleteMutation(db : FirebaseFirestore.Firestore, conversationId: string, id: string) {
  await db.collection('conversations').doc(conversationId).collection('mutations').doc(id).delete()
}

export async function getConversationText(db : FirebaseFirestore.Firestore, visible: string) {
  const mutations = await getMutations(db, visible)
  mutations.sort((a,b) => {
    return a.origin.bob - b.origin.bob || a.origin.alice - b.origin.alice
  })
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