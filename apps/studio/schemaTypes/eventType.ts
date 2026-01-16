import {defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons'
import {DoorsOpenInput} from './components/DoorsOpenInput'

export const eventType = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    {name: 'details', title: 'Details'},
    {name: 'editorial', title: 'Editorial'},
  ],
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      group: ['details'],
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: ['details'],
      options: {
        source: 'name'
      },
      validation: (rule) => rule.required().error(`Required to generate a page on the website`),
      hidden: ({document}) => !document?.name,
      readOnly: ({value, currentUser}) => {
        // Anyone can set the initial slug
        if (!value) {
          return false
        }

        const isAdmin = currentUser?.roles.some((role) => role.name === 'administrator')

        // Only admins can change the slug
        return !isAdmin
      },
    }),
    defineField({
      name: 'eventType',
      type: 'string',
      group: ['details'],
      deprecated: {
        reason: 'Use the "Event format" field instead.'
      },
      readOnly: true,
      hidden: true, // hide from content creators, but keep it in code
      options: {
        list: ['in-person', 'virtual'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'format',
      type: 'string',
      validation: (rule) => rule.required(),
      options: {
        list: ['in-person', 'virtual'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'date',
      type: 'datetime',
      group: ['details'],
    }),
    defineField({
      name: 'doorsOpen',
      description: 'Number of minutes before the start time for admission',
      type: 'number',
      initialValue: 60,
      group: ['details'],
      components: {
        input: DoorsOpenInput
      }
    }),
    defineField({
      name: 'venue',
      type: 'reference',
      to: [{type: 'venue'}],
      group: ['details'],
      readOnly: ({ value, document }) => !value &&document?.eventType === 'virtual',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (value && context.document?.eventType === 'virtual') {
            return 'Only in-person events can have a venue'
          }
          return true
        })
    }),
    defineField({
      name: 'headline',
      type: 'reference',
      group: ['details'],
      to: [{type: 'artist'}]
    }),
    defineField({
      name: 'image',
      type: 'image',
      group: ['editorial']
    }),
    defineField({
      name: 'details',
      type: 'array',
      of: [{type: 'block'}],
      group: ['editorial']
    }),
    defineField({
      name: 'tickets',
      type: 'url',
      group: ['details']
    }),
    defineField({
      name: 'firstPublished',
      description: 'Automatically set when first published',
      type: 'datetime',
      readOnly: true,
      group: ['details']
    }),
    defineField({
      name: 'likes',
      title: 'Likes',
      type: 'number',
      initialValue: 0,
      group: ['details'],
      description: 'Number of likes for this event'
    }),
    defineField({
      name: 'dislikes',
      title: 'Dislikes',
      type: 'number',
      initialValue: 0,
      group: ['details'],
      description: 'Number of dislikes for this event'
    })
  ],
})
