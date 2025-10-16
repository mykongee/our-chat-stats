import DOMPurify from 'dompurify'

/**
 * Instagram Chat Parser
 *
 * Parses Instagram HTML chat exports into structured data.
 * Based on analysis of Instagram's HTML structure from October 2025.
 *
 * Structure identified:
 * - Message container: div.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder
 * - Sender: h2._3-95._2pim._a6-h._a6-i
 * - Content: div._3-95._a6-p
 * - Timestamp: div._3-94._a6-o
 */

/**
 * Parse Instagram HTML chat export
 * @param {File} file - HTML file from Instagram export
 * @returns {Promise<Object>} Parsed chat data
 */
export async function parseChatHTML(file) {
  try {
    // Step 1: Read file content
    const rawHTML = await file.text()

    // Step 2: Sanitize HTML (security layer)
    const cleanHTML = DOMPurify.sanitize(rawHTML, {
      ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'h1', 'h2', 'h3', 'p', 'span', 'a', 'img', 'audio', 'ul', 'li'],
      ALLOWED_ATTR: ['class', 'href', 'src', 'target'],
    })

    // Step 3: Parse HTML into DOM
    const parser = new DOMParser()
    const doc = parser.parseFromString(cleanHTML, 'text/html')

    // Step 4: Extract conversation title
    const titleElement = doc.querySelector('header h1')
    const conversationTitle = titleElement ? titleElement.textContent.trim() : 'Unknown'

    // Step 5: Extract messages
    const messageNodes = doc.querySelectorAll('.pam._3-95._2ph-._a6-g.uiBoxWhite.noborder')
    const messages = []

    for (const node of messageNodes) {
      const message = parseMessageNode(node)
      if (message) {
        messages.push(message)
      }
    }

    // Step 6: Extract metadata
    const participants = extractParticipants(messages)
    const dateRange = extractDateRange(messages)

    // Step 7: Calculate basic statistics
    const statistics = calculateStatistics(messages)

    return {
      meta: {
        conversationTitle,
        totalMessages: messages.length,
        participants,
        dateRange,
        parsedAt: new Date(),
      },
      messages,
      statistics,
    }
  } catch (error) {
    console.error('Error parsing chat HTML:', error)
    throw new Error(`Failed to parse chat file: ${error.message}`)
  }
}

/**
 * Parse a single message node
 * @param {Element} node - Message container DOM node
 * @returns {Object|null} Parsed message object
 */
function parseMessageNode(node) {
  try {
    // Extract sender
    const senderElement = node.querySelector('h2._3-95._2pim._a6-h._a6-i')
    if (!senderElement) return null

    const sender = senderElement.textContent.trim()

    // Extract content
    const contentElement = node.querySelector('div._3-95._a6-p')
    let content = ''

    if (contentElement) {
      // Get all text content, excluding nested divs that might contain metadata
      const textNodes = getDirectTextContent(contentElement)
      content = textNodes.join(' ').trim()
    }

    // Extract timestamp
    const timestampElement = node.querySelector('div._3-94._a6-o')
    let timestamp = null

    if (timestampElement) {
      const timestampText = timestampElement.textContent.trim()
      timestamp = parseTimestamp(timestampText)
    }

    // Extract emojis from content
    const emojis = extractEmojis(content)

    // Determine message type
    const type = determineMessageType(content, node)

    return {
      sender,
      content,
      timestamp,
      emojis,
      type,
    }
  } catch (error) {
    console.warn('Error parsing message node:', error)
    return null
  }
}

/**
 * Get direct text content from an element, excluding deeply nested content
 * @param {Element} element - DOM element
 * @returns {string[]} Array of text strings
 */
function getDirectTextContent(element) {
  const texts = []

  // Get immediate div children
  const divs = element.querySelectorAll('div')

  for (const div of divs) {
    const text = div.textContent.trim()
    if (text && !text.startsWith('You sent an attachment') && !text.startsWith('Liked a message')) {
      texts.push(text)
      break // Usually the first div contains the actual message
    }
  }

  return texts
}

/**
 * Extract emojis from text using Unicode property escapes
 * @param {string} text - Text to extract emojis from
 * @returns {string[]} Array of emoji characters
 */
function extractEmojis(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  return text.match(emojiRegex) || []
}

/**
 * Parse Instagram timestamp format
 * @param {string} timestampText - Timestamp string (e.g., "Oct 16, 2025 5:28 am")
 * @returns {Date|null} Parsed date object
 */
function parseTimestamp(timestampText) {
  try {
    // Instagram format: "Oct 16, 2025 5:28 am"
    return new Date(timestampText)
  } catch (error) {
    console.warn('Failed to parse timestamp:', timestampText)
    return null
  }
}

/**
 * Determine message type (text, attachment, call, etc.)
 * @param {string} content - Message content
 * @param {Element} node - Message DOM node
 * @returns {string} Message type
 */
function determineMessageType(content, node) {
  if (content.includes('You sent an attachment') || content.includes('sent an attachment')) {
    return 'attachment'
  }
  if (content.includes('Audio call ended') || content.includes('started an audio call')) {
    return 'call'
  }
  if (content.includes('Liked a message')) {
    return 'reaction'
  }
  if (node.querySelector('img')) {
    return 'image'
  }
  if (node.querySelector('audio')) {
    return 'audio'
  }
  if (content.length === 0) {
    return 'empty'
  }
  return 'text'
}

/**
 * Extract unique participants from messages
 * @param {Array} messages - Array of message objects
 * @returns {string[]} Array of participant names
 */
function extractParticipants(messages) {
  const participants = new Set()

  for (const message of messages) {
    if (message.sender) {
      participants.add(message.sender)
    }
  }

  return Array.from(participants)
}

/**
 * Extract date range from messages
 * @param {Array} messages - Array of message objects
 * @returns {Object} { start: Date, end: Date }
 */
function extractDateRange(messages) {
  const validTimestamps = messages
    .map(m => m.timestamp)
    .filter(t => t instanceof Date && !isNaN(t))

  if (validTimestamps.length === 0) {
    return { start: null, end: null }
  }

  const sortedTimestamps = validTimestamps.sort((a, b) => a - b)

  return {
    start: sortedTimestamps[0],
    end: sortedTimestamps[sortedTimestamps.length - 1],
  }
}

/**
 * Calculate basic statistics from messages
 * @param {Array} messages - Array of message objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(messages) {
  const messageCountByUser = {}
  const emojiCountByUser = {}
  const totalEmojiCount = {}

  for (const message of messages) {
    const sender = message.sender

    // Count messages per user
    messageCountByUser[sender] = (messageCountByUser[sender] || 0) + 1

    // Count emojis
    if (!emojiCountByUser[sender]) {
      emojiCountByUser[sender] = {}
    }

    for (const emoji of message.emojis || []) {
      // Per-user emoji count
      emojiCountByUser[sender][emoji] = (emojiCountByUser[sender][emoji] || 0) + 1

      // Total emoji count
      totalEmojiCount[emoji] = (totalEmojiCount[emoji] || 0) + 1
    }
  }

  // Create sorted topEmojis array
  const topEmojis = Object.entries(totalEmojiCount)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)

  return {
    messageCountByUser,
    emojiCountByUser,
    totalEmojiCount,
    topEmojis,
  }
}

/**
 * Composable for chat parsing
 */
export function useChatParser() {
  return {
    parseChatHTML,
  }
}
