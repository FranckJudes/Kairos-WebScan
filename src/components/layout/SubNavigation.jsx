import { useLocation, useNavigate } from 'react-router-dom'

function SubNavigation() {
    const location = useLocation()
    const navigate = useNavigate()

    const tabs = [
        { id: 'index', label: 'Index', path: '/', icon: 'home' },
        { id: 'organize', label: 'Organiser', path: '/organize', icon: 'grid_view' }
    ]

    const activeTab = location.pathname === '/' ? 'index' : 'organize'

    return (
        <div className="h-10 bg-[#f3f2f1] dark:bg-dark-bgSecondary border-b border-[#edebe9] dark:border-dark-border flex items-center shrink-0">
            <div className="flex items-center w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`
              flex-1 flex items-center justify-center space-x-2 px-4 py-2 transition-all h-10 border-b-2
              ${activeTab === tab.id
                                ? 'bg-white dark:bg-dark-bg text-[#106EBE] dark:text-blue-400 font-semibold border-[#106EBE] dark:border-blue-400'
                                : 'text-[#605e5c] dark:text-dark-text hover:bg-white/50 dark:hover:bg-dark-hover border-transparent'
                            }
            `}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        <span className="text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default SubNavigation
