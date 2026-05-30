import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function checkAdmin() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setAdminLoading(false);
        }
        return;
      }

      setAdminLoading(true);
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (isMounted) setIsAdmin(adminDoc.exists());
      } catch (error) {
        console.error('Error checking admin status', error);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setAdminLoading(false);
      }
    }

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { isAdmin, loading: authLoading || adminLoading };
}
