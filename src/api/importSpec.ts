import { load as loadYaml } from 'js-yaml'

export interface CandidateEndpoint {
  id: string
  method: string
  path: string
  label: string
  suggestedGroup: string | null
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'])

/** Single point of truth for path-parameter spelling. Postman uses `:id`,
 * OpenAPI uses `{id}`; the backend's `rules.endpoint` convention hasn't been
 * confirmed against a running instance yet, so this normalizes everything to
 * OpenAPI's `{param}` style — change this one function if that assumption
 * turns out wrong. */
export function normalizeEndpointPath(rawPath: string): string {
  let path = rawPath.trim()
  // Strip Postman variable-style host prefixes, e.g. "{{baseUrl}}/v1/foo".
  path = path.replace(/^\{\{[^}]+\}\}/, '')
  // Strip a scheme+host if the raw value was a full URL.
  path = path.replace(/^https?:\/\/[^/]+/, '')
  if (!path.startsWith('/')) path = `/${path}`
  // Postman `:id` -> OpenAPI `{id}`.
  path = path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, '{$1}')
  // Collapse duplicate slashes and drop a trailing slash (except root).
  path = path.replace(/\/{2,}/g, '/')
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

function parseOpenApi(spec: any): CandidateEndpoint[] {
  const candidates: CandidateEndpoint[] = []
  const paths = spec.paths ?? {}
  for (const [rawPath, pathItem] of Object.entries<any>(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const [method, operation] of Object.entries<any>(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue
      if (!operation || typeof operation !== 'object') continue
      const tag: string | undefined = Array.isArray(operation.tags) ? operation.tags[0] : undefined
      const label: string = operation.summary || operation.operationId || `${method.toUpperCase()} ${rawPath}`
      candidates.push({
        id: `${method.toUpperCase()} ${rawPath}`,
        method: method.toUpperCase(),
        path: normalizeEndpointPath(rawPath),
        label,
        suggestedGroup: tag ?? null,
      })
    }
  }
  return candidates
}

function walkPostmanItems(items: any[], folderName: string | null, out: CandidateEndpoint[]): void {
  for (const item of items) {
    if (Array.isArray(item.item)) {
      walkPostmanItems(item.item, item.name ?? folderName, out)
      continue
    }
    const request = item.request
    if (!request) continue
    const method: string = (request.method ?? 'GET').toUpperCase()
    let rawPath = ''
    if (typeof request.url === 'string') {
      rawPath = request.url
    } else if (request.url) {
      if (typeof request.url.raw === 'string') {
        rawPath = request.url.raw
      } else if (Array.isArray(request.url.path)) {
        rawPath = `/${request.url.path.join('/')}`
      }
    }
    if (!rawPath) continue
    out.push({
      id: `${method} ${rawPath} ${out.length}`,
      method,
      path: normalizeEndpointPath(rawPath),
      label: item.name ?? `${method} ${rawPath}`,
      suggestedGroup: folderName,
    })
  }
}

function parsePostmanCollection(collection: any): CandidateEndpoint[] {
  const out: CandidateEndpoint[] = []
  walkPostmanItems(collection.item ?? [], null, out)
  return out
}

export type SpecFormat = 'openapi' | 'postman'

export function detectSpecFormat(parsed: any): SpecFormat {
  if (parsed && (typeof parsed.openapi === 'string' || typeof parsed.swagger === 'string')) {
    return 'openapi'
  }
  if (parsed?.info?.schema && String(parsed.info.schema).includes('collection')) {
    return 'postman'
  }
  throw new Error(
    'Unrecognized file: expected an OpenAPI 3.x document (top-level "openapi"/"swagger" key) or a Postman Collection v2.1 export ("info.schema" containing "collection").',
  )
}

export function parseSpecFile(filename: string, contents: string): CandidateEndpoint[] {
  const isYaml = /\.ya?ml$/i.test(filename)
  const parsed = isYaml ? loadYaml(contents) : JSON.parse(contents)
  const format = detectSpecFormat(parsed)
  return format === 'openapi' ? parseOpenApi(parsed) : parsePostmanCollection(parsed)
}
