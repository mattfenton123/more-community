"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageCircle, User, Activity, Calendar, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';

export default function BottomNav() {
  const currentPath = usePathname();
  const { user } = useAppContext();
  const { directMessages, chatReadReceipts } = useChat();

  // Hide bottom nav on specific pages, particularly deep pages where fixed footers or chat inputs shouldn't be obscured
  const isDeepPage = currentPath.match(/^\/events\/[^/]+$/) || 
                     currentPath.match(/^\/community\/[^/]+$/) || 
                     currentPath.match(/^\/chat\/[^/]+\/[^/]+$/) || 
                     currentPath.match(/^\/chat\/dm\/[^/]+$/) ||
                     currentPath.match(/^\/profile\/[^/]+$/) ||
                     currentPath === '/settings';
  
  const hideBottomNav = currentPath === '/login' || currentPath === '/onboarding' || isDeepPage;
  
  if (hideBottomNav) return null;

  let unreadChatCount = 0;
  if (user && user.id) {
    const dmUsers = new Set();
    directMessages.forEach(dm => {
      if (dm.senderId === user.id) dmUsers.add(dm.receiverId);
      if (dm.receiverId === user.id) dmUsers.add(dm.senderId);
    });
    dmUsers.forEach(otherId => {
      const latestDm = directMessages.filter(m => (m.senderId === otherId && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === otherId)).pop();
      if (latestDm && latestDm.senderId !== user.id) {
        const receipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === otherId);
        if (!receipt || new Date(receipt.last_read_at) < new Date(latestDm.created_at || new Date().toISOString())) {
          unreadChatCount++;
        }
      }
    });
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Activity, href: '/' },
    { id: 'discover', label: 'Discover', icon: Compass, href: '/discover' },
    { id: 'events', label: 'Events', icon: Calendar, href: '/events' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, href: '/chat', badge: unreadChatCount },
    ...(user?.isAdmin || user?.leaderOf ? [{ id: 'admin', label: 'Admin', icon: Shield, href: '/admin' }] : []),
    { id: 'profile', label: 'Profile', icon: User, href: `/profile/${user?.id || ''}` },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(item => {
        const isActive = currentPath === item.href || (item.id === 'chat' && currentPath?.startsWith('/chat'));
        const Icon = item.icon;
        
        return (
          <Link key={item.id} href={item.href} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon-wrapper">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {item.badge > 0 && (
                <div className="nav-badge">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
