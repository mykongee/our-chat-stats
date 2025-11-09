/**
 * Pure functions to transform chat data into Chart.js-compatible formats
 * All functions are pure - no side effects, same input always produces same output
 */

/**
 * Transform message count by user into chart data
 * @param {Object} messageCountByUser - { username: count }
 * @returns {Object} { labels: string[], data: number[] }
 */
export function transformMessageCountByUser(messageCountByUser) {
  if (!messageCountByUser || Object.keys(messageCountByUser).length === 0) {
    return { labels: [], data: [] }
  }

  const entries = Object.entries(messageCountByUser)
  const labels = entries.map(([username]) => username)
  const data = entries.map(([, count]) => count)

  return { labels, data }
}

/**
 * Transform emoji counts into chart data (for pie/doughnut charts)
 * @param {Object} emojiCount - { emoji: count }
 * @param {number} limit - Maximum number of emojis to include
 * @param {Set} ignoredEmojis - Set of emojis to exclude
 * @returns {Object} { labels: string[], data: number[] }
 */
export function transformEmojiCount(emojiCount, limit = 10, ignoredEmojis = new Set()) {
  if (!emojiCount || Object.keys(emojiCount).length === 0) {
    return { labels: [], data: [] }
  }

  // Filter out ignored emojis
  const filteredEntries = Object.entries(emojiCount).filter(
    ([emoji]) => !ignoredEmojis.has(emoji)
  )

  // Sort by count descending
  const sortedEntries = filteredEntries.sort((a, b) => b[1] - a[1])

  // Take top N
  const topEntries = sortedEntries.slice(0, limit)

  const labels = topEntries.map(([emoji]) => emoji)
  const data = topEntries.map(([, count]) => count)

  return { labels, data }
}

/**
 * Transform emoji count by user into comparative chart data
 * @param {Object} emojiCountByUser - { username: { emoji: count } }
 * @param {string[]} topEmojis - Array of top emojis to display
 * @returns {Object} { labels: string[], datasets: Array<{username, data}> }
 */
export function transformEmojiByUser(emojiCountByUser, topEmojis = []) {
  if (!emojiCountByUser || Object.keys(emojiCountByUser).length === 0) {
    return { labels: [], datasets: [] }
  }

  const labels = topEmojis

  const datasets = Object.entries(emojiCountByUser).map(([username, emojiCounts]) => {
    const data = topEmojis.map(emoji => emojiCounts[emoji] || 0)
    return { username, data }
  })

  return { labels, datasets }
}

/**
 * Transform messages into timeline data (messages over time)
 * @param {Array} messages - Array of message objects with timestamps
 * @param {string} groupBy - 'hour', 'day', 'week', 'month'
 * @returns {Object} { labels: string[], data: number[] }
 */
export function transformMessagesTimeline(messages, groupBy = 'day') {
  if (!messages || messages.length === 0) {
    return { labels: [], data: [] }
  }

  const groupedData = new Map()

  messages.forEach(message => {
    if (!message.timestamp) return

    const date = new Date(message.timestamp)
    let key

    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:00`
        break
      case 'day':
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
        break
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}`
        break
      default:
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
    }

    groupedData.set(key, (groupedData.get(key) || 0) + 1)
  })

  // Sort by key (chronological order)
  const sortedEntries = Array.from(groupedData.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  const labels = sortedEntries.map(([key]) => key)
  const data = sortedEntries.map(([, count]) => count)

  return { labels, data }
}

/**
 * Transform messages into activity by day of week
 * @param {Array} messages - Array of message objects with timestamps
 * @returns {Object} { labels: string[], data: number[] }
 */
export function transformActivityByDayOfWeek(messages) {
  if (!messages || messages.length === 0) {
    return { labels: [], data: [] }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const counts = new Array(7).fill(0)

  messages.forEach(message => {
    if (!message.timestamp) return
    const date = new Date(message.timestamp)
    const dayIndex = date.getDay()
    counts[dayIndex]++
  })

  return { labels: days, data: counts }
}

/**
 * Transform messages into activity by hour of day
 * @param {Array} messages - Array of message objects with timestamps
 * @returns {Object} { labels: string[], data: number[] }
 */
export function transformActivityByHourOfDay(messages) {
  if (!messages || messages.length === 0) {
    return { labels: [], data: [] }
  }

  const hours = Array.from({ length: 24 }, (_, i) => `${padZero(i)}:00`)
  const counts = new Array(24).fill(0)

  messages.forEach(message => {
    if (!message.timestamp) return
    const date = new Date(message.timestamp)
    const hour = date.getHours()
    counts[hour]++
  })

  return { labels: hours, data: counts }
}

/**
 * Transform messages into activity by user over time
 * @param {Array} messages - Array of message objects with timestamps and senders
 * @param {string} groupBy - 'day', 'week', 'month'
 * @returns {Object} { labels: string[], datasets: Array<{username, data}> }
 */
export function transformActivityByUserOverTime(messages, groupBy = 'day') {
  if (!messages || messages.length === 0) {
    return { labels: [], datasets: [] }
  }

  // Group messages by time period and user
  const timeUserMap = new Map() // Map<timeKey, Map<username, count>>

  messages.forEach(message => {
    if (!message.timestamp || !message.sender) return

    const date = new Date(message.timestamp)
    let key

    switch (groupBy) {
      case 'day':
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
        break
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}`
        break
      default:
        key = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
    }

    if (!timeUserMap.has(key)) {
      timeUserMap.set(key, new Map())
    }

    const userMap = timeUserMap.get(key)
    userMap.set(message.sender, (userMap.get(message.sender) || 0) + 1)
  })

  // Sort time keys chronologically
  const sortedTimeKeys = Array.from(timeUserMap.keys()).sort((a, b) => a.localeCompare(b))

  // Get all unique users
  const users = new Set()
  messages.forEach(message => {
    if (message.sender) users.add(message.sender)
  })

  // Create datasets for each user
  const datasets = Array.from(users).map(username => {
    const data = sortedTimeKeys.map(timeKey => {
      const userMap = timeUserMap.get(timeKey)
      return userMap?.get(username) || 0
    })
    return { username, data }
  })

  return { labels: sortedTimeKeys, datasets }
}

/**
 * Helper: Pad number with zero
 */
function padZero(num) {
  return num.toString().padStart(2, '0')
}

/**
 * Helper: Get ISO week key for a date
 */
function getWeekKey(date) {
  const year = date.getFullYear()
  const weekNum = getWeekNumber(date)
  return `${year}-W${padZero(weekNum)}`
}

/**
 * Helper: Get ISO week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
