import { action, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { internal, api } from './_generated/api'
import * as cheerio from 'cheerio'

export const scrapeAndEmbedLink = action({
  args: {
    linkId: v.id('links'),
  },
  handler: async (ctx, args) => {
    // Fetch the link document
    const link = await ctx.runQuery(internal.links.getLinkById, {
      linkId: args.linkId,
    })
    if (!link) {
      console.error(`Link not found: ${args.linkId}`)
      return
    }

    try {
      // Scrape content
      const response = await fetch(link.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const html = await response.text()
      const $ = cheerio.load(html)

      // Clean up script and style tags
      $('script, style, noscript, nav, footer, iframe, object').remove()

      const extractedText = $('body').text().replace(/\s+/g, ' ').trim()
      const truncatedText = extractedText.slice(0, 10000) // Optional: avoid massive payloads

      // Update link with scraped content
      await ctx.runMutation(internal.scrape.updateScrapedContent, {
        linkId: args.linkId,
        scrapedContent: truncatedText,
      })

      const combinedText = `${link.title} ${link.description} ${truncatedText}`
      await ctx.runAction(api.embeddings.generateLinkEmbedding, {
        linkId: args.linkId,
        content: combinedText, // Uses Google Gen AI embedding
      })
    } catch (error) {
      console.error('Failed to scrape and embed url:', link.url, error)

      const fallbackText = `${link.title} ${link.description}`
      await ctx.runAction(api.embeddings.generateLinkEmbedding, {
        linkId: args.linkId,
        content: fallbackText,
      })
    }
  },
})

export const updateScrapedContent = internalMutation({
  args: {
    linkId: v.id('links'),
    scrapedContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      scrapedContent: args.scrapedContent,
    })
  },
})
