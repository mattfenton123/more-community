"use client";
import { useRouter } from 'next/navigation';
import OnboardingFlow from '../../src/views/OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/discover');
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
