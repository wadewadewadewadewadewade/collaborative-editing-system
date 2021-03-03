import { useEffect, useState } from 'react'
import { IMutation } from '../pages/api/mutations'
import { IConversation } from '../pages/api/conversations'
import styles from '../styles/Home.module.css'

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

let timeout = null

export default function Preformatted({
  conversation,
  setMutation,
  buttons,
  clearPolling
} : {
  conversation: IConversation,
  setMutation: (mut) => void,
  buttons: boolean,
  clearPolling: (cb: () => void) => void
}) {
  const [displayText, setDisplayText] = useState(conversation.text || '')
  // I'm stil not sure why useEffect displayText doesn't have correct value
  // so I'musing this work-around
  let tempDisplayText = displayText
  const [document, setDocument] = useState('')
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/conversations/${conversation.id}`)
        .then(response => response.json())
        .then((c: IConversation) => {
          const adjustedText = c ? c.text || '' : ''
          if (c && adjustedText !== tempDisplayText) {
            console.log('setting conv', adjustedText, displayText, tempDisplayText)
            setDisplayText(adjustedText)
            setDocument(adjustedText)
            tempDisplayText = adjustedText
            setMutation(JSON.stringify(c.lastMutation, null, 2))
          }
        }).catch((ex) => {
          clearInterval(interval)
        })
    }, 3000)
    const stopPolling = () => clearInterval(interval)
    clearPolling(stopPolling) // pass this out to parent for delete
    return stopPolling
  },[conversation.id])

  const parse = () => {
    console.log('parse', {document, displayText})
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
      } else if (w1 === w2p) {
        inserts = {word: w2};
        i1++;
        i2 = i2 + 2;
      } else if (w2 === w1p) {
        deletes = {word: w2};
        i2++;
        i1 = i1 + 2;
      } else if (w2 && !w1) {
        inserts = {word: w2}
        i2++
      } else {
        deletes = {word: w1};
        i1++
      }
      limit--
    }
    if (inserts || deletes) {
      console.log({inserts, deletes})
      setDocument(displayText)
    }
  }

  return (
    <>
      <textarea
        value={displayText}
        onChange={(e) => setDisplayText(e.target.value)}
        onKeyUp={(e) => {
          if (timeout) {
            clearTimeout(timeout)
            timeout = null
          }
          timeout = setTimeout(() => parse(), 5000)
          if (/\B/.test(e.key)) {
            parse()
            if (timeout) {
              clearTimeout(timeout)
              timeout = null
            }
          }
        }}
      ></textarea>
      {buttons && (<>
        <ul className={styles.buttons} data-title="Example 1">
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":0,"text":"The","type":"insert"},"origin":{"alice":0,"bob":0}})
            }}>B(0, 0)INS0:'The'</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":3,"text":" house","type":"insert"},"origin":{"alice":0,"bob":1}})
            }}>B(1, 0)INS3:' house'</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":9,"text":" is","type":"insert"},"origin":{"alice":0,"bob":2}})
            }}>B(2, 0)INS9:' is'</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":12,"text":" red.","type":"insert"},"origin":{"alice":0,"bob":3}})
            }}>B(3, 0)INS12:' red.'</button>
          </li>
        </ul>
        <ul className={styles.buttons} data-title="Example 2">
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":13,"length":4,"type":"delete"},"origin":{"alice":0,"bob":4}})
            }}>B(4, 0)DEL13:4</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":13,"text":"blue","type":"insert"},"origin":{"alice":0,"bob":5}})
            }}>B(5, 0)INS13:'blue'</button>
          </li>
        </ul>
        <ul className={styles.buttons} data-title="Example 3">
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"alice","data":{"index":13,"length":4,"type":"delete"},"origin":{"alice":0,"bob":6}})
            }}>A(6, 0)DEL13:4</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"alice","data":{"index":13,"text":"green","type":"insert"},"origin":{"alice":1,"bob":6}})
            }}>A(6, 1)INS13:'green'</button>
          </li>
        </ul>
        <ul className={styles.buttons} data-title="Example 4">
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"alice","data":{"index":3,"text":" big","type":"insert"},"origin":{"alice":2,"bob":6}})
            }}>A(6, 2)INS3:' big'</button>
          </li>
          <li>
            <button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              insertMutation({conversationId:conversation.id,"author":"bob","data":{"index":18,"text":" and yellow","type":"insert"},"origin":{"alice":2,"bob":6}})
            }}>B(6, 2)INS18:' and yellow'</button>
          </li>
        </ul>
      </>)}
    </>
  )
}