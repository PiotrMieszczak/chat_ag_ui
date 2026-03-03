import { ChatError, JsonPatch, JsonPatchOperation } from '../core/types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function parsePath(path: string): string[] {
  if (path === '') return []
  if (!path.startsWith('/')) {
    throw new ChatError('STATE_PATCH_FAILED', `Invalid path: ${path}`)
  }
  return path.slice(1).split('/').map(segment =>
    segment.replace(/~1/g, '/').replace(/~0/g, '~')
  )
}

function getParentAndKey(
  obj: Record<string, unknown>,
  segments: string[]
): { parent: Record<string, unknown> | unknown[]; key: string | number } {
  let current: unknown = obj

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10)
      current = current[index]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      throw new ChatError('STATE_PATCH_FAILED', `Invalid path segment: ${segment}`)
    }
  }

  const lastSegment = segments[segments.length - 1]
  const key = Array.isArray(current) ?
    (lastSegment === '-' ? current.length : parseInt(lastSegment, 10)) :
    lastSegment

  return { parent: current as Record<string, unknown> | unknown[], key }
}

function applyOperation<T>(state: T, operation: JsonPatchOperation): T {
  const result = deepClone(state)
  const segments = parsePath(operation.path)

  if (segments.length === 0) {
    if (operation.op === 'replace') {
      return operation.value as T
    }
    throw new ChatError('STATE_PATCH_FAILED', 'Cannot add/remove root')
  }

  const { parent, key } = getParentAndKey(result as Record<string, unknown>, segments)

  switch (operation.op) {
    case 'add':
      if (Array.isArray(parent)) {
        parent.splice(key as number, 0, operation.value)
      } else {
        parent[key as string] = operation.value
      }
      break

    case 'remove':
      if (Array.isArray(parent)) {
        const index = key as number
        if (index >= parent.length) {
          throw new ChatError('STATE_PATCH_FAILED', `Index out of bounds: ${index}`)
        }
        parent.splice(index, 1)
      } else {
        if (!(key in parent)) {
          throw new ChatError('STATE_PATCH_FAILED', `Path not found: ${operation.path}`)
        }
        delete parent[key as string]
      }
      break

    case 'replace':
      if (Array.isArray(parent)) {
        const index = key as number
        if (index >= parent.length) {
          throw new ChatError('STATE_PATCH_FAILED', `Index out of bounds: ${index}`)
        }
        parent[index] = operation.value
      } else {
        if (!(key in parent)) {
          throw new ChatError('STATE_PATCH_FAILED', `Path not found: ${operation.path}`)
        }
        parent[key as string] = operation.value
      }
      break

    case 'move':
    case 'copy':
    case 'test':
      throw new ChatError('STATE_PATCH_FAILED', `Operation not supported: ${operation.op}`)
  }

  return result
}

export function applyJsonPatch<T>(state: T, patch: JsonPatch): T {
  let result = state
  for (const operation of patch) {
    result = applyOperation(result, operation)
  }
  return result
}
