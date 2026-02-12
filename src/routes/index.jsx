import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import HomePage from '../components/pages/HomePage'
import ReorganizePage from '../components/pages/ReorganizePage'
import ClassifyPage from '../components/pages/ClassifyPage'
import OrganizePage from '../components/pages/OrganizePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'reorganize',
        element: <ReorganizePage />,
      },
      {
        path: 'classify',
        element: <ClassifyPage />,
      },
      {
        path: 'organize',
        element: <OrganizePage />,
      },
    ],
  },
])
