import type { ToolParameterSchema } from '../core/types'

type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array'

function checkType(value: unknown, expectedType: PropertyType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    default:
      return false
  }
}

export function validateToolArgs(
  args: Record<string, unknown>,
  schema: ToolParameterSchema
): boolean {
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in args)) {
        return false
      }
    }
  }

  // Validate each provided field
  for (const [key, value] of Object.entries(args)) {
    const propSchema = schema.properties[key]

    // Unknown property - allow for flexibility
    if (!propSchema) {
      continue
    }

    // Type check
    if (!checkType(value, propSchema.type)) {
      return false
    }

    // Enum check
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      return false
    }
  }

  return true
}
