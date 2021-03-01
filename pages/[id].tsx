import { useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import BackButton from '../components/BackButton'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversation, IConversations } from './api/conversations'
import { useRouter } from 'next/router'
import db, { getConversations, getConversation } from '../utils/db'
import { IMutation } from './api/mutations'
import TextArea from '../components/TextArea'

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

const insertMutation = async (data: IMutation) => {
  const response = await fetch('/mutations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  return result
}

// let browserDb = null

export default function Conversation({
  conversation
}: {
  conversation: IConversation
}) {
  const router = useRouter()
  useEffect(() => {
    const evtSource = new EventSource(`/api/conversations/sockets/${conversation.id}`)
    evtSource.onmessage = function(event) {
      console.log(event.data)
    }
    evtSource.onerror = function(err) {
      console.error("EventSource failed:", err)
    }
    return () => {
      evtSource.close()
    }
  },[conversation.id])
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

        <TextArea defaultValue={conversation.text} disabled />

        <TextArea label="Last Modification" defaultValue={JSON.stringify(conversation.lastMutation)} disabled />

        {/*<TextArea
          label={'Demo Text'}
          onWord={async (word) => {

          }}
        />*/}
{/*}
        <button onClick={(e) => {
          insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":0,"text":"The","type":"insert"},"origin":{"alice":0,"bob":0}})
        }}>B(0, 0)INS0:'The'</button>

        <button onClick={(e) => {
          insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":3,"text":" house","type":"insert"},"origin":{"alice":0,"bob":1}})
        }}>B(1, 0)INS3:' house'</button>
*/}
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
