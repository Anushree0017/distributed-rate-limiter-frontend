import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/auth/RequireAuth'
import { Layout } from '@/components/Layout'
import { AlgorithmsListPage } from '@/routes/algorithms/AlgorithmsListPage'
import { ClientCreatePage } from '@/routes/clients/ClientCreatePage'
import { ClientDetailPage } from '@/routes/clients/ClientDetailPage'
import { ClientEditPage } from '@/routes/clients/ClientEditPage'
import { ClientsListPage } from '@/routes/clients/ClientsListPage'
import { GroupCreatePage } from '@/routes/groups/GroupCreatePage'
import { GroupDetailPage } from '@/routes/groups/GroupDetailPage'
import { GroupEditPage } from '@/routes/groups/GroupEditPage'
import { GroupsListPage } from '@/routes/groups/GroupsListPage'
import { ImportReviewPage } from '@/routes/import/ImportReviewPage'
import { ImportUploadPage } from '@/routes/import/ImportUploadPage'
import { LoginPage } from '@/routes/login/LoginPage'
import { RuleCreatePage } from '@/routes/rules/RuleCreatePage'
import { RuleDetailPage } from '@/routes/rules/RuleDetailPage'
import { RuleEditPage } from '@/routes/rules/RuleEditPage'
import { RulesListPage } from '@/routes/rules/RulesListPage'

export default function App() {
  return (
    <Routes>
      {/* No sidebar/header, not behind RequireAuth — this is the one route
          an anonymous session can reach. */}
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <RequireAuth>
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

                <Route path="/clients" element={<ClientsListPage />} />
                <Route path="/clients/new" element={<ClientCreatePage />} />
                <Route path="/clients/:client_id/edit" element={<ClientEditPage />} />
                <Route path="/clients/:client_id" element={<ClientDetailPage />} />

                <Route path="/algorithms" element={<AlgorithmsListPage />} />

                <Route path="/import" element={<ImportUploadPage />} />
                <Route path="/import/review" element={<ImportReviewPage />} />

                <Route path="*" element={<Navigate to="/rules" replace />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
