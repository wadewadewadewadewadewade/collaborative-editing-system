import { useState, useEffect } from 'react'
import { IDeleteResponse } from '../pages/api/conversations/[id]'
import styles from '../styles/Home.module.css'

// borrowed from here: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
// meant to be run client-side, so be sure to load this with ssr: false
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null
        ? JSON.parse(stickyValue)
        : defaultValue;
    }
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);
  return [value, setValue];
}

export default function ConversationControls({
  id,
  onDelete
}: {
  id: string,
  onDelete?: () => void
}) {
  const favoriteId = `favorite_${id}`;
  const [
    favorite,
    setFavorite
  ] = useStickyState(false, favoriteId);
  let onDel = () => {}
  if (onDelete) {
    onDel = onDelete
  }
  return (
    <span className={styles.controls}>
      <span>{id}</span>
      <span
        className={`${styles.card} ${styles.buttonsFavorite}`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id={favoriteId}
          type="checkbox"
          checked={favorite}
          onChange={(e) => setFavorite((e.target as HTMLInputElement).checked)}
        />
        <label
          onClick={(e) => {
            e.stopPropagation();
          }}
          htmlFor={favoriteId}
        >Favorite</label>
      </span>
      <button
        className={`${styles.card} ${styles.buttonsDelete}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (window.confirm('Are you sure you want to delete this?')) {
            fetch(`/conversations/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            }).then((response) => {
              // clear favorite
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(favoriteId)
              }
              // do navigation
              onDel()
            })
          }
        }}
      />
    </span>
  )
}