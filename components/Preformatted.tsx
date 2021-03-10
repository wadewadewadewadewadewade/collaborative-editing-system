import styles from '../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { IConversation } from '../utils/db/conversations'
import TestButton from './TestButton'
import { AuthorsType, IMutation } from '../utils/db/mutations'
import { Router, useRouter } from 'next/router'

export default function Preformatted({
  conversationJson,
  author
} : {
  conversationJson: string,
  author: AuthorsType
}) {
  const router = useRouter()
  const conversation: IConversation = JSON.parse(conversationJson)
  const Authors = ['bob', 'alice']
  const [lastMutation, setLastMutation] = useState(conversation.lastMutation)
  const [displayText, setDisplayText] = useState(conversation.text || '')
  const [document, setDocument] = useState(conversation.text || '')
  // I'm stil not sure why useEffect displayText doesn't have correct value
  // so I'musing this work-around
  const testButtonsVisible = router.query.testbuttons === 'true'
  useEffect(() => {
    const socket = io()
    fetch('/conversations/socketio', {cache: "no-store"}).finally(() => {
      
      socket.on('connect', () => {
        socket.emit('watch', conversation.id)
      })

      socket.on('update', (conversationData: IConversation) => {
        if (conversationData) {
          if (conversationData.id === conversation.id) {
            setDocument(conversationData.text)
            setDisplayText(conversationData.text)
            setLastMutation(conversationData.lastMutation)
          }
        }
      })

      socket.on('disconnect', () => {
        console.warn('socket disconnected')
        router.push('/')
      })
    })
    return () => { socket && socket.emit('end', conversation.id) }
  },[conversation.id])

  const textAreaRef = useRef<HTMLTextAreaElement>()

  function getCursorPos() {
    const input = textAreaRef.current
    try {
      return input.selectionStart
    } catch (ex) {
      console.warn('cannot get cursor position', ex)
    }
  }

  const parse = () => {
    // console.log('parse', {displayText})
    let inserts = null
    let deletes = null
    const first = document.split(' ')
    const second = displayText.split(' ')
    let i1 = 0
    let i2 = 0
    let limit = 1000
    while (!(i1 === first.length && i2 === second.length) && limit > 0) {
      const w1 = first[i1]
      const w1p = i1 + 1 < first.length ? first[i1 + 1] : null;
      const w2 = second[i2];
      const w2p = i2+ 1 < second.length ? second[i2 + 1] : null;
      if (w1 === w2) {
        i1++;
        i2++;
      } else if (w1 === w2p && w2) {
        inserts = {word: w2};
        i1++;
        i2 = i2 + 2;
      } else if (w2 === w1p && w2) {
        deletes = {word: w2};
        i2++;
        i1 = i1 + 2;
      } else if (w2 && !w1 && w2) {
        inserts = {word: w2}
        i2++
      } else if (w1) {
        deletes = {word: w1};
        i1++
      }
      limit--
    }
    if (inserts || deletes) {
      const nullOrigin = {}
      Authors.forEach(a => { nullOrigin[a] = 0 })
      const origin = lastMutation ? lastMutation.origin : nullOrigin
      const data: IMutation["data"] = {
        index: getCursorPos(),
        type: 'delete'
      }
      if (typeof data.index !== 'number') {
        return undefined
      }
      if (inserts) {
        data.type = 'insert'
        data.text = inserts.word
      } else {
        data['length'] = deletes.word.length
      }
      const newMutation: IMutation = {
        author,
        conversationId: conversation.id,
        data,
        origin: {
          ...origin,
          [author]: origin[author] + 1
        }
      }
      console.log({newMutation})
    }
  }

  const buttons: Array<{
    author: 'bob' | 'alice';
    data: {
        type: 'insert' | 'delete';
        index: number;
        text?: string;
        length?: number;
    };
    origin: {
        bob: number;
        alice: number;
    };
  }> = [
    {"author":"bob","data":{"type":"insert","index":0,"text":"The"},"origin":{"bob":0,"alice":0}},
    {"author":"bob","data":{"type":"insert","index":3,"text":" house"},"origin":{"bob":1,"alice":0}},
    {"author":"bob","data":{"type":"insert","index":9,"text":" is"},"origin":{"bob":2,"alice":0}},
    {"author":"bob","data":{"type":"insert","index":12,"text":" red."},"origin":{"bob":3,"alice":0}},
    {"author":"alice","data":{"type":"delete","index":0,"length":3},"origin":{"bob":2,"alice":0}},
    {"author":"alice","data":{"type":"insert","index":0,"text":"THE"},"origin":{"bob":2,"alice":1}},
    {"author":"bob","data":{"type":"insert","index":13,"text":" and blue"},"origin":{"bob":4,"alice":1}}
  ]
  let timeout = null

  return (
    <>
      <textarea
        ref={textAreaRef}
        value={displayText}
        onChange={(e) => setDisplayText(e.target.value)}
        onKeyUp={(e) => {
          if (timeout) {
            clearTimeout(timeout)
            timeout = null
          }
          timeout = setTimeout(() => parse(), 5000)
          if (e.key !== 'Backspace' && e.key !== 'Delete' && /\B/.test(e.key)) {
            parse()
            if (timeout) {
              clearTimeout(timeout)
              timeout = null
            }
          }
        }}
      ></textarea>
      
      {testButtonsVisible && 
        <div className={styles.columns}>
          <div className={styles.column}>
            {buttons.map((t,i) => <TestButton key={`mutation-${i}`} mutation={{...t, conversationId: conversation.id}} />)}
            <button onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              await fetch(`/mutations/${conversation.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
            }}>Reset</button>
          </div>
          <div className={styles.column}>
            <div className={styles.pre}>
  For Each Mutation<br/>
  <span></span>If PreviousMutation.Origin[ThisMutationAuthor] &gt;= ThisMutation.Origin[ThisMutationAuthor]<br/>
  <span></span><span></span><i className={styles.comment}>// Shift index on this mutation if necessary</i><br/>
  <span></span><span></span>If PreviousMutation.Index ToTheLeftOf ThisMutation.Index<br/>
  <span></span><span></span><span></span>If PreviousMutation.Type = Insert<br/>
  <span></span><span></span><span></span><span></span>ThisMutation.Index = ThisMutation.Index + PreviousMutation.Test.length<br/>
  <span></span><span></span><span></span>If PreviousMutation.Type = Delete<br/>
  <span></span><span></span><span></span><span></span>ThisMutation.Index = ThisMutation.Index - PreviousMutation.Length<br/>
  <span></span><span></span><i className={styles.comment}>// Adjust the origin on this mutation if necessary</i><br/>
  <span></span><span></span>If PreviousMutation.Origin[ThisMutationAuthor] == ThisMutation.Origin[ThisMutationAuthor]<br/>
  <span></span><span></span><span></span>ThisMutation.Origin[ThisMutationAuthor] = PreviousMutation.Origin[ThisMutationAuthor] + 1<br/>
  <span></span><i className={styles.comment}>// Adjust origin for all other authors if necessary</i><br/>
  <span></span>For Each OtherAuthor<br/>
  <span></span><span></span>If PreviousMutation.Origin[OtherAuthor] == ThisMutation.Origin[OtherAuthor]<br/>
  <span></span><span></span><span></span>ThisMutation.Origin[OtherAuthor] = PreviousMutation.Origin[OtherAuthor] + 1<br/>
            </div>
          </div>
        </div>
      }
      <pre className={styles.preformatted} data-title="Last mutation">{JSON.stringify(lastMutation, null, 2)}</pre>
    </>
  )
}