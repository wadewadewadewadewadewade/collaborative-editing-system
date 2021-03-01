import { useContext } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversations, IConversation } from './api/conversations'
import db, { getConversations } from '../utils/db'
import { LoadingIndicatorContext } from './_app'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

// started at 2021-02-26 14:30 PST
// stopped at 2021-02-26 18:00 PST - 3.5
// started at 2021-02-27 08:00 PST
// stopped at 2021-02-27 11:45 PST - 3.75
// started at 2021-02-27 17:30 PST
// stopped at 2021-02-27 20:30 PST - 3
// started at 2021-02-28 06:00 PST
// stopped at 2021-02-28 08:00 PST - 2 (got nothing done on listeners)
// started at 2021-02-28 14:00 PST
// stopped at 2021-02-28 17:00 PST - 3 (stil owrking on listner)
// started at 2021-02-28 19:00 PST
// stopped at 2021-02-28 21:00 PST - 2 (gave up and switch to long-polling)

export const getStaticProps: GetStaticProps = async () => {
  const conversations: IConversations = await getConversations(db)
  return {
    props: {
      conversations
    }
  }
}

export default function Conversations({
  conversations
}: {
  conversations: IConversations
}) {
  const router = useRouter()
  const { setIsLoading } = useContext(LoadingIndicatorContext)
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
                },
                body: JSON.stringify({ text: '' })
              })
              const { msg: id } = await response.json()
              await router.push(`/${id}`)
              setIsLoading(false)
            }}
          >+</button>
        </h2>

        {conversations && <ol className={styles.grid}>

          {conversations.map((conversation: IConversation) => (
            <li key={conversation.id} className={styles.card}>
              <Link href={`/${conversation.id}`}>
                <a>
                  <ConversationControls id={conversation.id} onDelete={(res) => {
                    if (res.ok) {
                      conversations = conversations.filter((conv) => conv.id !== conversation.id)
                    }
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
