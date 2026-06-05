import { useEffect } from 'react'
import { useRouter } from 'next/router'
export default function ManagementReviewRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/legal') }, [router])
  return null
}
