import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      S.divider().title('Events'),
      S.listItem()
        .title('Upcoming')
        .schemaType('event')
        .child(S.documentList().title('Upcoming Events').filter('date >= now()')),
      S.listItem()
        .title('Past')
        .schemaType('event')
        .child(S.documentList().title('Past Events').filter('date < now()')),
      S.divider().title('Artists & Venues'),
      S.documentTypeListItem('artist').title('Artists'),
      S.documentTypeListItem('venue').title('Venues'),
    ])
