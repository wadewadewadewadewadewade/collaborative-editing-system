import { useState, useEffect, useContext } from 'react'
import styles from '../styles/Home.module.css'
import { LoadingIndicatorContext } from '../pages/_app'
import { fetchWithTimeout } from '../utils'

// below borrowed from here: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
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
  const { setIsLoading } = useContext(LoadingIndicatorContext)
  let afterDelete = () => {}
  if (onDelete) {
    afterDelete = onDelete
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
          title="Favorite this Conversation"
          onClick={(e) => {
            e.stopPropagation();
          }}
          htmlFor={favoriteId}
        >Favorite</label>
      </span>
      <button
        title="Delete this Conversation"
        className={`${styles.card} ${styles.buttonsDelete}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (window.confirm('Are you sure you want to delete this?')) {
            setIsLoading(true)
            // timeout here because vercel DELETE seem to time out
            fetchWithTimeout(`/conversations/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            }).finally(() => {
              // clear favorite
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(favoriteId)
              }
              // do navigation
              afterDelete()
              setIsLoading(false)
            })
          }
        }}
      />
    </span>
  )
}