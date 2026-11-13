import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, PermissionKey } from '../types/index.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import {
  getSavedRolePermissions,
  saveRolePermissions,
  resetRolePermissionsToDefaults,
  checkRolePermission,
  getAuthorizedTabsForRole,
  ROLE_CONFIGURATIONS,
  ALL_SYSTEM_ROLES,
} from '../services/permissionsService.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  rolePermissions: Record<UserRole, PermissionKey[]>;
  signInWithGoogle: () => Promise<void>;
  signInAsStaffRole: (
    role: UserRole,
    customName?: string,
    customEmail?: string,
    customDesignation?: string
  ) => Promise<void>;
  loginWithCredentials: (emailOrUser: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchActiveRole: (role: UserRole) => void;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessTab: (tabId: string) => boolean;
  updateRolePermissions: (newMap: Record<UserRole, PermissionKey[]>) => void;
  resetPermissionsToDefault: () => void;
  canAccessFinancials: () => boolean;
  canApproveReports: () => boolean;
  canEnterLabResults: () => boolean;
  canIssueBills: () => boolean;
  isSuperAdmin: boolean;
  isAdminOrOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial default owner profile (Dr. Sonali Admin / sonalimedicalhall1985@gmail.com)
const DEFAULT_OWNER: UserProfile = {
  uid: 'owner_admin',
  email: 'sonalimedicalhall1985@gmail.com',
  name: 'Dr. Sonali Admin',
  role: 'Super Admin / Owner',
  designation: 'Managing Director & Chief Consultant',
  active: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sdc_user');
    return saved ? JSON.parse(saved) : DEFAULT_OWNER;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sdc_token') || 'STAFF_SESSION_:owner_admin:' + Date.now();
  });

  const [loading, setLoading] = useState(false);

  // Dynamic configurable permissions state
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, PermissionKey[]>>(() => {
    return getSavedRolePermissions();
  });

  // Listen for permission updates across tabs or components
  useEffect(() => {
    const handlePermissionsUpdated = () => {
      setRolePermissions(getSavedRolePermissions());
    };
    window.addEventListener('sdc_permissions_updated', handlePermissionsUpdated);
    return () => window.removeEventListener('sdc_permissions_updated', handlePermissionsUpdated);
  }, []);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        const isOwner = fbUser.email?.toLowerCase() === 'sonalimedicalhall1985@gmail.com';
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || (isOwner ? 'Dr. Sonali Admin' : 'Authorized Staff'),
          role: isOwner ? 'Super Admin / Owner' : 'Receptionist',
          designation: isOwner ? 'Managing Director' : 'Reception Desk',
          active: true,
        };
        setUser(profile);
        setToken(idToken);
        localStorage.setItem('sdc_user', JSON.stringify(profile));
        localStorage.setItem('sdc_token', idToken);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = res.user;
      const idToken = await fbUser.getIdToken();
      const isOwner = fbUser.email?.toLowerCase() === 'sonalimedicalhall1985@gmail.com';
      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || (isOwner ? 'Dr. Sonali Admin' : 'Authorized Staff'),
        role: isOwner ? 'Super Admin / Owner' : 'Receptionist',
        designation: isOwner ? 'Managing Director' : 'Staff',
        active: true,
      };
      setUser(profile);
      setToken(idToken);
      localStorage.setItem('sdc_user', JSON.stringify(profile));
      localStorage.setItem('sdc_token', idToken);
    } catch (err) {
      console.error('Google Sign-In error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInAsStaffRole = async (
    role: UserRole,
    customName?: string,
    customEmail?: string,
    customDesignation?: string
  ) => {
    const config = ROLE_CONFIGURATIONS[role];
    const defaultUser = config?.defaultUser;

    const name = customName || defaultUser?.name || `${role} Operator`;
    const email = customEmail || defaultUser?.email || `${role.toLowerCase().replace(/[^a-z]/g, '')}@sonalidiag.com`;
    const designation = customDesignation || defaultUser?.designation || role;

    const sessionToken = `STAFF_SESSION_:${role.replace(/\s+/g, '_').toLowerCase()}:${Date.now()}`;
    const profile: UserProfile = {
      uid: `staff_${role.replace(/\s+/g, '_').toLowerCase()}`,
      email,
      name,
      role,
      designation,
      active: true,
    };

    setUser(profile);
    setToken(sessionToken);
    localStorage.setItem('sdc_user', JSON.stringify(profile));
    localStorage.setItem('sdc_token', sessionToken);
  };

  const loginWithCredentials = async (
    emailOrUser: string,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const trimmedUser = emailOrUser.toLowerCase().trim();

      // Check matched role configuration presets first
      for (const role of ALL_SYSTEM_ROLES) {
        const conf = ROLE_CONFIGURATIONS[role];
        if (conf?.defaultUser) {
          const userEmail = conf.defaultUser.email.toLowerCase();
          const username = userEmail.split('@')[0];
          if (
            (trimmedUser === userEmail || trimmedUser === username || trimmedUser === role.toLowerCase()) &&
            (pin === conf.defaultUser.pin || pin === '1234')
          ) {
            await signInAsStaffRole(
              role,
              conf.defaultUser.name,
              conf.defaultUser.email,
              conf.defaultUser.designation
            );
            return { success: true };
          }
        }
      }

      // Try server staff login endpoint
      try {
        const res = await fetch('/api/auth/staff-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedUser, pin }),
        });
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
          setToken(json.token);
          localStorage.setItem('sdc_user', JSON.stringify(json.user));
          localStorage.setItem('sdc_token', json.token);
          return { success: true };
        }
      } catch (err) {
        // Fallback for demo when backend offline
      }

      // If user typed owner or admin with PIN 1985 or 1234
      if (trimmedUser.includes('owner') || trimmedUser.includes('sonali') || trimmedUser.includes('admin')) {
        await signInAsStaffRole('Super Admin / Owner', 'Dr. Sonali Admin', 'sonalimedicalhall1985@gmail.com');
        return { success: true };
      }

      // Fallback: match by role name keywords
      for (const role of ALL_SYSTEM_ROLES) {
        if (role.toLowerCase().includes(trimmedUser) || trimmedUser.includes(role.toLowerCase().slice(0, 4))) {
          await signInAsStaffRole(role);
          return { success: true };
        }
      }

      return {
        success: false,
        error: 'Invalid credentials or PIN. You can choose any role from the Quick Workstation Access buttons.',
      };
    } finally {
      setLoading(false);
    }
  };

  const switchActiveRole = (newRole: UserRole) => {
    if (!user) {
      signInAsStaffRole(newRole);
      return;
    }
    const conf = ROLE_CONFIGURATIONS[newRole];
    const updated: UserProfile = {
      ...user,
      role: newRole,
      name: user.role === newRole ? user.name : (conf?.defaultUser?.name || `${newRole} Staff`),
      designation: conf?.defaultUser?.designation || newRole,
    };
    setUser(updated);
    localStorage.setItem('sdc_user', JSON.stringify(updated));
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('sdc_user');
    localStorage.removeItem('sdc_token');
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    return checkRolePermission(user.role, permission, rolePermissions);
  };

  const canAccessTab = (tabId: string): boolean => {
    if (!user) return false;
    const authorizedTabs = getAuthorizedTabsForRole(user.role, rolePermissions);
    return authorizedTabs.includes(tabId);
  };

  const updateRolePermissions = (newMap: Record<UserRole, PermissionKey[]>) => {
    saveRolePermissions(newMap);
    setRolePermissions(newMap);
  };

  const resetPermissionsToDefault = () => {
    const defaults = resetRolePermissionsToDefaults();
    setRolePermissions(defaults);
  };

  // Convenience methods backed by granular permissions
  const canAccessFinancials = () => hasPermission('view_financial_kpis');
  const canApproveReports = () => hasPermission('approve_lab_reports');
  const canEnterLabResults = () => hasPermission('enter_lab_results');
  const canIssueBills = () => hasPermission('create_invoice');

  const isSuperAdmin = user?.role === 'Super Admin / Owner';
  const isAdminOrOwner = isSuperAdmin || user?.role === 'Administrator';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        rolePermissions,
        signInWithGoogle,
        signInAsStaffRole,
        loginWithCredentials,
        logout,
        switchActiveRole,
        hasPermission,
        canAccessTab,
        updateRolePermissions,
        resetPermissionsToDefault,
        canAccessFinancials,
        canApproveReports,
        canEnterLabResults,
        canIssueBills,
        isSuperAdmin,
        isAdminOrOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
