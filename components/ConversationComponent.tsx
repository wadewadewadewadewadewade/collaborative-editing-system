import { useEffect, useState } from 'react'
import { IConversation } from '../pages/api/conversations'

import TextArea from './TextArea'

export default function ConversationComponent({
  conversationObject
}: {
  conversationObject: IConversation
}) {
  const [conversation, setConversation] = useState(conversationObject)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/conversations/${conversationObject.id}`)
        .then(response => response.json())
        .then(conv => {
          if (conv && conv.text !== conversation.text) {
            console.log('setting conv')
            setConversation(prevState => ({
              ...prevState,
              ...conv
            }))
          }
        })
    }, 3000)
    return () => clearInterval(interval)
  },[conversationObject.id])
  return (
    <>
      <TextArea conversationId={conversation.id} defaultValue={conversation.text} disabled />
      <TextArea conversationId={conversation.id} label="Last Modification" defaultValue={JSON.stringify(conversation.lastMutation)} disabled />
    </>
  )
}