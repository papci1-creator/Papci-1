import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Star,
  Users,
  MessageSquare,
  CheckCircle2,
  LogOut,
  AlertCircle,
  HelpCircle,
  Film,
} from 'lucide-react';
import { Scene } from '../types';
import {
  signInWithGoogle,
  signOutGoogle,
  getCachedAccessToken,
  GOOGLE_FORMS_SCOPES,
  auth,
} from '../services/firebaseAuth';
import {
  listGoogleForms,
  getGoogleForm,
  getGoogleFormResponses,
  createStoryFeedbackForm,
  GoogleDriveFormFile,
  GoogleFormDetails,
  GoogleFormResponsesResult,
} from '../services/googleFormsService';
import { onAuthStateChanged, User } from 'firebase/auth';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  scenes: Scene[];
}

export const GoogleFormsModal: React.FC<GoogleFormsModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  scenes,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [activeTab, setActiveTab] = useState<'create' | 'browse' | 'responses'>('create');

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms data
  const [driveForms, setDriveForms] = useState<GoogleDriveFormFile[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormDetails, setSelectedFormDetails] = useState<GoogleFormDetails | null>(null);
  const [formResponses, setFormResponses] = useState<GoogleFormResponsesResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Newly created form info
  const [createdFormUrls, setCreatedFormUrls] = useState<{
    formId: string;
    editUrl: string;
    responderUrl: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const token = getCachedAccessToken();
      setAccessToken(token);
      if (user && token && isOpen) {
        loadDriveForms(token);
      }
    });
    return unsubscribe;
  }, [isOpen]);

  // Load drive forms on open if authenticated
  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveForms(accessToken);
    }
  }, [isOpen, accessToken]);

  const loadDriveForms = async (token: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const files = await listGoogleForms(token);
      setDriveForms(files);
    } catch (err: any) {
      console.warn('Error listing Google Forms:', err);
      setErrorMsg(err.message || 'Failed to list Google Forms.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { user, accessToken: token } = await signInWithGoogle(GOOGLE_FORMS_SCOPES);
      setCurrentUser(user);
      setAccessToken(token);
      setSuccessMsg(`Connected as ${user.displayName || user.email}`);
      await loadDriveForms(token);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      setCurrentUser(null);
      setAccessToken(null);
      setDriveForms([]);
      setSelectedFormDetails(null);
      setFormResponses(null);
      setCreatedFormUrls(null);
      setSuccessMsg('Signed out successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing out.');
    }
  };

  const handleCreateScreeningForm = async () => {
    if (!accessToken) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await createStoryFeedbackForm(accessToken, projectTitle, scenes);
      setCreatedFormUrls({
        formId: result.form.formId,
        editUrl: result.editUrl,
        responderUrl: result.responderUrl,
      });
      setSelectedFormId(result.form.formId);
      setSelectedFormDetails(result.form);
      setSuccessMsg('Audience Screening Form created in your Google Drive!');
      // Refresh drive list
      await loadDriveForms(accessToken);
    } catch (err: any) {
      console.error('Create form error:', err);
      setErrorMsg(err.message || 'Failed to create Google Form.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectForm = async (formId: string) => {
    if (!accessToken) return;
    setSelectedFormId(formId);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const details = await getGoogleForm(accessToken, formId);
      setSelectedFormDetails(details);
      const responses = await getGoogleFormResponses(accessToken, formId);
      setFormResponses(responses);
      setActiveTab('responses');
    } catch (err: any) {
      console.warn('Error fetching form data:', err);
      setErrorMsg(err.message || 'Failed to load form details and responses.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Google Forms Integration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-semibold">
                  Workspace Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generate test screening surveys and gather audience feedback on your video scenes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleSignOut}
                className="text-xs text-zinc-400 hover:text-rose-400 px-2.5 py-1 rounded border border-zinc-800 hover:border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Account Bar & Notifications */}
        <div className="px-4 py-2 bg-[#080b13] border-b border-zinc-850 flex items-center justify-between text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-5 h-5 rounded-full border border-cyan-400"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[10px]">
                  {currentUser.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="text-zinc-300 font-medium">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Sign in with your Google account to create and manage forms
            </span>
          )}

          {currentUser && (
            <div className="flex items-center gap-1 bg-[#0c101d] p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Survey
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Drive Forms ({driveForms.length})
              </button>
              <button
                onClick={() => setActiveTab('responses')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'responses'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Responses
              </button>
            </div>
          )}
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {!currentUser ? (
            /* Unauthenticated: Google Sign In Prompt */
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Connect Google Forms</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Authenticate with Google to automatically create test screening surveys, gather
                  audience feedback on scene pacing and dialogue, and review survey submissions.
                </p>
              </div>

              {/* Official Google Sign-In Material Button Style */}
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-850 font-medium rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-semibold text-sm">
                  {isLoading ? 'Connecting Google Account...' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          ) : activeTab === 'create' ? (
            /* Tab 1: Create Screening Survey */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#070a14] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">Story Screening Survey</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {scenes.length} Timeline Shots Included
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Generate an audience reaction survey with pre-configured questions customized to
                  your project:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0c101d] border border-zinc-800 space-y-1">
                    <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      Visual Impact & Style Rating
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      1-5 star rating on atmosphere, colors, and cinematography.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0c101d] border border-zinc-800 space-y-1">
                    <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      Scene Selection Poll
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Viewers choose their favorite shot among the {scenes.length} scenes.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0c101d] border border-zinc-800 space-y-1">
                    <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      Voiceover Cadence & Ducking
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Checks audio ducking balance and dialogue speed.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0c101d] border border-zinc-800 space-y-1">
                    <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Director Revision Notes
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Open paragraph prompt for scene suggestions and critiques.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCreateScreeningForm}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isLoading ? 'Generating Google Form...' : 'Generate Screening Google Form'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Newly Created Form Details Card */}
              {createdFormUrls && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Form Ready in Google Forms</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ID: {createdFormUrls.formId}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300">
                    Your form is live! Share the responder link with your audience or open the
                    editor in Google Forms:
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={createdFormUrls.responderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Form Preview ↗</span>
                    </a>

                    <a
                      href={createdFormUrls.editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Edit in Google Forms ↗</span>
                    </a>

                    <button
                      onClick={() => copyToClipboard(createdFormUrls.responderUrl)}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2e] hover:bg-[#1e2740] border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Audience Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'browse' ? (
            /* Tab 2: Browse Google Drive Forms */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Found {driveForms.length} Google Form(s) in your Google Drive:
                </span>
                <button
                  onClick={() => accessToken && loadDriveForms(accessToken)}
                  className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Forms"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {driveForms.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs bg-[#070a14] rounded-xl border border-zinc-800">
                  No Google Forms found in Google Drive. Click "Create Survey" above to generate your
                  first screening form.
                </div>
              ) : (
                <div className="space-y-2">
                  {driveForms.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-[#070a14] border border-zinc-800 hover:border-purple-500/50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-purple-300 transition-colors">
                            {f.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {f.modifiedTime
                              ? `Updated: ${new Date(f.modifiedTime).toLocaleDateString()}`
                              : 'Google Drive File'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSelectForm(f.id)}
                          className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-xs border border-purple-500/40 transition-colors cursor-pointer"
                        >
                          View Responses
                        </button>
                        {f.webViewLink && (
                          <a
                            href={f.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Tab 3: Responses & Audience Feedback Analytics */
            <div className="space-y-4">
              {selectedFormDetails ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#070a14] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {selectedFormDetails.info.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formResponses?.totalResponses || 0} Audience Submissions Received
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectedFormId && handleSelectForm(selectedFormId)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
                      <a
                        href={`https://docs.google.com/forms/d/${selectedFormDetails.formId}/edit#responses`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Google Forms Analytics ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Form Questions & Received Answers */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Survey Questions:
                    </h5>
                    {selectedFormDetails.items?.map((item, idx) => (
                      <div
                        key={item.itemId || idx}
                        className="p-3 rounded-xl bg-[#070a14] border border-zinc-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-200">
                            {idx + 1}. {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">
                            {item.questionItem?.question.scaleQuestion
                              ? '1-5 Rating'
                              : item.questionItem?.question.choiceQuestion?.type || 'Text'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-zinc-400 italic">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs bg-[#070a14] rounded-xl border border-zinc-800">
                  Select a form from the "Drive Forms" tab or create one to view live audience
                  responses.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0c101d] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Forms API & Google Drive API enabled with user permission</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
