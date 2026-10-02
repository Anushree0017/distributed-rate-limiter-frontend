import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseSpecFile } from '@/api/importSpec'
import { Button } from '@/components/ui/button'

export function ImportUploadPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const contents = await file.text()
      const candidates = parseSpecFile(file.name, contents)
      if (candidates.length === 0) {
        setError('No endpoints found in this file.')
        return
      }
      navigate('/import/review', { state: { candidates } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Import from spec</h1>
        <p className="text-sm text-muted-foreground">
          Upload an OpenAPI 3.x document (.json/.yaml) or a Postman Collection v2.1 export (.json). Parsed entirely in your
          browser — nothing is sent anywhere until you review and submit.
        </p>
      </div>

      <div className="rounded-md border border-dashed border-border p-6 text-center">
        <input id="spec-file" type="file" accept=".json,.yaml,.yml" className="hidden" onChange={onFileSelected} />
        <label htmlFor="spec-file">
          <Button asChild variant="outline">
            <span>Choose file</span>
          </Button>
        </label>
        {fileName && <p className="mt-2 text-sm text-muted-foreground">{fileName}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
