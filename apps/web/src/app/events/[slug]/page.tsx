import { defineQuery, PortableText } from "next-sanity";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { sanityFetch } from "@/sanity/live";
import { urlFor } from "@/sanity/image";
import { LikeDislikeButtons } from "./LikeDislikeButtons";

const EVENT_QUERY = defineQuery(`*[
    _type == "event" &&
    slug.current == $slug
  ][0]{
  ...,
  "date": coalesce(date, now()),
  "doorsOpen": coalesce(doorsOpen, 0),
  "likes": coalesce(likes, 0),
  "dislikes": coalesce(dislikes, 0),
  headline->,
  venue->
}`);

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const { data: event } = await sanityFetch({
    query: EVENT_QUERY,
    params: resolvedParams,
  });
  if (!event) {
    notFound();
  }
  const {
    name,
    date,
    headline,
    details,
    format,
    doorsOpen,
    venue,
    tickets,
    likes,
    dislikes,
  } = event;

  const eventDate = new Date(date).toDateString();
  const eventTime = new Date(date).toLocaleTimeString();
  const doorsOpenTime = new Date(
    new Date(date).getTime() - doorsOpen * 60000
  ).toLocaleTimeString();

  const imageUrl = headline?.photo?.asset
    ? urlFor(headline.photo)
        .height(310)
        .width(550)
        .quality(80)
        .auto("format")
        .url()
    : "https://placehold.co/550x310/png";

  return (
    <main className="container mx-auto grid gap-12 p-12">
      <div className="mb-4">
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to events
        </Link>
      </div>
      <div className="grid items-top gap-12 sm:grid-cols-2">
        <Image
          src={imageUrl}
          alt={name || "Event"}
          className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
          height="310"
          width="550"
        />
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-4">
            {format ? (
              <div className="inline-block rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 capitalize">
                {format.replace("-", " ")}
              </div>
            ) : null}
            {name ? (
              <h1 className="text-4xl font-bold tracking-tighter mb-8 text-gray-900 dark:text-white">
                {name}
              </h1>
            ) : null}
            {headline?.name ? (
              <dl className="grid grid-cols-2 gap-1 text-sm font-medium sm:gap-2 lg:text-base text-gray-700 dark:text-gray-300">
                <dd className="font-semibold text-gray-900 dark:text-white">
                  Artist
                </dd>
                <dt>{headline?.name}</dt>
              </dl>
            ) : null}
            <dl className="grid grid-cols-2 gap-1 text-sm font-medium sm:gap-2 lg:text-base text-gray-700 dark:text-gray-300">
              <dd className="font-semibold text-gray-900 dark:text-white">
                Date
              </dd>
              <div>
                {eventDate && <dt>{eventDate}</dt>}
                {eventTime && <dt>{eventTime}</dt>}
              </div>
            </dl>
            {doorsOpenTime ? (
              <dl className="grid grid-cols-2 gap-1 text-sm font-medium sm:gap-2 lg:text-base text-gray-700 dark:text-gray-300">
                <dd className="font-semibold text-gray-900 dark:text-white">
                  Doors Open
                </dd>
                <div className="grid gap-1">
                  <dt>Doors Open</dt>
                  <dt>{doorsOpenTime}</dt>
                </div>
              </dl>
            ) : null}
            {venue?.name ? (
              <dl className="grid grid-cols-2 gap-1 text-sm font-medium sm:gap-2 lg:text-base text-gray-700 dark:text-gray-300">
                <div className="flex items-start">
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    Venue
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt>{venue.name}</dt>
                </div>
              </dl>
            ) : null}
          </div>
          {details && details.length > 0 && (
            <div className="prose max-w-none prose-gray dark:prose-invert">
              <PortableText value={details} />
            </div>
          )}
          {tickets && (
            <a
              className="flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 p-4 text-white transition-colors"
              href={tickets}
            >
              Buy Tickets
            </a>
          )}
          <LikeDislikeButtons
            slug={resolvedParams.slug}
            initialLikes={likes || 0}
            initialDislikes={dislikes || 0}
          />
        </div>
      </div>
    </main>
  );
}
