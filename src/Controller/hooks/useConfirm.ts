import { useCallback, useState } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmDestructive?: boolean
}

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<{
    visible: boolean
    options: ConfirmOptions
    resolve: ((value: boolean) => void) | null
  }>({
    visible: false,
    options: { title: '', message: '' },
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ visible: true, options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    confirmState.resolve?.(true)
    setConfirmState((prev) => ({ ...prev, visible: false, resolve: null }))
  }, [confirmState])

  const handleCancel = useCallback(() => {
    confirmState.resolve?.(false)
    setConfirmState((prev) => ({ ...prev, visible: false, resolve: null }))
  }, [confirmState])

  return { confirm, confirmState, handleConfirm, handleCancel }
}
