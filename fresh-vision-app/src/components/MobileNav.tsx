'use client'

import { LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
}

interface MobileNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function MobileNav({ tabs, activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-w-fit ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
} 