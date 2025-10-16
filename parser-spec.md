# Instagram Chat Parser - Technical Specification

## Overview

This parser extracts structured data from Instagram HTML chat exports. The primary goal is to transform unstructured HTML into analyzable data, focusing on message counts per user and emoji usage statistics.

---

## Architecture: The Assembly Line

**Analogy:** Think of this parser like an assembly line in a factory:
1. **Raw Materials** (HTML file) enter
2. **Cleaning Station** (DOMPurify) removes contaminants
3. **Disassembly** (DOMParser) breaks it into parts
4. **Inspection** (Extraction logic) identifies useful components
5. **Packaging** (Data structure) organizes the output

**Technical:** We use a multi-stage pipeline that prioritizes security, then parsing, then analysis.

---

## Stage 1: Security Sanitization

### Purpose
Prevent XSS attacks and malicious code execution from untrusted HTML files.

### Implementation
```javascript
// Raw HTML → DOMPurify.sanitize() → Clean HTML
const cleanHTML = DOMPurify.sanitize(rawHTML, config)
```

### Configuration
We use a whitelist approach - only allow safe HTML elements:

**Analogy:** Like a nightclub bouncer with a guest list. Only specific HTML tags get in; everything else is turned away.

**Allowed Elements:**
- `div`, `span`, `p` - Container/text elements
- `a` - Links (for usernames, timestamps)
- `time` - Timestamp data
- `img` - For emoji/media references
- Custom data attributes - For metadata

**Blocked Elements:**
- `<script>` - JavaScript execution
- `<iframe>` - Embedded content
- Event handlers (`onclick`, `onerror`, etc.)
- `<object>`, `<embed>` - Plugin content

### Why This Matters
Even though we process client-side, a malicious HTML file could still execute JavaScript that:
- Steals data from localStorage
- Makes requests to external servers
- Modifies the DOM of our app
- Exfiltrates user data

---

## Stage 2: DOM Parsing

### Purpose
Convert sanitized HTML string into a queryable DOM structure.

### Implementation
```javascript
const parser = new DOMParser()
const doc = parser.parseFromString(cleanHTML, 'text/html')
```

**Analogy:** Like converting a paper book into a digital database. Instead of flipping through pages, you can now query "find all messages from Alice" instantly.

**Technical:** DOMParser creates a Document object - an in-memory representation of HTML that we can traverse and query using standard DOM APIs (querySelector, querySelectorAll, etc.).

### Key Difference from innerHTML
- `DOMParser`: Creates isolated document, **does not execute scripts**
- `innerHTML`: Modifies live DOM, **can execute scripts** (unsafe)

---

## Stage 3: Structure Recognition

### Instagram HTML Structure Analysis

Instagram exports follow a pattern (typical structure):

```html
<div class="conversation">
  <div class="message">
    <div class="sender">Alice</div>
    <div class="content">Hey! 👋</div>
    <div class="timestamp">2024-01-15 10:30</div>
  </div>
  <div class="message">
    <div class="sender">Bob</div>
    <div class="content">Hi there! 😊</div>
    <div class="timestamp">2024-01-15 10:31</div>
  </div>
</div>
```

**Note:** Actual structure may vary. Parser must be resilient to:
- Different class names
- Different nesting levels
- Missing optional fields
- Inconsistent formatting

### Heuristic Approach

**Analogy:** Like a detective looking for clues. We don't know the exact structure, so we look for patterns:
- Text that looks like usernames (short, appears repeatedly)
- Text that looks like timestamps (contains dates/times)
- Containers that repeat (likely message blocks)
- Unicode emoji ranges (message content)

**Technical:** We use multiple CSS selectors with fallbacks:

```javascript
// Try specific selectors first, fall back to heuristics
const messages =
  doc.querySelectorAll('.message') ||
  doc.querySelectorAll('[data-message]') ||
  findMessagesByPattern(doc)
```

---

## Stage 4: Data Extraction

### Message Structure

Each message contains:

```typescript
interface Message {
  sender: string          // Who sent it
  content: string         // The actual message text
  timestamp: Date         // When it was sent
  emojis: string[]       // Array of emoji characters found
}
```

### Extraction Algorithm

**Step 1: Identify Message Containers**

```javascript
function extractMessages(doc) {
  // Strategy 1: Look for class patterns
  let messageNodes = doc.querySelectorAll('.message, [class*="message"]')

  // Strategy 2: Look for repeating structures
  if (messageNodes.length === 0) {
    messageNodes = findRepeatingPatterns(doc)
  }

  return Array.from(messageNodes).map(parseMessage)
}
```

**Step 2: Extract Fields from Each Message**

```javascript
function parseMessage(node) {
  return {
    sender: extractSender(node),
    content: extractContent(node),
    timestamp: extractTimestamp(node),
    emojis: extractEmojis(node)
  }
}
```

### Field Extraction Details

#### Sender Extraction

**Analogy:** Like finding the "From:" line in an email. Look for text that appears at the top of message blocks, is short, and repeats throughout the conversation.

**Strategy:**
1. Look for elements with classes like "sender", "user", "author"
2. Look for bold/strong text at message start
3. Fall back to first text node in message container
4. Normalize (trim whitespace, lowercase for comparison)

#### Content Extraction

**Analogy:** Like highlighting the main text in an article, ignoring headers, footers, and metadata.

**Strategy:**
1. Look for elements with classes like "content", "text", "body"
2. Get `textContent` (includes emoji as Unicode)
3. Exclude timestamp and sender text
4. Preserve emoji characters

#### Timestamp Extraction

**Analogy:** Like finding the postmark on a letter - metadata about when something happened.

**Strategy:**
1. Look for `<time>` elements (semantic HTML)
2. Look for classes containing "time", "date", "timestamp"
3. Look for text matching date patterns (ISO 8601, natural language)
4. Parse using `Date` constructor or date parser library

---

## Stage 5: Emoji Extraction & Counting

### What Are Emojis (Technically)?

**Analogy:** Emojis are like special alphabet letters from a different language. While 'A' has a Unicode code point of U+0041, '😊' has code point U+1F60A.

**Technical:** Emojis are Unicode characters in specific ranges:
- Basic Emoticons: U+1F600 - U+1F64F
- Supplementary Symbols: U+1F300 - U+1F5FF
- Transport & Map: U+1F680 - U+1F6FF
- Plus many others (flags, skin tones, ZWJ sequences)

### Emoji Detection Algorithm

**Challenge:** Some emojis are single characters (👋), others are sequences (👨‍👩‍👧‍👦 = man + ZWJ + woman + ZWJ + girl + ZWJ + boy).

**Solution:** Use regex with Unicode property escapes:

```javascript
function extractEmojis(text) {
  // Modern approach (ES2018+)
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  return text.match(emojiRegex) || []
}
```

**Analogy:** Like using a magnet that only attracts specific types of metal. The regex "attracts" characters that have the emoji property, ignoring regular letters.

### Counting Strategy

We want two types of counts:

**1. Per-User Emoji Count**
```javascript
{
  "Alice": { "👋": 3, "😊": 5, "❤️": 2 },
  "Bob": { "👍": 4, "😂": 7 }
}
```

**2. Total Emoji Count**
```javascript
{
  "👋": 3,
  "😊": 5,
  "❤️": 2,
  "👍": 4,
  "😂": 7
}
```

### Implementation

```javascript
function countEmojis(messages) {
  const byUser = {}
  const total = {}

  for (const message of messages) {
    const sender = message.sender

    // Initialize user object if needed
    if (!byUser[sender]) {
      byUser[sender] = {}
    }

    // Count each emoji
    for (const emoji of message.emojis) {
      // Per-user count
      byUser[sender][emoji] = (byUser[sender][emoji] || 0) + 1

      // Total count
      total[emoji] = (total[emoji] || 0) + 1
    }
  }

  return { byUser, total }
}
```

**Analogy:** Like sorting M&Ms by color into different jars (total count) and also tracking which friend gave you which colors (per-user count).

---

## Stage 6: Data Structure Output

### Final Output Format

```javascript
{
  meta: {
    totalMessages: 145,
    participants: ["Alice", "Bob"],
    dateRange: {
      start: Date,
      end: Date
    },
    parsedAt: Date
  },

  messages: [
    {
      sender: "Alice",
      content: "Hey! 👋",
      timestamp: Date,
      emojis: ["👋"]
    },
    // ... more messages
  ],

  statistics: {
    messageCountByUser: {
      "Alice": 75,
      "Bob": 70
    },

    emojiCountByUser: {
      "Alice": { "👋": 3, "😊": 5 },
      "Bob": { "👍": 4, "😂": 7 }
    },

    totalEmojiCount: {
      "👋": 3,
      "😊": 5,
      "👍": 4,
      "😂": 7
    },

    topEmojis: [
      { emoji: "😂", count: 7 },
      { emoji: "😊", count: 5 },
      // ... sorted by count
    ]
  }
}
```

---

## Error Handling & Edge Cases

### Malformed HTML
**Problem:** File structure doesn't match expected patterns
**Solution:** Return partial data + warning metadata

### Missing Fields
**Problem:** Some messages lack sender or timestamp
**Solution:** Use "Unknown" placeholder + flag in metadata

### Encoding Issues
**Problem:** Emoji rendered as `&#128075;` (HTML entities)
**Solution:** Decode entities before extraction

### Empty Messages
**Problem:** Messages with only whitespace or media references
**Solution:** Include in count but mark as "empty" in metadata

### Extremely Large Files
**Problem:** Memory exhaustion on 50MB file
**Solution:**
- Process in chunks if possible
- Use streaming parser for massive files
- Set reasonable limits (already have 50MB cap)

---

## Performance Considerations

### Time Complexity
- **Sanitization:** O(n) where n = HTML size
- **Parsing:** O(n)
- **Extraction:** O(m) where m = number of messages
- **Emoji Counting:** O(m × e) where e = average emojis per message
- **Overall:** O(n + m × e) ≈ O(n) for typical files

### Space Complexity
- **DOM Tree:** O(n) - full HTML in memory
- **Message Array:** O(m) - one object per message
- **Statistics:** O(u × e) where u = users, e = unique emojis
- **Overall:** O(n + m) ≈ O(n)

**Analogy:** If the HTML file is a 10-page document, we need about 10 pages of memory to process it, plus a few sticky notes for the statistics.

### Optimization Opportunities
1. **Lazy parsing:** Only parse messages when needed
2. **Worker threads:** Move parsing off main thread
3. **Streaming:** Process chunks instead of whole file
4. **Memoization:** Cache repeated regex operations

---

## Testing Strategy

### Unit Tests
- ✅ Emoji extraction from various Unicode ranges
- ✅ Message parsing with missing fields
- ✅ Sanitization removes malicious content
- ✅ Count aggregation is accurate

### Integration Tests
- ✅ Full pipeline with sample Instagram HTML
- ✅ Error handling for malformed input
- ✅ Performance with large files (10k+ messages)

### Manual Tests
- ✅ Real Instagram export file
- ✅ Various emoji combinations (skin tones, ZWJ sequences)
- ✅ Different date formats

---

## Security Checklist

- ✅ HTML sanitization before parsing
- ✅ No `eval()` or `Function()` constructor
- ✅ No direct `innerHTML` manipulation
- ✅ File size limits enforced
- ✅ No external network requests
- ✅ All processing client-side
- ✅ User can verify/delete data anytime

---

## Future Enhancements

1. **Platform Detection:** Auto-detect if HTML is from Instagram, WhatsApp, etc.
2. **Media Extraction:** Count images, videos, voice notes
3. **Sentiment Analysis:** Detect tone/mood from text
4. **Time-Series Analysis:** Message patterns over time
5. **Response Time:** Calculate average response time between users
6. **Word Cloud:** Most common words/phrases
7. **Conversation Threading:** Group messages into conversations
8. **Export Formats:** Allow export to JSON, CSV, PDF

---

## Implementation Checklist

- [ ] Create `useChatParser.js` composable
- [ ] Create `useEmojiCounter.js` composable
- [ ] Implement sanitization layer
- [ ] Implement DOM parsing
- [ ] Implement message extraction with fallbacks
- [ ] Implement emoji counting
- [ ] Create test suite
- [ ] Add error handling
- [ ] Document API
- [ ] Integrate with store
