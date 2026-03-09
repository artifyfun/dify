import Button from '@/app/components/base/button'
import { useChatContext } from '@/app/components/base/chat/chat/context'
import { cn } from '@/utils/classnames'
import { isValidUrl } from './utils'

const MarkdownButton = ({ node }: any) => {
  const { onSend } = useChatContext()
  const variant = node.properties.dataVariant || 'secondary-accent'
  const isText = variant === 'ghost'
  const action = node.properties.dataAction
  const payload = node.properties.dataPayload
  const message = node.properties.dataMessage || (action !== 'post_message' && action !== 'link' && payload)
  const link = node.properties.dataLink || (action === 'link' && payload)
  const size = node.properties.dataSize

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'select-none whitespace-normal',
        isText
          ? '!h-auto !min-h-0 !border-none !bg-transparent !p-0 !shadow-none hover:!bg-transparent'
          : '!h-auto min-h-8 !px-3',
      )}
      onClick={() => {
        if (action === 'post_message') {
          const targetOrigin = document.referrer ? new URL(document.referrer).origin : '*'
          window.parent.postMessage({
            type: 'dify-custom-action',
            payload,
          }, targetOrigin)
          return
        }
        if (link && isValidUrl(link)) {
          window.open(link, '_blank')
          return
        }
        if (!message)
          return
        onSend?.(message)
      }}
    >
      <span className={cn(
        'text-[14px] font-medium leading-none',
        (!node.properties.dataVariant || isText) && 'text-primary-600',
      )}
      >
        {node.children[0]?.value || ''}
      </span>
    </Button>
  )
}
MarkdownButton.displayName = 'MarkdownButton'

export default MarkdownButton
