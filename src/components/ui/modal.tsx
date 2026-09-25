import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

interface ModalProps {
  children: React.ReactNode
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  onSubmit?: () => void
  submitText?: string
  cancelText?: string
  showFooter?: boolean
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: string
  className?: string
  disabled?: boolean
}

const Modal: React.FC<ModalProps> = ({
  children,
  title,
  description,
  isOpen,
  onClose,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  showFooter = true,
  submitVariant = "default",
  size,
  className = '',
  disabled = false
}) => {
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${size} ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-1">
          {children}
        </div>

        {showFooter && (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-9 rounded-lg px-4 text-[13px] font-medium text-zinc-400 hover:bg-surface-hover hover:text-zinc-200"
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={disabled}
                className="h-9 rounded-lg bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                {submitText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default Modal