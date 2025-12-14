import React from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileSidebar() {
  const [location, navigate] = useLocation();

  // Logo component at the top
  const Logo = () => (
    <div className="flex items-center gap-2 px-4 py-4">
      <img src="/assets/bantahblue.svg" alt="Logo" className="w-8 h-8" />
      <span className="text-xl font-bold text-slate-900 dark:text-white">Bantah</span>
    </div>
  );

  return (
    <div className="hidden md:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      <Logo />
      <Card className="flex-1 m-0 rounded-none border-0 bg-transparent">
        <CardContent className="p-0">
          <ul className="space-y-1">
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left" onClick={() => navigate('/profile')}>
                <i className="fas fa-user mr-3"></i> Profile
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left" onClick={() => navigate('/settings')}>
                <i className="fas fa-cog mr-3"></i> Settings
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left" onClick={() => navigate('/shop')}>
                <i className="fas fa-shopping-cart mr-3"></i> Shop
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left" onClick={() => navigate('/referrals')}>
                <i className="fas fa-share-alt mr-3"></i> Referrals
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left" onClick={() => { const event = new CustomEvent('start-tour'); window.dispatchEvent(event); }}>
                <i className="fas fa-question-circle mr-3"></i> Website Tour
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start rounded-none px-5 py-4 text-left text-red-600 dark:text-red-400" onClick={() => window.location.href = '/api/logout'}>
                <i className="fas fa-sign-out-alt mr-3"></i> Logout
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
