import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Back ({ href } : { href?: string }) {
  return (
    <Link href={href || '/'}>
      <a title="Go Back" className={`${styles.card} ${styles.buttonBack}`}>&#8592;</a>
    </Link>
  )
}