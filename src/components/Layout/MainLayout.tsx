import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};
