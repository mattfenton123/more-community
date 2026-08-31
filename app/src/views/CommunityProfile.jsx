import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import CommunityProfileNonMember from './CommunityProfileNonMember';
import CommunityProfileMember from './CommunityProfileMember';

export default function CommunityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, communities, users, events } = useAppContext();
  
  const community = communities.find(c => c.id === id);
  const isMember = user?.joinedCommunities?.includes(id);

  if (!community) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const leaderUser = users.find(u => u.id === community.leaderId);
  const memberList = users.filter(u => u.joinedCommunities?.includes(id));
  const communityEvents = events.filter(e => e.communityId === id);

  const handleJoin = () => {
    if (community.subscription_price || community.subscriptionPrice) {
      alert('Stripe checkout would open here.');
    } else {
      alert('You have joined the community!');
      // TODO: actual join logic
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const isPaid = !!(community.subscription_price || community.subscriptionPrice);

  if (!isMember) {
    return (
      <CommunityProfileNonMember 
        community={community} 
        leaderUser={leaderUser} 
        memberList={memberList} 
        communityEvents={communityEvents}
        navigate={navigate}
        handleJoin={handleJoin}
        handleShare={handleShare}
        isPaid={isPaid}
      />
    );
  }

  return <CommunityProfileMember />;
}
