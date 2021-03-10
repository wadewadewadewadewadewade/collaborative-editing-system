import Head from 'next/head'
import dynamic from 'next/dynamic'
import BackButton from '../components/BackButton'
import styles from '../styles/Home.module.css'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import db from '../utils/db'
import Preformatted from '../components/Preformatted'
import { getConversation, getConversations, IConversation, IConversations } from '../utils/db/conversations'
import { AuthorsType } from '../utils/db/mutations'
import Select from 'react-select'
import { useState } from 'react'

const ConversationControls = dynamic(() => import('../components/ConversationControls'))

export async function getStaticPaths() {
  const conversations: IConversations = await getConversations(db)
  const conversationPaths = conversations.map((conv) => `/${conv.id}`)
  return {
    paths: conversationPaths,
    fallback: true
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
    },
    revalidate: 1
  }
}

export default function Conversation({
  conversation
}: {
  conversation: IConversation
}) {
  const Authors = ['bob','alice'] // importing this from Mutations wasn't working for some reason
  const router = useRouter()
  const [author, setAuthor] = useState<AuthorsType>('bob')
  const authorOptions = (name) => ({
    value: name,
    label: name.substring(0,1)
  })
  if (router.isFallback) {
    return <div>Loading...</div>
  }
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
          <ConversationControls
            id={conversation.id}
            onDelete={() => {
              router.push('/')
            }}
          />
          {/*
          <Select
            className={styles.author}
            value={authorOptions(author)}
            options={Authors.map(authorOptions)}
            onChange={(option) => {
              setAuthor(option.value)
            }}
          />
          */}
        </h2>
        
        <Preformatted author={author} conversationJson={JSON.stringify(conversation)} />

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
