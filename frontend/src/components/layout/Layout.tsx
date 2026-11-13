import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { SearchModal } from '../modals/SearchModal';
import { NotificationsDrawer } from '../modals/NotificationsDrawer';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();

  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    window.dispatchEvent(new CustomEvent('finance_data_updated'));
  };

  return (
    <div className="relative min-h-screen bg-[#060c09] text-[#f8fafc] overflow-x-hidden">
      {/* Liquid Glass ambient refractive light pools */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[580px] h-[580px] rounded-full bg-[#10b981]/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-24 w-[520px] h-[520px] rounded-full bg-[#059669]/9 blur-[140px]" />
        <div className="absolute -bottom-24 left-1/3 w-[640px] h-[640px] rounded-full bg-[#047857]/9 blur-[160px]" />
      </div>

      {/* Sidebar with Professional Layout */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenAddTransaction={() => setAddTransactionOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + refreshKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <AddTransactionModal
        isOpen={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};
