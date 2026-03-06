import Button from '@/app/components/base/button'
import { useChatContext } from '@/app/components/base/chat/chat/context'
import { cn } from '@/utils/classnames'
import { isValidUrl } from './utils'

const MarkdownButton = ({ node }: any) => {
  const { onSend } = useChatContext()
  const variant = node.properties.dataVariant || 'secondary-accent'
  const message = node.properties.dataMessage
  const link = node.properties.dataLink
  const size = node.properties.dataSize
  const action = node.properties.dataAction
  const payload = node.properties.dataPayload

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('!h-auto min-h-8 select-none whitespace-normal !px-3')}
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
      <span className="text-[13px] font-medium text-primary-600">{node.children[0]?.value || ''}</span>
    </Button>
  )
}
MarkdownButton.displayName = 'MarkdownButton'

export default MarkdownButton
