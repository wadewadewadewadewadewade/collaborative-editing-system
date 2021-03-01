import { useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import BackButton from '../components/BackButton'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversation, IConversations } from './api/conversations'
import { useRouter } from 'next/router'
import db, { getConversations, getConversation } from '../utils/db'
import Preformatted from '../components/Preformatted'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

export async function getStaticPaths() {
  const conversations: IConversations = await getConversations(db)
  const conversationPaths = conversations.map((conv) => `/${conv.id}`)
  return {
    paths: conversationPaths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params
  const conversation: IConversation = await getConversation(db, id as string)
  if (!conversation) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  return {
    props: {
      conversation
    }
  }
}

export default function Conversation({
  conversation
}: {
  conversation: IConversation
}) {
  const router = useRouter()
  const [mutation, setMutation] = useState(JSON.stringify(conversation.lastMutation, null, 2))
  /*useEffect(() => {
    const evtSource = new EventSource(`/api/conversations/sockets/${conversation.id}`)
    evtSource.onmessage = function(event) {
      const newText = JSON.parse(event.data).text
      if (newText !== conversation.text) {
        setTextDisplay(newText)
      }
    }
    evtSource.onerror = function(err) {
      console.error("EventSource failed:", err)
    }
    window && window.addEventListener('beforeunload', () => evtSource.close())
    return () => {
      evtSource.close()
    }
  },[conversation.id])*/
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
          <ConversationControls id={conversation.id} onDelete={() => {
            router.push('/')
          }} />
        </h2>
        
        <Preformatted conversation={conversation} setMutation={setMutation} buttons />
        <pre className={styles.preformatted} data-title="Last mutation">{mutation}</pre>

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
