import {DocumentHandle} from '@sanity/sdk'
import {useDocument, useEditDocument} from '@sanity/sdk-react'
import {Box, Button, TextInput} from '@sanity/ui'

function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function TicketURL(props: DocumentHandle) {
  const {data: value} = useDocument<string>({
    ...props,
    path: 'tickets',
  })
  const editTicketURL = useEditDocument({
    ...props,
    path: 'tickets',
  })

  const isValid = isValidUrl(value || '')

  return (
    <>
      <Box flex={1}>
        <TextInput
          type="url"
          value={value || ''}
          onChange={(event) => editTicketURL(event.currentTarget.value)}
        />
      </Box>
      <Button
        href={value}
        target="_blank"
        disabled={!isValid}
        text="Open"
        tone="primary"
        mode="ghost"
        as="a"
      />
    </>
  )
}
