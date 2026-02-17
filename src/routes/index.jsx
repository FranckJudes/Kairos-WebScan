import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import HomePage from '../components/pages/HomePage'
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
        path: 'organize',
        element: <OrganizePage />,
      },
    ],
  },
])
