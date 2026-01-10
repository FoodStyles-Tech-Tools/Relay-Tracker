import { useState, useEffect } from "react";
import { MainLayout } from "../components";
import { useAuth } from "../hooks/useAuth";
import {
  Mail,
  Plus,
  Trash2,
  Search,
  Shield,
  AlertCircle,
  X,
  Loader2,
  Info,
} from "lucide-react";
import {
  fetchWhitelistedEmails,
  addEmailToWhitelist,
  removeEmailFromWhitelist,
} from "../lib/api";
import type { WhitelistEmail } from "../types";
import { showToast } from "../components";

function AddEmailModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmailToWhitelist(email, notes || undefined);
      showToast({
        type: "success",
        title: "Email added",
        message: `${email} has been added to the whitelist`,
      });
      setEmail("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add email");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Email to Whitelist
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-relay-orange focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., New team member, Marketing department"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-relay-orange focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-relay-gradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmRemoveModal({
  email,
  onConfirm,
  onCancel,
  isRemoving,
}: {
  email: string;
  onConfirm: () => void;
  onCancel: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Remove Email
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Are you sure you want to remove this email from the whitelist?
        </p>
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {email}
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
          This user will no longer be able to sign in to Relay.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhitelistManagementPage() {
  const { hasRole } = useAuth();
  const [emails, setEmails] = useState<WhitelistEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [emailToRemove, setEmailToRemove] = useState<WhitelistEmail | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const loadEmails = async () => {
    try {
      setError(null);
      const data = await fetchWhitelistedEmails();
      setEmails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const handleRemove = async () => {
    if (!emailToRemove) return;

    setIsRemoving(true);
    try {
      await removeEmailFromWhitelist(emailToRemove.id);
      showToast({
        type: "success",
        title: "Email removed",
        message: `${emailToRemove.email} has been removed from the whitelist`,
      });
      setEmailToRemove(null);
      loadEmails();
    } catch (err) {
      showToast({
        type: "error",
        title: "Failed to remove email",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Filter emails by search query
  const filteredEmails = emails.filter(
    (e) =>
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.added_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is admin
  if (!hasRole("admin")) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-relay-gradient flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Email Whitelist
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage who can access Relay
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Private Access Control</p>
              <p>
                Only whitelisted emails can sign in with Google OAuth. Users not
                on this list will be denied access when attempting to sign in.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-relay-orange focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-relay-gradient rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Email
          </button>
        </div>

        {/* Email List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-relay-orange animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={loadEmails}
                className="mt-4 text-sm text-relay-orange hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? "No emails match your search"
                  : "No whitelisted emails yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 text-sm text-relay-orange hover:underline"
                >
                  Add your first email
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {email.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {email.email}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {email.notes && (
                          <>
                            <span className="truncate max-w-[200px]">
                              {email.notes}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>
                          Added{" "}
                          {new Date(email.created_at).toLocaleDateString()}
                        </span>
                        {email.added_by_name && (
                          <>
                            <span>•</span>
                            <span>by {email.added_by_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailToRemove(email)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove from whitelist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {!isLoading && !error && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {filteredEmails.length} of {emails.length} email
            {emails.length !== 1 ? "s" : ""} shown
          </p>
        )}
      </div>

      {/* Add Email Modal */}
      <AddEmailModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadEmails}
      />

      {/* Confirm Remove Modal */}
      {emailToRemove && (
        <ConfirmRemoveModal
          email={emailToRemove.email}
          onConfirm={handleRemove}
          onCancel={() => setEmailToRemove(null)}
          isRemoving={isRemoving}
        />
      )}
    </MainLayout>
  );
}
