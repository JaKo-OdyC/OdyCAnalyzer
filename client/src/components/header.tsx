import { Brain, Settings, HelpCircle, User } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Brain className="text-primary-500 text-2xl mr-3" size={28} />
              <span className="text-xl font-semibold text-gray-900">OdyC Multi-Agent Analyzer</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Settings size={20} />
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <HelpCircle size={20} />
            </button>
            <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
