import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  Download,
  ExternalLink,
  FolderArchive,
  Loader2,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  DriveUploadResult,
  googleSignIn,
  initAuth,
  logoutGoogle,
  uploadZipToGoogleDrive,
} from '../services/googleDriveAuth';

const ZIP_FILENAME = 'Cybernova-TRI26158-FullProject.zip';

export const ProjectZipDriveCard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState<boolean>(false);
  const [confirmUploadModal, setConfirmUploadModal] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<DriveUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchProjectZipBlob = async (): Promise<Blob> => {
    const response = await fetch('/api/export/project-zip');
    if (!response.ok) {
      throw new Error('Failed to generate project ZIP archive on server.');
    }
    return await response.blob();
  };

  const handleDownloadLocalZip = async () => {
    setErrorMsg(null);
    setIsDownloadingZip(true);
    try {
      const blob = await fetchProjectZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ZIP_FILENAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not download ZIP file.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Google Sign-In was cancelled or blocked by popup settings.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConfirmedDriveUpload = async () => {
    setConfirmUploadModal(false);
    setErrorMsg(null);
    setUploadedFile(null);
    setIsUploadingDrive(true);
    try {
      const zipBlob = await fetchProjectZipBlob();
      const result = await uploadZipToGoogleDrive(zipBlob, ZIP_FILENAME);
      setUploadedFile(result);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload ZIP file to Google Drive.');
      if (String(err?.message).includes('401') || String(err?.message).includes('sign in')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setNeedsAuth(true);
    setUploadedFile(null);
  };

  return (
    <section className="bg-[#0E182B] border border-teal-500/40 rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <FolderArchive className="w-4 h-4" />
            <span>Project Source Code Packaging & Google Drive Backup</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Export Cybernova Project as `.ZIP` & Upload to Google Drive
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Package the entire Cybernova full-stack codebase (`src/`, `server.ts`, `package.json`, `README.md`, and configuration files) into <code className="text-teal-300 font-mono">{ZIP_FILENAME}</code> and either download it locally or upload it directly to your Google Drive.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* 1. Direct Native ZIP Download Link (Instant Browser Download) */}
          <a
            href="/api/export/project-zip"
            download={ZIP_FILENAME}
            className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Project .ZIP Now</span>
          </a>

          {/* 2. Google Drive Sign-In or Upload Button */}
          {needsAuth ? (
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={handleGoogleSignIn}
              className="px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-4 h-4 shrink-0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>
                {isLoggingIn ? 'Signing in...' : 'Sign in with Google to Upload to Drive'}
              </span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={isUploadingDrive}
                onClick={() => setConfirmUploadModal(true)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isUploadingDrive ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading ZIP to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Upload ZIP to Google Drive</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                title={`Signed in as ${user?.email || 'Google User'}`}
                className="px-3 py-2.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user?.displayName || user?.email?.split('@')[0]})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Explicit Confirmation Step Before Creating File in Google Drive */}
      {confirmUploadModal && (
        <div className="p-4 bg-[#070D19] border border-teal-500/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-slate-100">
              Confirm Upload to Google Drive?
            </div>
            <p className="text-slate-300">
              This will create and upload <code className="text-teal-300 font-mono">{ZIP_FILENAME}</code> into your Google Drive account ({user?.email}).
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleConfirmedDriveUpload}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Confirm & Upload Now
            </button>
            <button
              type="button"
              onClick={() => setConfirmUploadModal(false)}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload Success Banner */}
      {uploadedFile && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-300">
                Successfully Uploaded to Google Drive!
              </div>
              <div className="text-slate-300 font-mono mt-0.5">
                File: {uploadedFile.name} · Drive ID: {uploadedFile.id}
              </div>
            </div>
          </div>

          {uploadedFile.webViewLink && (
            <a
              href={uploadedFile.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>View File in Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
};
