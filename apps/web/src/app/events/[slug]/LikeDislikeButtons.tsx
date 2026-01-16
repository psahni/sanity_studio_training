"use client";

import { useState } from "react";

interface LikeDislikeButtonsProps {
  slug: string;
  initialLikes: number;
  initialDislikes: number;
}

export const LikeDislikeButtons = ({
  slug,
  initialLikes,
  initialDislikes,
}: LikeDislikeButtonsProps) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const handleLike = async () => {
    if (isLiking || isDisliking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/events/${slug}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
      }
    } catch (error) {
      console.error("Error liking event:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isLiking || isDisliking) return;

    setIsDisliking(true);
    try {
      const response = await fetch(`/api/events/${slug}/dislike`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setDislikes(data.dislikes);
      }
    } catch (error) {
      console.error("Error disliking event:", error);
    } finally {
      setIsDisliking(false);
    }
  };

  const handleKeyDownLike = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLike();
    }
  };

  const handleKeyDownDislike = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDislike();
    }
  };

  return (
    <div className="flex items-center gap-4 mt-6">
      <button
        type="button"
        onClick={handleLike}
        onKeyDown={handleKeyDownLike}
        disabled={isLiking || isDisliking}
        aria-label={`Like this event. Current likes: ${likes}`}
        tabIndex={0}
        className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span className="font-medium">{likes}</span>
      </button>
      <button
        type="button"
        onClick={handleDislike}
        onKeyDown={handleKeyDownDislike}
        disabled={isLiking || isDisliking}
        aria-label={`Dislike this event. Current dislikes: ${dislikes}`}
        tabIndex={0}
        className="flex items-center gap-2 rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span className="font-medium">{dislikes}</span>
      </button>
    </div>
  );
};
