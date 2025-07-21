import { 
  Upload, 
  Users, 
  Play, 
  FileText, 
  History, 
  TrendingUp 
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { icon: Upload, label: "Data Import", active: true },
    { icon: Users, label: "Agent Management", active: false },
    { icon: Play, label: "Analysis Pipeline", active: false },
    { icon: FileText, label: "Documentation Output", active: false },
    { icon: History, label: "Analysis History", active: false },
    { icon: TrendingUp, label: "Analytics", active: false },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="mt-5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href="#"
              className={`${
                item.active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1`}
            >
              <Icon 
                className={`${
                  item.active ? 'text-primary-500' : 'text-gray-400'
                } mr-3`} 
                size={18} 
              />
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
