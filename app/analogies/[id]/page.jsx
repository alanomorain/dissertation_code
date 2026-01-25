import { redirect } from "next/navigation"

export default async function AnalogyDetailPage({ params }) {
  const { id } = await params
  // Redirect to student analogy detail
  redirect(`/student/analogies/${id}`)
}
