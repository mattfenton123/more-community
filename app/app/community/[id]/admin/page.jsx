"use client";
import { useParams } from 'next/navigation';
import LeaderDashboard from '../../../dashboard/page';

export default function AdminPage() {
  const params = useParams();
  return <LeaderDashboard initialCommunityId={params?.id} />;
}
