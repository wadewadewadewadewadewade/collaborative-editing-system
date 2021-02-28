import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Back ({ href } : { href?: string }) {
  return (
    <Link href={href || '/'}>
      <a className={`${styles.buttonBack}`}>&#8592;</a>
    </Link>
  )
}