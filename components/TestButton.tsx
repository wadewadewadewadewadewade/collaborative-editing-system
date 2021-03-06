import { IMutation } from "../utils/db/mutations"

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

export default function TestButton({
  mutation
}: {
  mutation: IMutation
}) {
  const parts = []
  parts.push(mutation.author === 'alice' ? 'A' : 'B')
  parts.push(`(${mutation.origin.bob}, ${mutation.origin.alice})`)
  parts.push(mutation.data.type === 'insert' ? 'INS' : 'DEL')
  parts.push(`${mutation.data.index}`)
  parts.push(mutation.data.type === 'insert' ? `:'${mutation.data.text}'` : `:${mutation.data.length}`)
  return (
    <button onClick={async (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log(await insertMutation(mutation))
    }}>{parts.join('')}</button>
  )
}