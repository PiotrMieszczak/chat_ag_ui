import { describe, it, expect } from 'vitest'
import { applyJsonPatch } from '../../src/utils/jsonPatch'
import { ChatError } from '../../src/core/types'

describe('applyJsonPatch', () => {
  describe('add operation', () => {
    it('adds value to object', () => {
      const state = { a: 1 }
      const patch = [{ op: 'add' as const, path: '/b', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('adds item to array end with /-', () => {
      const state = { items: [1, 2] }
      const patch = [{ op: 'add' as const, path: '/items/-', value: 3 }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual([1, 2, 3])
    })

    it('adds item at array index', () => {
      const state = { items: ['a', 'c'] }
      const patch = [{ op: 'add' as const, path: '/items/1', value: 'b' }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual(['a', 'b', 'c'])
    })

    it('adds nested value', () => {
      const state = { nested: { a: 1 } }
      const patch = [{ op: 'add' as const, path: '/nested/b', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result.nested).toEqual({ a: 1, b: 2 })
    })
  })

  describe('remove operation', () => {
    it('removes value from object', () => {
      const state = { a: 1, b: 2 }
      const patch = [{ op: 'remove' as const, path: '/b' }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 1 })
    })

    it('removes item from array', () => {
      const state = { items: [1, 2, 3] }
      const patch = [{ op: 'remove' as const, path: '/items/1' }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual([1, 3])
    })

    it('throws on invalid path', () => {
      const state = { a: 1 }
      const patch = [{ op: 'remove' as const, path: '/nonexistent' }]
      expect(() => applyJsonPatch(state, patch)).toThrow(ChatError)
    })
  })

  describe('replace operation', () => {
    it('replaces value', () => {
      const state = { a: 1 }
      const patch = [{ op: 'replace' as const, path: '/a', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 2 })
    })

    it('throws on invalid path', () => {
      const state = { a: 1 }
      const patch = [{ op: 'replace' as const, path: '/nonexistent', value: 2 }]
      expect(() => applyJsonPatch(state, patch)).toThrow(ChatError)
    })
  })

  describe('immutability', () => {
    it('does not mutate original state', () => {
      const state = { a: 1, nested: { b: 2 } }
      const original = JSON.parse(JSON.stringify(state))
      applyJsonPatch(state, [{ op: 'add', path: '/c', value: 3 }])
      expect(state).toEqual(original)
    })
  })

  describe('multiple operations', () => {
    it('applies operations in order', () => {
      const state = { count: 0 }
      const patch = [
        { op: 'replace' as const, path: '/count', value: 1 },
        { op: 'add' as const, path: '/name', value: 'test' },
      ]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ count: 1, name: 'test' })
    })
  })
})
