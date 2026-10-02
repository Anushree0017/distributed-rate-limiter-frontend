import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AlgorithmsListPage } from '@/routes/algorithms/AlgorithmsListPage'
import { GroupCreatePage } from '@/routes/groups/GroupCreatePage'
import { GroupDetailPage } from '@/routes/groups/GroupDetailPage'
import { GroupEditPage } from '@/routes/groups/GroupEditPage'
import { GroupsListPage } from '@/routes/groups/GroupsListPage'
import { ImportReviewPage } from '@/routes/import/ImportReviewPage'
import { ImportUploadPage } from '@/routes/import/ImportUploadPage'
import { RuleCreatePage } from '@/routes/rules/RuleCreatePage'
import { RuleDetailPage } from '@/routes/rules/RuleDetailPage'
import { RuleEditPage } from '@/routes/rules/RuleEditPage'
import { RulesListPage } from '@/routes/rules/RulesListPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/rules" replace />} />

        <Route path="/rules" element={<RulesListPage />} />
        <Route path="/rules/new" element={<RuleCreatePage />} />
        <Route path="/rules/:id/edit" element={<RuleEditPage />} />
        <Route path="/rules/:id" element={<RuleDetailPage />} />

        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/new" element={<GroupCreatePage />} />
        <Route path="/groups/:id/edit" element={<GroupEditPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />

        <Route path="/algorithms" element={<AlgorithmsListPage />} />

        <Route path="/import" element={<ImportUploadPage />} />
        <Route path="/import/review" element={<ImportReviewPage />} />

        <Route path="*" element={<Navigate to="/rules" replace />} />
      </Routes>
    </Layout>
  )
}
