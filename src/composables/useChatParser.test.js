import { describe, it, expect } from 'vitest'
import { extractEmojis } from './useChatParser'

describe('useChatParser - Emoji Extraction', () => {
  describe('Basic Emoji Extraction', () => {
    it('extracts simple single emojis', () => {
      const text = 'Hello 😊 world'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['😊'])
    })

    it('extracts multiple simple emojis', () => {
      const text = 'I love 🌹 and ❤️ and ✨'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(3)
      expect(emojis).toContain('🌹')
      expect(emojis).toContain('❤️')
      expect(emojis).toContain('✨')
    })

    it('returns empty array for text without emojis', () => {
      const text = 'Hello world, no emojis here!'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual([])
    })

    it('handles empty string', () => {
      const emojis = extractEmojis('')
      expect(emojis).toEqual([])
    })

    it('handles null input', () => {
      const emojis = extractEmojis(null)
      expect(emojis).toEqual([])
    })

    it('handles undefined input', () => {
      const emojis = extractEmojis(undefined)
      expect(emojis).toEqual([])
    })
  })

  describe('ZWJ (Zero Width Joiner) Sequences', () => {
    it('extracts emoji with up-down arrow ZWJ sequence (🙂‍↕️)', () => {
      const text = 'Check this out 🙂‍↕️'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['🙂‍↕️'])
      expect(emojis).toHaveLength(1)
    })

    it('extracts emoji with left-right arrow ZWJ sequence (🙂‍↔️)', () => {
      const text = 'Testing 🙂‍↔️ emoji'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['🙂‍↔️'])
      expect(emojis).toHaveLength(1)
    })

    it('extracts family emoji (👨‍👩‍👧‍👦)', () => {
      const text = 'Happy family 👨‍👩‍👧‍👦'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['👨‍👩‍👧‍👦'])
      expect(emojis).toHaveLength(1)
    })

    it('extracts profession emojis with ZWJ', () => {
      const text = 'Technologist 👨‍💻 and doctor 👩‍⚕️'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(2)
      expect(emojis).toContain('👨‍💻')
      expect(emojis).toContain('👩‍⚕️')
    })

    it('extracts couple emojis with ZWJ', () => {
      const text = 'Couple 👨‍❤️‍👨 and 👩‍❤️‍👩'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(2)
      expect(emojis[0]).toBe('👨‍❤️‍👨')
      expect(emojis[1]).toBe('👩‍❤️‍👩')
    })

    it('extracts kiss emojis with ZWJ', () => {
      const text = 'Kiss 👨‍❤️‍💋‍👨'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['👨‍❤️‍💋‍👨'])
    })
  })

  describe('Skin Tone Modifiers', () => {
    it('extracts emoji with skin tone modifier', () => {
      const text = 'Waving 👋🏽'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['👋🏽'])
    })

    it('extracts multiple emojis with different skin tones', () => {
      const text = 'Different tones: 👍🏻 👍🏽 👍🏿'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(3)
      expect(emojis).toContain('👍🏻')
      expect(emojis).toContain('👍🏽')
      expect(emojis).toContain('👍🏿')
    })

    it('extracts ZWJ sequence with skin tone', () => {
      const text = 'Technologist with skin tone 👨🏽‍💻'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['👨🏽‍💻'])
    })
  })

  describe('Flag Emojis', () => {
    it('extracts regional indicator symbols from flag emojis', () => {
      const text = 'Flags: 🇺🇸 🇬🇧 🇯🇵'
      const emojis = extractEmojis(text)

      // Note: Flag emojis are composed of pairs of regional indicator symbols.
      // Our regex extracts individual regional indicators rather than pairs.
      // This is a known limitation - proper flag emoji handling requires
      // pairing logic that's more complex than our current regex approach.
      expect(emojis).toHaveLength(6) // 2 indicators per flag × 3 flags
      expect(emojis).toContain('🇺')
      expect(emojis).toContain('🇸')
    })
  })

  describe('Variation Selectors', () => {
    it('extracts emoji with variation selector (️)', () => {
      const text = 'Heart ❤️ with variation selector'
      const emojis = extractEmojis(text)

      expect(emojis).toContain('❤️')
    })

    it('extracts arrow emoji with variation selector', () => {
      const text = 'Arrow ↕️'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['↕️'])
    })
  })

  describe('Complex Real-World Cases', () => {
    it('extracts mixed emojis from a message', () => {
      const text = 'I love you 😊❤️ and our family 👨‍👩‍👧‍👦! Amazing 🙂‍↕️'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(4)
      expect(emojis).toContain('😊')
      expect(emojis).toContain('❤️')
      expect(emojis).toContain('👨‍👩‍👧‍👦')
      expect(emojis).toContain('🙂‍↕️')
    })

    it('handles repeated emojis correctly', () => {
      const text = '😊😊😊'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(3)
      expect(emojis).toEqual(['😊', '😊', '😊'])
    })

    it('extracts emojis without extracting regular text', () => {
      const text = 'Hello world 123 ABC #hashtag 😊'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['😊'])
      expect(emojis).not.toContain('1')
      expect(emojis).not.toContain('#')
    })
  })

  describe('Edge Cases', () => {
    it('handles emoji at start of text', () => {
      const text = '😊 Hello'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['😊'])
    })

    it('handles emoji at end of text', () => {
      const text = 'Hello 😊'
      const emojis = extractEmojis(text)

      expect(emojis).toEqual(['😊'])
    })

    it('handles only emojis with no text', () => {
      const text = '😊🌹❤️'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(3)
    })

    it('extracts arrows from Unicode arrows block', () => {
      const text = 'Regular arrows: -> <- ↑ ↓'
      const emojis = extractEmojis(text)

      // Note: The arrows block (U+2190-U+21FF) is included to support
      // ZWJ sequences like 🙂‍↕️. As a side effect, plain arrows like
      // ↑ and ↓ are also captured. This is acceptable since:
      // 1. Plain arrows are rarely used in chat messages
      // 2. They are technically valid emoji characters
      // 3. Supporting ZWJ sequences with arrows is more important
      expect(emojis).toContain('↑')
      expect(emojis).toContain('↓')
    })

    it('handles very long text with many emojis', () => {
      const text = 'a'.repeat(1000) + '😊' + 'b'.repeat(1000) + '❤️' + 'c'.repeat(1000)
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(2)
      expect(emojis).toContain('😊')
      expect(emojis).toContain('❤️')
    })
  })

  describe('Specific ZWJ Sequences That Should Work', () => {
    // Test cases for specific emojis that were problematic

    it('handles head shaking emojis (newest additions)', () => {
      const text = 'Nodding 🙂‍↕️ and shaking 🙂‍↔️'
      const emojis = extractEmojis(text)

      expect(emojis).toHaveLength(2)
      expect(emojis[0]).toBe('🙂‍↕️')
      expect(emojis[1]).toBe('🙂‍↔️')
    })

    it('preserves ZWJ emoji as single unit', () => {
      const text = '🙂‍↕️'
      const emojis = extractEmojis(text)

      // Should be captured as one emoji, not split into components
      expect(emojis).toHaveLength(1)
      expect(emojis[0]).toBe('🙂‍↕️')

      // Verify it's the complete sequence
      const codePoints = Array.from(emojis[0]).map(c => c.codePointAt(0))
      expect(codePoints).toHaveLength(4) // 🙂 + ZWJ + ↕ + variation selector
    })
  })
})
