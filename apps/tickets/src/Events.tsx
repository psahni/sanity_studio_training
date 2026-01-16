import {useDocuments} from '@sanity/sdk-react'
import {Container, Stack, Text} from '@sanity/ui'
import {Suspense} from 'react'
import {Event} from './Event'

export function Events() {
  const {data: events} = useDocuments({
    documentType: 'event',
  })

  return (
    <Container width={2}>
      <Stack space={3} padding={4}>
        {events?.map((event) => (
          <Suspense key={event.documentId} fallback={<Text>Loading...</Text>}>
            <Event key={event.documentId} {...event} />
          </Suspense>
        ))}
      </Stack>
    </Container>
  )
}

