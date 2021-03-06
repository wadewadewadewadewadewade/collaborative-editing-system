import { useContext, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversations, IConversation, getConversations } from '../utils/db/conversations'
import db from '../utils/db'
import { LoadingIndicatorContext } from './_app'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

export const getStaticProps: GetStaticProps = async () => {
  const conversations: IConversations = await getConversations(db)
  return {
    props: {
      conversations
    },
    revalidate: 1
  }
}

export default function Conversations({
  conversations
}: {
  conversations: IConversations
}) {
  const router = useRouter()
  const { setIsLoading } = useContext(LoadingIndicatorContext)
  const [stateConversations, setStateConversations] = useState(conversations)
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
          <span>Conversations</span>
          <button
            className={`${styles.card} buttons-add`}
            onClick={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              const response = await fetch('/conversations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              const { msg: id } = await response.json()
              await router.push(`/${id}`)
              setIsLoading(false)
            }}
          >+</button>
        </h2>

        {stateConversations && <ol className={styles.grid}>

          {stateConversations.map((conversation: IConversation) => (
            <li key={conversation.id} className={styles.card}>
              <Link href={`/${conversation.id}`}>
                <a>
                  <ConversationControls id={conversation.id} onDelete={() => {
                    setStateConversations((conv) => conv.filter((c) => c.id !== conversation.id))
                  }} />
                </a>
              </Link>
            </li>
          ))}

        </ol>}
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
