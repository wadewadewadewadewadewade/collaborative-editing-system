import Head from 'next/head'
import dynamic from 'next/dynamic'
import BackButton from '../components/BackButton'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversation } from './api/conversations'
import { useRouter } from 'next/router'
import db from '../utils/db'
import { IMutation } from './api/mutations'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

export async function getStaticPaths() {
  const conversationsCollection = await db.collection('conversations').orderBy('created', 'desc').get();
  const conversations = conversationsCollection.docs.map(entry => { return {...entry.data(), id: entry.id} }) as Array<IConversation>;
  const conversationPaths = conversations.map((conv) => `/${conv.id}`)
  return {
    paths: conversationPaths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params
  const conversationDoc = await db.collection('conversations').doc(id as string).get()
  if (!conversationDoc.exists) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  const conversation = {...conversationDoc.data(), id: id as string} as IConversation;
  const mutationsCollection = await db.collection('mutations').where('conversationId', '==', conversation.id).orderBy('created', 'desc').limit(1).get();
  const lastMutation = mutationsCollection.docs.map(entry => { return {...entry.data(), id: entry.id} })[0] as IMutation;
  conversation.lastMutation = lastMutation
  return {
    props: {
      conversation
    }
  }
}

export default function Conversation({ conversation }: { conversation: IConversation }) {
  const router = useRouter()
  return (
    <div className={styles.container}>
      
      <Head>
        <title>Collaborative editing system</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Collaborative editing system
        </h1>

        <h2 className={styles.subtitle}>
          <BackButton />
          <span>Conversation</span>
          <ConversationControls id={conversation.id} onDelete={(res) => {
            router.push('/')
          }} />
        </h2>

        <div className="grow-wrap-body">
          <label className="grow-wrap-label" htmlFor="conversation_document">Text:</label>
          <div className="grow-wrap">
            <textarea id="conversation_document" className="conversation-document" disabled>{conversation.text}</textarea>
          </div>
        </div>

      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
