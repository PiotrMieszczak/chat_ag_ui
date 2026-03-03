import { describe, it, expect } from 'vitest'
import { validateToolArgs } from '../../src/utils/validation'
import type { ToolParameterSchema } from '../../src/core/types'

describe('validateToolArgs', () => {
  const schema: ToolParameterSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name' },
      count: { type: 'number', description: 'Count' },
      active: { type: 'boolean', description: 'Active' },
    },
    required: ['name'],
  }

  it('returns true for valid args', () => {
    expect(validateToolArgs({ name: 'test', count: 5 }, schema)).toBe(true)
  })

  it('returns true when optional fields missing', () => {
    expect(validateToolArgs({ name: 'test' }, schema)).toBe(true)
  })

  it('returns false for missing required field', () => {
    expect(validateToolArgs({ count: 5 }, schema)).toBe(false)
  })

  it('returns false for wrong type - string', () => {
    expect(validateToolArgs({ name: 123 }, schema)).toBe(false)
  })

  it('returns false for wrong type - number', () => {
    expect(validateToolArgs({ name: 'test', count: 'five' }, schema)).toBe(false)
  })

  it('returns false for wrong type - boolean', () => {
    expect(validateToolArgs({ name: 'test', active: 'yes' }, schema)).toBe(false)
  })

  it('returns true for empty schema', () => {
    const emptySchema: ToolParameterSchema = {
      type: 'object',
      properties: {},
    }
    expect(validateToolArgs({}, emptySchema)).toBe(true)
  })

  it('validates enum values', () => {
    const enumSchema: ToolParameterSchema = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
      required: ['status'],
    }
    expect(validateToolArgs({ status: 'active' }, enumSchema)).toBe(true)
    expect(validateToolArgs({ status: 'unknown' }, enumSchema)).toBe(false)
  })
})
