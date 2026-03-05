'use client'
import {
  useMemo,
} from 'react'
import { useStore as useAppStore } from '@/app/components/app/store'
import Loading from '@/app/components/base/loading'
import ApiServer from '@/app/components/develop/ApiServer'
import Doc from '@/app/components/develop/doc'
import { getCorrectedAppBaseUrl } from '@/utils'

type IDevelopMainProps = {
  appId: string
}

const DevelopMain = ({ appId }: IDevelopMainProps) => {
  const appDetail = useAppStore(state => state.appDetail)

  const api_base_url = useMemo(() => getCorrectedAppBaseUrl(appDetail?.api_base_url || ''), [appDetail?.api_base_url])

  if (!appDetail) {
    return (
      <div className="flex h-full items-center justify-center bg-background-default">
        <Loading />
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-solid border-b-divider-regular px-6 py-2">
        <div className="text-lg font-medium text-text-primary"></div>
        <ApiServer apiBaseUrl={api_base_url} appId={appId} />
      </div>
      <div className="grow overflow-auto px-4 py-4 sm:px-10">
        <Doc appDetail={appDetail} />
      </div>
    </div>
  )
}

export default DevelopMain
