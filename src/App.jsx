import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { BrandingProvider } from '@/lib/BrandingContext';
import { useBranding } from '@/hooks/useBranding';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import FileBrowser from './pages/FileBrowser';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import FileViewer from './pages/FileViewer';
import FileEditor from './pages/FileEditor';
import Collections from './pages/Collections';
import Workspace from './pages/Workspace';
import BulkUpload from './pages/BulkUpload';
import Notes from './pages/Notes';
import FloatingNoteButton from './components/notes/FloatingNoteButton';
import DevTasks from './pages/DevTasks';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useBranding();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<FileBrowser />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/dev-tasks" element={<DevTasks />} />
        </Route>
        <Route path="/view" element={<FileViewer />} />
        <Route path="/edit" element={<FileEditor />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <FloatingNoteButton />
    </>
  );
};

function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </BrandingProvider>
  )
}

export default App