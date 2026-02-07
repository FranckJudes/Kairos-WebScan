import { useState } from 'react'
import Header from '../layout/Header'
import NavigationTabs from '../layout/NavigationTabs'
import ScanRibbon from '../layout/ribbons/ScanRibbon'
import ViewRibbon from '../layout/ribbons/ViewRibbon'
import Footer from '../layout/Footer'
import { Outlet } from 'react-router-dom'

function Layout() {
  const [activeTab, setActiveTab] = useState('Scan')

  const renderRibbon = () => {
    switch (activeTab) {
      case 'Scan':
        return <ScanRibbon />
      case 'View':
        return <ViewRibbon />
      default:
        return <ScanRibbon />
    }
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <Header />
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderRibbon()}
      <Outlet />
      <Footer />
    </div>
  )
}

export default Layout
