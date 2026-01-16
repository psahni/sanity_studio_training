import Link from "next/link";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/live";

const EVENTS_QUERY = defineQuery(`*[
  _type == "event"
  && defined(slug.current)
  && date > now()
]|order(date asc){_id, name, slug, date}`);

export default async function IndexPage() {
  const { data: events } = await sanityFetch({ query: EVENTS_QUERY });

  return (
    <main className="flex min-h-screen flex-col p-24 gap-12">
      <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
        Events
      </h1>
      <ul className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {events.map((event) => (
          <li
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/20"
            key={event._id}
          >
            <Link
              className="hover:underline block"
              href={`/events/${event?.slug?.current}`}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {event?.name}
              </h2>
              {event?.date && (
                <p className="text-gray-500 dark:text-gray-400">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
