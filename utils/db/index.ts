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

export interface IKey {
  visible: string
  conversationId: string
  id: string
}

export async function deleteQueryBatch(db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>, resolve: Function) {
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

type PathType = 'conversations' | 'keys' | 'conversations/mutations'

export async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: PathType, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
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
