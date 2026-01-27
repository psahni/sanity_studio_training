import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Story Schema
 * Main content schema containing story-level data, persona-specific content, and articles.
 *
 * Structure:
 * - Story level: story_id, headline, publishedAt, topics, createdAt
 * - Persona info: Array of persona-specific headlines and summaries
 * - Article data: Array of source articles with metadata
 */
export const storySchema = defineType({
  name: "story",
  title: "Story",
  type: "document",
  icon: () => "📰",
  fields: [
    // ============================================
    // STORY LEVEL DATA
    // ============================================

    // Unique identifier for this story
    defineField({
      name: "storyId",
      title: "Story ID",
      type: "string",
      description: "Unique identifier for this story (e.g., story-001)",
      validation: (rule) => rule.required(),
    }),

    // General headline for the story
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      description: "Main headline for the story",
      validation: (rule) => rule.required(),
    }),

    // Published timestamp
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      description: "When the story was published",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    // Topics/tags for this story
    defineField({
      name: "topics",
      title: "Topics",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description: "Tags/topics (e.g., AI, Healthcare, Technology, Innovation)",
    }),

    // Created timestamp
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When the story was created",
      validation: (rule) => rule.required(),
    }),

    // ============================================
    // PERSONA INFO - Persona-specific content
    // ============================================
    defineField({
      name: "personaInfo",
      title: "Persona Info",
      type: "array",
      description: "Persona-specific story headlines and summaries",
      of: [
        defineArrayMember({
          type: "object",
          name: "personaContent",
          title: "Persona Content",
          fields: [
            defineField({
              name: "personaId",
              title: "Persona ID",
              type: "string",
              description:
                "Unique persona identifier (e.g., persona-investors)",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "personaName",
              title: "Persona Name",
              type: "string",
              description: "Display name (e.g., Independent Investors)",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "storyId",
              title: "Story ID",
              type: "string",
              description: "Reference to parent story ID",
            }),
            defineField({
              name: "headline",
              title: "Headline",
              type: "string",
              description: "Persona-specific headline",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "summary",
              title: "Summary",
              type: "text",
              rows: 4,
              description: "Persona-specific summary",
            }),
            defineField({
              name: "moderation",
              title: "Moderation",
              type: "object",
              description: "Content moderation information",
              fields: [
                defineField({
                  name: "score",
                  title: "Score",
                  type: "number",
                  description: "Moderation score (e.g., 1 for approved)",
                }),
                defineField({
                  name: "reasoning",
                  title: "Reasoning",
                  type: "text",
                  rows: 3,
                  description: "Explanation for moderation decision",
                }),
                defineField({
                  name: "flaggedRules",
                  title: "Flagged Rules",
                  type: "array",
                  of: [{ type: "string" }],
                  options: {
                    layout: "tags",
                  },
                  description: "List of rules that were flagged",
                }),
              ],
            }),
            defineField({
              name: "questionAnswers",
              title: "Question & Answers",
              type: "array",
              description: "Q&A pairs related to this persona's perspective",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "questionAnswer",
                  title: "Question & Answer",
                  fields: [
                    defineField({
                      name: "question",
                      title: "Question",
                      type: "text",
                      rows: 2,
                      description: "The question being asked",
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: "answer",
                      title: "Answer",
                      type: "text",
                      rows: 4,
                      description: "The answer to the question",
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      question: "question",
                    },
                    prepare({ question }) {
                      return {
                        title: question || "No question",
                        subtitle: "Q&A",
                      };
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              personaName: "personaName",
              headline: "headline",
              qaCount: "questionAnswers.length",
            },
            prepare({ personaName, headline, qaCount }) {
              return {
                title: personaName || "Unknown Persona",
                subtitle: `${headline || "No headline"}${qaCount ? ` • ${qaCount} Q&A` : ""}`,
              };
            },
          },
        }),
      ],
    }),

    // ============================================
    // ARTICLE DATA - Source articles
    // ============================================
    defineField({
      name: "articleData",
      title: "Article Data",
      type: "array",
      description: "Source articles that make up this story",
      of: [
        defineArrayMember({
          type: "object",
          name: "article",
          title: "Article",
          fields: [
            defineField({
              name: "articleId",
              title: "Article ID",
              type: "number",
              description: "Unique article identifier",
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              description: "Article headline/title",
            }),
            defineField({
              name: "publicationDate",
              title: "Publication Date",
              type: "string",
              description: "Date the article was published (e.g., 2025-02-01)",
            }),
            defineField({
              name: "companyNames",
              title: "Company Names",
              type: "array",
              of: [{ type: "string" }],
              options: {
                layout: "tags",
              },
              description: "Companies mentioned in the article",
            }),
            defineField({
              name: "stockSymbols",
              title: "Stock Symbols",
              type: "array",
              of: [{ type: "string" }],
              options: {
                layout: "tags",
              },
              description: "Stock ticker symbols (e.g., PFE, MRNA)",
            }),
            defineField({
              name: "industries",
              title: "Industries",
              type: "array",
              of: [{ type: "string" }],
              options: {
                layout: "tags",
              },
              description:
                "Industries related to the article (e.g., Automotive, Retail, AI)",
            }),
            defineField({
              name: "newsType",
              title: "News Type",
              type: "array",
              of: [{ type: "string" }],
              options: {
                layout: "tags",
              },
              description:
                "Type of news (e.g., Technology, Government, Markets, Business)",
            }),
          ],
          preview: {
            select: {
              title: "title",
              articleId: "articleId",
              companies: "companyNames",
            },
            prepare({ title, articleId, companies }) {
              return {
                title: title || `Article ${articleId || "Unknown"}`,
                subtitle: companies?.slice(0, 3).join(", ") || "",
              };
            },
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: "Published, Newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Published, Oldest",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
    },
    {
      title: "Created, Newest",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      headline: "headline",
      storyId: "storyId",
      publishedAt: "publishedAt",
      topics: "topics",
      personaCount: "personaInfo.length",
      articleCount: "articleData.length",
    },
    prepare({
      headline,
      storyId,
      publishedAt,
      topics,
      personaCount,
      articleCount,
    }) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString()
        : "";
      const topicList = topics?.slice(0, 3).join(", ") || "";

      return {
        title: headline || storyId || "Untitled Story",
        subtitle: `📅 ${date} • 👥 ${personaCount || 0} personas • 📄 ${articleCount || 0} articles${topicList ? ` • ${topicList}` : ""}`,
      };
    },
  },
});
