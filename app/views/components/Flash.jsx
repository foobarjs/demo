import { useView } from 'foobarjs/jsx'

export default function Flash() {
  const { flash } = useView()
  const messages = []
  if (flash?.success) messages.push({ type: 'success', msg: flash.success })
  if (flash?.error)   messages.push({ type: 'error',   msg: flash.error })
  if (flash?.warning) messages.push({ type: 'info',    msg: flash.warning })
  if (flash?.info)    messages.push({ type: 'info',    msg: flash.info })
  if (messages.length === 0) return null
  return (
    <div class="container">
      {messages.map(m => <div class={`flash ${m.type}`}>{m.msg}</div>)}
    </div>
  )
}
