import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  )
}

function Field({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('max-w-md space-y-2', className)}>{children}</div>
}

export function StyleGuidePreview() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-10 pb-10">
      <Section title="Botões">
        <div className="flex flex-wrap gap-3">
          <Button>
            <Plus />
            Primário Md
          </Button>
          <Button variant="outline">
            <Plus />
            Secundário Md
          </Button>
          <Button size="sm">
            <Plus />
            Primário Sm
          </Button>
          <Button variant="outline" size="sm">
            <Plus />
            Secundário Sm
          </Button>
          <Button disabled>Desabilitado</Button>
        </div>
      </Section>

      <Section title="Campos">
        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <Label htmlFor="input-empty">Label</Label>
            <Input id="input-empty" placeholder="Placeholder" />
          </Field>
          <Field>
            <Label htmlFor="input-filled">Label</Label>
            <Input id="input-filled" defaultValue="Text" />
          </Field>
          <Field>
            <Label htmlFor="input-error">Label</Label>
            <Input id="input-error" aria-invalid defaultValue="Text" />
            <p className="text-sm text-destructive">Helper text</p>
          </Field>
          <Field>
            <Label htmlFor="input-disabled">Label</Label>
            <Input id="input-disabled" disabled placeholder="Placeholder" />
          </Field>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Título do card</CardTitle>
            <CardDescription>Descrição auxiliar do card.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Conteúdo do card para validação visual.</p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Dialog">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Título do dialog</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">Conteúdo do dialog para validação visual.</p>
          </DialogContent>
        </Dialog>
      </Section>
    </div>
  )
}
