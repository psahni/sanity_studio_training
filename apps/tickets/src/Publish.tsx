import {
  DocumentHandle,
  publishDocument,
  useApplyDocumentActions,
  useDocument,
} from '@sanity/sdk-react'
import {Button} from '@sanity/ui'

export function Publish(props: DocumentHandle) {
  const {data: _id} = useDocument({...props, path: '_id'})
  const isDraft = _id?.startsWith('drafts.')
  const apply = useApplyDocumentActions()
  const publish = () => apply(publishDocument(props))

  return (
    <Button
      text="Publish"
      disabled={!isDraft}
      tone="positive"
      mode="ghost"
      onClick={publish}
    />
  )
}
