
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, AlertCircle, XCircle, Info, Upload } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
      case "destructive":
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3 w-full">
              {getIcon(variant)}
              <div className="flex-1 min-w-0">
                {title && (
                  <ToastTitle className="font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-slate-600 dark:text-slate-300 mt-1">
                    {description}
                  </ToastDescription>
                )}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
