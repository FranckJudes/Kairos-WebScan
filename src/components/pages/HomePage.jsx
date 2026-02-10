import Sidebar from './Sidebar'
import DocumentViewer from './DocumentViewer'

function HomePage() {
  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#f3f2f1] dark:bg-dark-bg relative transition-colors duration-200">
      <Sidebar />
      <DocumentViewer />
    </div>
  )
}

export default HomePage
