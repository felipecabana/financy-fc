import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  loading?: boolean
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  loading = false,
  onConfirm,
}: DeleteConfirmDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (loading) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-6 rounded-xl border-gray-200 p-[25px] sm:max-w-[448px]">
        <DialogHeader className="gap-0 text-left">
          <DialogTitle className="text-base font-semibold text-gray-800">{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="-mx-[25px] -mb-[25px] mt-0 gap-2 rounded-b-xl border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
