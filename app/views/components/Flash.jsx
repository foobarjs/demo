import { useView } from 'foobarjs/jsx'

export default function Flash() {
  const { flash } = useView()
  return (
    <>
      {flash.success && <div class="alert alert-success">{flash.success}</div>}
      {flash.error && <div class="alert alert-danger">{flash.error}</div>}
      {flash.warning && <div class="alert alert-warning">{flash.warning}</div>}
    </>
  )
}
