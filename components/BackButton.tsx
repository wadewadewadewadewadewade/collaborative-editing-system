import Link from 'next/link'

export default function Back ({ href } : { href?: string }) {
  return (
    <Link href={href || '/'}>
      <a className="buttons-general buttons-back">&#8592;</a>
    </Link>
  )
}