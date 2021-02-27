import admin from 'firebase-admin';

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

export async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

export async function getCollection<T>(db : FirebaseFirestore.Firestore, path: string, where: [fieldPath: string | FirebaseFirestore.FieldPath, opStr: FirebaseFirestore.WhereFilterOp, value: any] = undefined, limit = -1) {
  let collectionRef = null
  if (where && limit > 0) {
    collectionRef = await db.collection(path).orderBy('created', 'desc').where(...where).limit(limit).get()
  } else if (where) {
    collectionRef = await db.collection(path).orderBy('created', 'desc').where(...where).get()
  } else if (limit > 0) {
    collectionRef = await db.collection(path).orderBy('created', 'desc').limit(limit).get()
  } else {
    collectionRef = await db.collection(path).orderBy('created', 'desc').get()
  }
  if (collectionRef) {
    const collection = collectionRef.docs.map(entry => {
      const item = {...entry.data(), id: entry.id } as unknown
      return item as Array<T>
    })
    return collection
  }
  return null
}

export async function addToCollection(db : FirebaseFirestore.Firestore, path: string, data: any) {
  const result = await db.collection(path).add({...data, created: new Date().toISOString() })
  return result.id
}

export async function getCollectionItem<T>(db : FirebaseFirestore.Firestore, path: string, id: string) {
  const doc = await db.collection(path).doc(id).get()
  if (doc.exists) {
    const item = {...doc.data(), id: doc.id } as unknown
    return item as T
  }
  return null
}

export async function deleteCollectionItem(db : FirebaseFirestore.Firestore, path: string, id: string) {
  await db.collection(path).doc(id).delete()
}