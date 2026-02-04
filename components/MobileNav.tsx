
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../constants';

const MobileNav: React.FC = () => {
  // Only show key navigation items on mobile to keep it clean
  const mobileItems = NAVIGATION_ITEMS.slice(0, 4); // Dashboard, Pipeline, Market, Studio
  mobileItems.push(NAVIGATION_ITEMS[5]); // Assistant

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-2 py-1 pb-safe-offset-2">
      <div className="flex justify-around items-center h-16">
        {mobileItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-cyan-400' : 'text-slate-500'
              }`
            }
          >
            {/* NavLink children as a function provides access to the isActive state for nested styling */}
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/10' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">{item.label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
