import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import { IConversation } from '../utils/db/conversations'
import TestButton from './TestButton'

let timeout = null

export default function Preformatted({
  conversation,
  setMutation,
  clearPolling
} : {
  conversation: IConversation,
  setMutation: (mut) => void,
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
            // console.log('setting conv', adjustedText, displayText, tempDisplayText)
            setDisplayText(adjustedText)
            setDocument(adjustedText)
            tempDisplayText = adjustedText
            setMutation(JSON.stringify(c.lastMutation, null, 2))
          }
        }).catch((ex) => {
          clearInterval(interval)
        })
    }, 1000)
    const stopPolling = () => clearInterval(interval)
    clearPolling(stopPolling) // pass this out to parent for delete
    return stopPolling
  },[conversation.id])

  const parse = () => {
    // console.log('parse', {document, displayText})
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
      // console.log({inserts, deletes})
      setDocument(displayText)
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
        
    </>
  )
}