import type {
  FC,
  ReactNode,
} from 'react'
import type { ThemeBuilder } from '../embedded-chatbot/theme/theme-context'
import type {
  ChatConfig,
  ChatItem,
  Feedback,
  OnRegenerate,
  OnSend,
} from '../types'
import type { InputForm } from './type'
import type { Emoji } from '@/app/components/tools/types'
import type { AppData } from '@/models/share'
import { debounce } from 'es-toolkit/compat'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { useStore as useAppStore } from '@/app/components/app/store'
import AgentLogModal from '@/app/components/base/agent-log-modal'
import Button from '@/app/components/base/button'
import { StopCircle } from '@/app/components/base/icons/src/vender/solid/mediaAndDevices'
import PromptLogModal from '@/app/components/base/prompt-log-modal'
import { cn } from '@/utils/classnames'
import Answer from './answer'
import ChatInputArea from './chat-input-area'
import { ChatContextProvider } from './context'
import Question from './question'
import TryToAsk from './try-to-ask'

export type ChatProps = {
  appData?: AppData
  chatList: ChatItem[]
  config?: ChatConfig
  isResponding?: boolean
  noStopResponding?: boolean
  onStopResponding?: () => void
  noChatInput?: boolean
  onSend?: OnSend
  inputs?: Record<string, any>
  inputsForm?: InputForm[]
  onRegenerate?: OnRegenerate
  chatContainerClassName?: string
  chatContainerInnerClassName?: string
  chatFooterClassName?: string
  chatFooterInnerClassName?: string
  suggestedQuestions?: string[]
  showPromptLog?: boolean
  questionIcon?: ReactNode
  answerIcon?: ReactNode
  allToolIcons?: Record<string, string | Emoji>
  onAnnotationEdited?: (question: string, answer: string, index: number) => void
  onAnnotationAdded?: (annotationId: string, authorName: string, question: string, answer: string, index: number) => void
  onAnnotationRemoved?: (index: number) => void
  chatNode?: ReactNode
  onFeedback?: (messageId: string, feedback: Feedback) => void
  chatAnswerContainerInner?: string
  hideProcessDetail?: boolean
  hideLogModal?: boolean
  themeBuilder?: ThemeBuilder
  switchSibling?: (siblingMessageId: string) => void
  showFeatureBar?: boolean
  showFileUpload?: boolean
  onFeatureBarClick?: (state: boolean) => void
  noSpacing?: boolean
  inputDisabled?: boolean
  sidebarCollapseState?: boolean
}

const Chat: FC<ChatProps> = ({
  appData,
  config,
  onSend,
  inputs,
  inputsForm,
  onRegenerate,
  chatList,
  isResponding,
  noStopResponding,
  onStopResponding,
  noChatInput,
  chatContainerClassName,
  chatContainerInnerClassName,
  chatFooterClassName,
  chatFooterInnerClassName,
  suggestedQuestions,
  showPromptLog,
  questionIcon,
  answerIcon,
  onAnnotationAdded,
  onAnnotationEdited,
  onAnnotationRemoved,
  chatNode,
  onFeedback,
  chatAnswerContainerInner,
  hideProcessDetail,
  hideLogModal,
  themeBuilder,
  switchSibling,
  showFeatureBar,
  showFileUpload,
  onFeatureBarClick,
  noSpacing,
  inputDisabled,
  sidebarCollapseState,
}) => {
  const { t } = useTranslation()
  const { currentLogItem, setCurrentLogItem, showPromptLogModal, setShowPromptLogModal, showAgentLogModal, setShowAgentLogModal } = useAppStore(useShallow(state => ({
    currentLogItem: state.currentLogItem,
    setCurrentLogItem: state.setCurrentLogItem,
    showPromptLogModal: state.showPromptLogModal,
    setShowPromptLogModal: state.setShowPromptLogModal,
    showAgentLogModal: state.showAgentLogModal,
    setShowAgentLogModal: state.setShowAgentLogModal,
  })))
  const [width, setWidth] = useState(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatContainerInnerRef = useRef<HTMLDivElement>(null)
  const chatFooterRef = useRef<HTMLDivElement>(null)
  const chatFooterInnerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  const isAutoScrollingRef = useRef(false)

  // 查找是否有开场白消息，并获取其携带的建议问题
  const openingStatementItem = chatList.find(item => item.isOpeningStatement)
  // 如果当前还没有动态生成的建议，且处于对话开始阶段（消息列表较短），则使用开场白的建议
  const displayQuestions = (suggestedQuestions && suggestedQuestions.length > 0)
    ? suggestedQuestions
    : (openingStatementItem?.suggestedQuestions || [])

  const handleScrollToBottom = useCallback(() => {
    if (chatList.length > 1 && chatContainerRef.current && !userScrolledRef.current) {
      isAutoScrollingRef.current = true
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight

      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false
      })
    }
  }, [chatList.length])

  const handleWindowResize = useCallback(() => {
    if (chatContainerRef.current)
      setWidth(document.body.clientWidth - (chatContainerRef.current?.clientWidth + 16) - 8)

    if (chatContainerRef.current && chatFooterRef.current)
      chatFooterRef.current.style.width = `${chatContainerRef.current.clientWidth}px`

    if (chatContainerInnerRef.current && chatFooterInnerRef.current)
      chatFooterInnerRef.current.style.width = `${chatContainerInnerRef.current.clientWidth}px`
  }, [])

  useEffect(() => {
    handleScrollToBottom()
    handleWindowResize()
  }, [handleScrollToBottom, handleWindowResize])

  useEffect(() => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        handleScrollToBottom()
        handleWindowResize()
      })
    }
  })

  useEffect(() => {
    const debouncedHandler = debounce(handleWindowResize, 200)
    window.addEventListener('resize', debouncedHandler)

    return () => {
      window.removeEventListener('resize', debouncedHandler)
      debouncedHandler.cancel()
    }
  }, [handleWindowResize])

  useEffect(() => {
    if (chatFooterRef.current && chatContainerRef.current) {
      // container padding bottom
      const resizeContainerObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize } = entry.borderBoxSize[0]
          chatContainerRef.current!.style.paddingBottom = `${blockSize + 80}px`
          handleScrollToBottom()
        }
      })
      resizeContainerObserver.observe(chatFooterRef.current)

      // footer width
      const resizeFooterObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { inlineSize } = entry.borderBoxSize[0]
          chatFooterRef.current!.style.width = `${inlineSize}px`
        }
      })
      resizeFooterObserver.observe(chatContainerRef.current)

      return () => {
        resizeContainerObserver.disconnect()
        resizeFooterObserver.disconnect()
      }
    }
  }, [handleScrollToBottom])

  useEffect(() => {
    const setUserScrolled = () => {
      const container = chatContainerRef.current
      if (!container)
        return

      if (isAutoScrollingRef.current)
        return

      const distanceToBottom = container.scrollHeight - container.clientHeight - container.scrollTop
      const SCROLL_UP_THRESHOLD = 100

      userScrolledRef.current = distanceToBottom > SCROLL_UP_THRESHOLD
    }

    const container = chatContainerRef.current
    if (!container)
      return

    container.addEventListener('scroll', setUserScrolled)
    return () => container.removeEventListener('scroll', setUserScrolled)
  }, [])

  // Reset user scroll state when conversation changes or a new chat starts
  // Track the first message ID to detect conversation switches (fixes #29820)
  const prevFirstMessageIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const firstMessageId = chatList[0]?.id
    // Reset when: new chat (length <= 1) OR conversation switched (first message ID changed)
    if (chatList.length <= 1 || (firstMessageId && prevFirstMessageIdRef.current !== firstMessageId))
      userScrolledRef.current = false
    prevFirstMessageIdRef.current = firstMessageId
  }, [chatList])

  useEffect(() => {
    if (!sidebarCollapseState)
      setTimeout(() => handleWindowResize(), 200)
  }, [handleWindowResize, sidebarCollapseState])

  const hasTryToAsk = config?.suggested_questions_after_answer?.enabled && !!suggestedQuestions?.length && onSend

  return (
    <ChatContextProvider
      config={config}
      chatList={chatList}
      isResponding={isResponding}
      showPromptLog={showPromptLog}
      questionIcon={questionIcon}
      answerIcon={answerIcon}
      onSend={onSend}
      onRegenerate={onRegenerate}
      onAnnotationAdded={onAnnotationAdded}
      onAnnotationEdited={onAnnotationEdited}
      onAnnotationRemoved={onAnnotationRemoved}
      onFeedback={onFeedback}
    >
      <div className="relative h-full">
        <div
          ref={chatContainerRef}
          className={cn('relative h-full overflow-y-auto overflow-x-hidden', chatContainerClassName)}
        >
          {chatNode}
          <div
            ref={chatContainerInnerRef}
            className={cn('w-full', !noSpacing && 'px-8', chatContainerInnerClassName)}
          >
            {
              chatList.map((item, index) => {
                if (item.isAnswer) {
                  const isLast = item.id === chatList[chatList.length - 1]?.id
                  return (
                    <Answer
                      appData={appData}
                      key={item.id}
                      item={item}
                      question={chatList[index - 1]?.content}
                      index={index}
                      config={config}
                      answerIcon={answerIcon}
                      responding={isLast && isResponding}
                      showPromptLog={showPromptLog}
                      chatAnswerContainerInner={chatAnswerContainerInner}
                      hideProcessDetail={hideProcessDetail}
                      noChatInput={noChatInput}
                      switchSibling={switchSibling}
                    />
                  )
                }
                return (
                  <Question
                    key={item.id}
                    item={item}
                    questionIcon={questionIcon}
                    theme={themeBuilder?.theme}
                    enableEdit={config?.questionEditEnable}
                    switchSibling={switchSibling}
                  />
                )
              })
            }
          </div>
        </div>
        <div
          className={`absolute bottom-0 z-10 flex justify-center bg-chat-input-mask ${(hasTryToAsk || !noChatInput || !noStopResponding) && chatFooterClassName}`}
          ref={chatFooterRef}
        >
          <div
            ref={chatFooterInnerRef}
            className={cn('relative', chatFooterInnerClassName)}
          >
            {
              !noStopResponding && isResponding && (
                <div className="mb-2 flex justify-center">
                  <Button className="border-components-panel-border bg-components-panel-bg text-components-button-secondary-text" onClick={onStopResponding}>
                    <StopCircle className="mr-[5px] h-3.5 w-3.5" />
                    <span className="text-xs font-normal">{t('operation.stopResponding', { ns: 'appDebug' })}</span>
                  </Button>
                </div>
              )
            }
            {
              hasTryToAsk && (
                <TryToAsk
                  suggestedQuestions={suggestedQuestions}
                  onSend={onSend}
                />
              )
            }
            {
              !noChatInput && (
                <>
                  {displayQuestions && displayQuestions.length > 0 && (
                    <div className="no-scrollbar flex flex-wrap gap-2 pb-2 sm:flex-nowrap sm:overflow-x-auto">
                      {displayQuestions.map((suggestQuestion, index) => (
                        <button key={index} onClick={() => onSend?.(suggestQuestion, [])} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-[7px] text-[13px] text-gray-700 transition-colors hover:bg-gray-50" style={{ borderRadius: '8px', border: '1px solid #DBE0E6', background: '#F5F8FC', padding: '6px 10px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1C11.8657 1 15 4.13428 15 8C15 11.8657 11.8657 15 8 15H2.59082C2.72071 13.491 2.63379 12.5251 2.32618 12.0996C1.46321 10.9068 0.998296 9.47308 1 8C1 4.13428 4.13428 1 8 1ZM8 2.27344C4.83668 2.27344 2.27344 4.83667 2.27344 8C2.27344 9.25261 2.67488 10.4112 3.3584 11.3545C3.60962 11.7031 3.68287 12.4929 3.5752 13.7285H8V13.7266C11.1633 13.7266 13.7266 11.1633 13.7266 8C13.7266 4.83667 11.1633 2.27344 8 2.27344ZM7.95313 10.1133C8.25658 10.1133 8.53029 10.3035 8.62891 10.584C8.74995 10.9098 8.62059 11.2808 8.31739 11.4551L8.30958 11.4629C8.19583 11.5235 8.07445 11.5537 7.95313 11.5537C7.8318 11.5537 7.70284 11.5235 7.59668 11.4629C7.36923 11.334 7.2247 11.0916 7.22461 10.834C7.22461 10.4853 7.47531 10.1818 7.82422 10.1211C7.86969 10.1135 7.90769 10.1133 7.95313 10.1133ZM8.00684 4.2002C8.64393 4.20032 9.26616 4.46537 9.70606 4.92773C10.108 5.34468 10.3282 5.9134 10.2979 6.49707C10.2979 7.13392 10.0239 7.6268 9.21973 8.42285C8.9166 8.72581 8.60645 9.05923 8.59083 9.27148C8.5529 9.60505 8.28712 9.84786 7.96094 9.85547H7.94532C7.77857 9.84021 7.61956 9.75671 7.50586 9.62793C7.39974 9.49906 7.34617 9.32493 7.36133 9.1582V9.14355C7.4903 8.50671 7.83232 7.92284 8.33301 7.50586C9.00051 6.83877 9.0073 6.6412 9.02247 6.43652C9.03005 6.20908 8.93959 5.98125 8.78028 5.81445C8.58308 5.60987 8.30988 5.4893 8.0293 5.48926H8.00684C7.74132 5.48926 7.49044 5.59539 7.30079 5.77734C7.11137 5.96678 7.00497 6.22414 7.00489 6.48926C7.00489 6.7167 6.88354 6.93706 6.67872 7.05078C6.58013 7.1038 6.46628 7.13379 6.35254 7.13379C6.23879 7.13378 6.12496 7.10382 6.02637 7.05078C5.82913 6.93706 5.7002 6.7167 5.7002 6.48926C5.70028 5.87532 5.94296 5.29925 6.38282 4.86719C6.81523 4.43504 7.39213 4.2002 7.99903 4.2002H8.00684Z" fill="#0D76FF" />
                          </svg>
                          <span style={{ color: '#333', textAlign: 'center', fontSize: '12px', fontStyle: 'normal', fontWeight: 400, lineHeight: '12px' }}>{suggestQuestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <ChatInputArea
                    botName={appData?.site.title || 'Bot'}
                    disabled={inputDisabled}
                    showFeatureBar={showFeatureBar}
                    showFileUpload={showFileUpload}
                    featureBarDisabled={isResponding}
                    onFeatureBarClick={onFeatureBarClick}
                    visionConfig={config?.file_upload}
                    speechToTextConfig={config?.speech_to_text}
                    onSend={onSend}
                    inputs={inputs}
                    inputsForm={inputsForm}
                    theme={themeBuilder?.theme}
                    isResponding={isResponding}
                  />
                </>
              )
            }
          </div>
        </div>
        {showPromptLogModal && !hideLogModal && (
          <PromptLogModal
            width={width}
            currentLogItem={currentLogItem}
            onCancel={() => {
              setCurrentLogItem()
              setShowPromptLogModal(false)
            }}
          />
        )}
        {showAgentLogModal && !hideLogModal && (
          <AgentLogModal
            width={width}
            currentLogItem={currentLogItem}
            onCancel={() => {
              setCurrentLogItem()
              setShowAgentLogModal(false)
            }}
          />
        )}
      </div>
    </ChatContextProvider>
  )
}

export default memo(Chat)
