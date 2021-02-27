import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { IConversations, IConversation } from './api/conversations'
import db, { getCollection } from '../utils/db'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

// started at 2021-02-26 14:30 PST
// stopped at 2021-02-26 18:00 PST
// started at 2021-02-27 08:00 PST

export const getStaticProps: GetStaticProps = async () => {
  const conversations: IConversations = await getCollection<IConversation>(db, 'conversations')

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
          Conversations
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
