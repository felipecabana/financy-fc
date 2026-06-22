import { Layout } from '@/components/Layout'
import { Page } from '@/components/Page'
import { StyleGuidePreview } from '@/components/StyleGuidePreview'

export function App() {
  return (
    <Layout>
      <Page>
        <h1 className="text-2xl font-semibold text-brand-base">Style guide</h1>
        <p className="mt-2 text-gray-600">Validação visual dos primitivos Financy.</p>
        <div className="mt-8">
          <StyleGuidePreview />
        </div>
      </Page>
    </Layout>
  )
}
