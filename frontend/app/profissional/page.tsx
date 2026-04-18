'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

export default function ProfissionalHomePage() {
  const router = useRouter();
  const { loadFromStorage, isAuthenticated, user } = useAuth();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/profissional/login');
      return;
    }

    if (user?.role === 'professional') {
      router.replace('/profissional/dashboard');
      return;
    }

    router.replace('/login');
  }, [isAuthenticated, router, user]);

  return null;
}
