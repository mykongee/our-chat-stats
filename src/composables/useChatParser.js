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
 * Extract emojis from text, properly handling ZWJ sequences and compound emojis
 * @param {string} text - Text to extract emojis from
 * @returns {string[]} Array of emoji characters (including compound emojis)
 */
export function extractEmojis(text) {
  if (!text || typeof text !== 'string') {
    return []
  }

  // More conservative regex that properly handles:
  // - Emojis that display as emojis by default (\p{Emoji_Presentation})
  // - Extended pictographics (newer emojis)
  // - ZWJ sequences (compound emojis like family, professions, directional faces)
  // - Skin tone modifiers
  // - Variation selectors (\uFE0F forces emoji rendering)
  // - Arrows block (U+2190-U+21FF) for directional emojis like 🙂‍↕️
  //
  // Key: We require characters to EITHER:
  // 1. Have Emoji_Presentation property (renders as emoji by default), OR
  // 2. Be followed by variation selector \uFE0F (forces emoji rendering)
  //
  // This prevents plain digits/# from being captured as emojis
  const emojiRegex = /(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2190}-\u{21FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}])(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F\u20E3?)?(?:\u200D(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2190}-\u{21FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}])(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F)?)*/gu

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
