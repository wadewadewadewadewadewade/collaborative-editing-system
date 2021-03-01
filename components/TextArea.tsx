import { DetailedHTMLProps, TextareaHTMLAttributes, useState } from 'react'
import styles from '../styles/Home.module.css'

let timeout = null

export default function TextArea ({
  conversationId,
  label,
  defaultValue = '',
  onWord,
  ...rest
}: DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> & {
  conversationId: string,
  label?: string,
  defaultValue?: string,
  onWord?: (word: string) => Promise<void>
}) {
  const [text, setText] = useState(defaultValue)
  const [document, setDocument] = useState('')

  const parse = () => {
    // detect changes here and send mutations to server
    // maybe using document?
    let inserts = null
    let deletes = null
    const first = document.split(' ')
    const second = text.split(' ')
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
      setDocument(text)
    }
  }

  return (
    <div className={styles.growWrapBody}>
      {label && <label className={styles.growWrapLabel} htmlFor="demo_document">{label}</label>}
      <div className={styles.growWrap}>
        <textarea
          id="demo_document"
          className={styles.conversationDocument}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          onKeyUp={(e) => {
            if (onWord !== undefined) {
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
            }
          }}
          {...rest}
        ></textarea>
      </div>
    </div>
  )
}