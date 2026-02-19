import { createClient } from '@/lib/supabase/server'
import KnowledgeClient from '@/components/KnowledgeClient'

export default async function KnowledgePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: articles } = await supabase
    .from('kb_articles')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return <KnowledgeClient articles={articles ?? []} userId={user!.id} />
}
