import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  FileText,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Inbox,
  PenSquare,
  LogOut,
  User as UserIcon,
  ExternalLink,
  Save,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Scene, CharacterProfile } from '../types';
import {
  signInWithGoogle,
  signOutGoogle,
  getCachedAccessToken,
  auth,
} from '../services/firebaseAuth';
import {
  listGmailMessages,
  getGmailMessageDetails,
  createGmailDraft,
  sendGmailMessage,
  getUserGmailProfile,
  GmailMessageItem,
} from '../services/googleWorkspaceService';
import { onAuthStateChanged, User } from 'firebase/auth';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  scenes: Scene[];
  characters: CharacterProfile[];
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  scenes,
  characters,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox'>('compose');

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile data
  const [gmailProfile, setGmailProfile] = useState<{
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
  } | null>(null);

  // Inbox & search
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<{
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
  } | null>(null);
  const [loadingMessageDetail, setLoadingMessageDetail] = useState(false);

  // Compose fields
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(`StoryCast Pitch: ${projectTitle}`);
  const [bodyText, setBodyText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'pitch' | 'costume' | 'screening' | 'blank'>('pitch');
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState(false);

  // Duration helper
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Generate template content
  const generateTemplateBody = (template: 'pitch' | 'costume' | 'screening' | 'blank') => {
    switch (template) {
      case 'pitch':
        return `Hello Team,\n\nHere is the production storyboard and creative overview for our project "${projectTitle}".\n\nPROJECT SUMMARY:\n- Scenes: ${scenes.length}\n- Estimated Duration: ${totalDuration.toFixed(1)}s\n- Cast Members: ${characters.map((c) => c.name).join(', ') || 'Elena, Leo'}\n\nSCENE BREAKDOWN:\n${scenes
          .map(
            (s, idx) =>
              `Scene ${idx + 1} (${s.duration.toFixed(1)}s):\nPrompt: "${s.videoPrompt}"\nNarration: "${s.voiceoverText || 'N/A'}"\nTransition: ${s.transitionEffect || 'None'}\n`
          )
          .join('\n')}\n\nLOCKED CHARACTER CONTINUITY:\n${characters
          .map((c) => `- ${c.name}: ${c.costumeLock || 'Standard costume locked'}`)
          .join('\n')}\n\nGenerated with StoryCast AI Studio.\nPlease review and reply with your feedback.\n\nBest regards,\n${currentUser?.displayName || 'Creative Director'}`;

      case 'costume':
        return `Costume & Wardrobe Continuity Sheet: "${projectTitle}"\n\nAttention Production & VFX Departments:\n\nTo preserve character visual consistency across every AI-rendered shot in Imagen and Veo, the following costume locks are enforced:\n\n${characters
          .map(
            (c) =>
              `CHARACTER: ${c.name.toUpperCase()}\nWardrobe Lock: ${c.costumeLock || 'Flight jacket with orange collar patch, dark auburn low bun.'}\n`
          )
          .join('\n\n')}\nPlease ensure all generated prompts integrate these exact garment descriptions verbatim.\n\nRegards,\n${currentUser?.displayName || 'Art Director'}`;

      case 'screening':
        return `Invitation: Storyboard Screening & Creative Review\n\nProject: "${projectTitle}"\nDuration: ${totalDuration.toFixed(1)} seconds (${scenes.length} animated scenes)\n\nWe are holding an interactive screening session for our latest animatic cut. Please review the attached draft and scene notes at your earliest convenience.\n\nScreening highlights:\n- Master audio & multi-voice synthesis synchronized\n- Film-grade camera dolly & lighting aesthetics\n- Continuity-locked character passes\n\nRSVP or reply directly to this email.\n\nBest,\n${currentUser?.displayName || 'Showrunner'}`;

      case 'blank':
      default:
        return '';
    }
  };

  // Synchronize auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const token = getCachedAccessToken();
      setAccessToken(token);
      if (user && token && isOpen) {
        loadProfileAndMessages(token);
      }
    });
    return unsubscribe;
  }, [isOpen]);

  // Load when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      loadProfileAndMessages(accessToken);
    }
    if (isOpen && !bodyText) {
      setBodyText(generateTemplateBody('pitch'));
      setSubject(`StoryCast Pitch: ${projectTitle}`);
    }
  }, [isOpen, accessToken, projectTitle]);

  const loadProfileAndMessages = async (token: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [profile, inboxItems] = await Promise.all([
        getUserGmailProfile(token).catch(() => null),
        listGmailMessages(token, 10, searchQuery).catch(() => []),
      ]);
      if (profile) setGmailProfile(profile);
      setMessages(inboxItems);
    } catch (err: any) {
      console.warn('Error loading Gmail data:', err);
      setErrorMsg(err.message || 'Failed to connect to Gmail.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { user, accessToken: token } = await signInWithGoogle();
      setCurrentUser(user);
      setAccessToken(token);
      setSuccessMsg(`Connected as ${user.displayName || user.email}`);
      await loadProfileAndMessages(token);
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
      setGmailProfile(null);
      setMessages([]);
      setSelectedMessage(null);
      setSuccessMsg('Signed out of Google account.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out.');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const results = await listGmailMessages(accessToken, 15, searchQuery);
      setMessages(results);
    } catch (err: any) {
      setErrorMsg(err.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = async (msgId: string) => {
    if (!accessToken) return;
    setLoadingMessageDetail(true);
    setErrorMsg(null);
    try {
      const details = await getGmailMessageDetails(accessToken, msgId);
      setSelectedMessage(details);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load email details.');
    } finally {
      setLoadingMessageDetail(false);
    }
  };

  const handleTemplateChange = (tpl: 'pitch' | 'costume' | 'screening' | 'blank') => {
    setSelectedTemplate(tpl);
    setBodyText(generateTemplateBody(tpl));
    if (tpl === 'pitch') setSubject(`StoryCast Pitch: ${projectTitle}`);
    if (tpl === 'costume') setSubject(`Wardrobe Continuity Lock: ${projectTitle}`);
    if (tpl === 'screening') setSubject(`Screening Review & Notes: ${projectTitle}`);
    if (tpl === 'blank') setSubject(`StoryCast Update: ${projectTitle}`);
  };

  const handleSaveDraft = async () => {
    if (!accessToken) {
      setErrorMsg('Please sign in to Google first.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Subject line cannot be empty.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await createGmailDraft(accessToken, recipient, subject, bodyText);
      setSuccessMsg('Draft saved successfully to your Gmail drafts folder!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSendEmail = async () => {
    if (!accessToken) {
      setErrorMsg('Please sign in to Google first.');
      return;
    }
    if (!recipient.trim()) {
      setErrorMsg('Recipient email is required.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Subject line is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setShowConfirmSendDialog(false);
    try {
      await sendGmailMessage(accessToken, recipient.trim(), subject.trim(), bodyText);
      setSuccessMsg(`Email successfully sent to ${recipient}!`);
      // Optionally reset recipient
      setRecipient('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-[#0b0e17] border border-red-500/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden shadow-red-950/20">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0e121e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">Gmail Studio & Communications</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800/40">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Send story pitches, costume lock specs, and collaborate with your cast and crew directly via Gmail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Bar */}
        <div className="px-5 py-2.5 bg-[#090c14] border-b border-zinc-800/60 flex items-center justify-between text-xs">
          {currentUser && accessToken ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs border border-red-500/30">
                {currentUser.displayName ? currentUser.displayName[0] : 'U'}
              </div>
              <span className="text-zinc-200 font-medium">
                {currentUser.displayName || currentUser.email}
              </span>
              {gmailProfile && (
                <span className="text-zinc-500 text-[11px] hidden sm:inline">
                  ({gmailProfile.messagesTotal.toLocaleString()} messages in Gmail)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Connect your Google account to access your Gmail and send messages.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser && accessToken ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium shadow-md shadow-red-600/20 transition-all cursor-pointer text-xs disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Connect Gmail</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-5 pt-3 border-b border-zinc-800/60 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compose'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>Compose & Pitch</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('inbox');
              if (accessToken && messages.length === 0) {
                loadProfileAndMessages(accessToken);
              }
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inbox'
                ? 'border-red-500 text-red-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Inbox & Production Threads</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'compose' ? (
            <div className="space-y-4">
              {/* Template selector */}
              <div>
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Studio Pitch Templates
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pitch', label: '🎬 Full Storyboard Pitch', desc: 'Scenes, durations & prompts' },
                    { id: 'costume', label: '🔒 Wardrobe Continuity', desc: 'Locked character costumes' },
                    { id: 'screening', label: '🍿 Screening Invitation', desc: 'Crew review & feedback request' },
                    { id: 'blank', label: '✉️ Custom Blank Email', desc: 'Write your own message' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleTemplateChange(tpl.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedTemplate === tpl.id
                          ? 'bg-red-950/30 border-red-500/50 text-white'
                          : 'bg-[#111420] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-zinc-100">{tpl.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3 bg-[#111522] p-4 rounded-xl border border-zinc-800">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Recipient (To)</label>
                  <input
                    type="email"
                    placeholder="producer@studio.com, director@film.org"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-300">Message Body</label>
                    <span className="text-[10px] text-zinc-500 font-mono">{bodyText.length} chars</span>
                  </div>
                  <textarea
                    rows={10}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={isLoading || !accessToken}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Gmail Draft</span>
                </button>

                <button
                  onClick={() => {
                    if (!accessToken) {
                      setErrorMsg('Please connect your Gmail account first.');
                      return;
                    }
                    if (!recipient.trim()) {
                      setErrorMsg('Please specify a recipient email address.');
                      return;
                    }
                    setShowConfirmSendDialog(true);
                  }}
                  disabled={isLoading || !accessToken || !recipient.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </button>
              </div>
            </div>
          ) : (
            /* INBOX TAB */
            <div className="space-y-4">
              {/* Search and refresh toolbar */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search messages in Gmail (e.g., storyboard, pitch, review)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111420] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !accessToken}
                  className="px-3 py-2 rounded-lg bg-[#111420] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer disabled:opacity-40"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => accessToken && loadProfileAndMessages(accessToken)}
                  disabled={isLoading || !accessToken}
                  className="p-2 rounded-lg bg-[#111420] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </form>

              {/* Message List or Detail */}
              {selectedMessage ? (
                <div className="bg-[#111420] border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      &larr; Back to Messages
                    </button>
                    <button
                      onClick={() => {
                        setRecipient(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                        setSubject(`Re: ${selectedMessage.subject}`);
                        setActiveTab('compose');
                      }}
                      className="px-2.5 py-1 rounded bg-red-950/40 border border-red-800/40 text-red-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{selectedMessage.subject}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span><strong>From:</strong> {selectedMessage.from}</span>
                      <span><strong>Date:</strong> {selectedMessage.date}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0a0d14] rounded-lg border border-zinc-800/60 font-mono text-xs text-zinc-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                    {selectedMessage.body}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {!accessToken ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">Connect your Gmail account to view your messages.</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">No messages found.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMessage(msg.id)}
                        className="p-3 rounded-xl bg-[#111522] hover:bg-[#161c2e] border border-zinc-800/80 hover:border-red-500/40 transition-all cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-zinc-200 truncate">
                              {msg.from || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                              {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 font-medium truncate mb-1">
                            {msg.subject || '(No Subject)'}
                          </div>
                          <div className="text-[11px] text-zinc-400 line-clamp-2">
                            {msg.snippet}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog for Destructive / Mutating Action */}
        {showConfirmSendDialog && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121624] border border-red-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-600 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Confirm Sending Email</h4>
                  <p className="text-xs text-zinc-400">
                    This will send an email from your authorized Gmail account.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#0a0d14] rounded-lg border border-zinc-800 text-xs space-y-1">
                <div><span className="text-zinc-500">To:</span> <span className="text-zinc-200 font-medium">{recipient}</span></div>
                <div><span className="text-zinc-500">Subject:</span> <span className="text-zinc-200 font-medium">{subject}</span></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmSendDialog(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSendEmail}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
