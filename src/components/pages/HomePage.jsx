import Sidebar from './Sidebar'
import DocumentViewer from './DocumentViewer'

function HomePage() {
  return (
    <div className="flex flex-1 min-h-0 bg-[#f3f2f1]">
      <Sidebar />
      <DocumentViewer />
    </div>
  )
}

export default HomePage
