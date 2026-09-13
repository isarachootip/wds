import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { JobDetail } from './JobDetail'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params

  let data: any = null
  try {
    const { getJobById } = await import('@/modules/visit/queries')
    data = await getJobById(id)
  } catch {}

  if (!data) notFound()

  return <JobDetail initialData={data} jobId={id} />
}
