import { BookOpen } from "lucide-react"

interface EducationalNotesProps {
  notes: string[]
}

export function EducationalNotes({ notes }: EducationalNotesProps) {
  if (notes.length === 0) return null

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Educational Notes</h2>
      </div>
      <div className="p-5">
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed pl-3 relative before:absolute before:left-0 before:top-[0.45em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/15">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
