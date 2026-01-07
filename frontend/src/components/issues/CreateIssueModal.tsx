import { useState, useCallback, useRef } from 'react';
import { X, Bug, ListTodo, BookOpen, Upload, File, Loader2, AlertCircle, Check } from 'lucide-react';
import type { IssueType, IssuePriority } from '../../types';
import { createIssue } from '../../lib/api';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (issueKey: string) => void;
}

interface FormErrors {
  summary?: string;
  details?: string;
  type?: string;
  priority?: string;
}

interface AttachmentFile {
  file: File;
  progress: number;
  error?: string;
}

const TYPE_OPTIONS: { value: IssueType; label: string; icon: typeof Bug; color: string; bgColor: string }[] = [
  { value: 'Bug', label: 'Bug', icon: Bug, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { value: 'Task', label: 'Task', icon: ListTodo, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'Story', label: 'Story', icon: BookOpen, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'Highest', label: 'Highest', color: 'text-red-600 dark:text-red-400' },
  { value: 'High', label: 'High', color: 'text-orange-500 dark:text-orange-400' },
  { value: 'Medium', label: 'Medium', color: 'text-yellow-500 dark:text-yellow-400' },
  { value: 'Low', label: 'Low', color: 'text-gray-500 dark:text-gray-400' },
  { value: 'Lowest', label: 'Lowest', color: 'text-slate-400 dark:text-slate-500' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'pdf', 'mp4', 'webm', 'mov', 'avi', 'zip', 'rar', '7z', 'txt', 'log', 'json', 'xml'];

export function CreateIssueModal({ isOpen, onClose, onSuccess }: CreateIssueModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<IssueType | null>(null);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = useCallback((field: string, value: string) => {
    const newErrors: FormErrors = { ...errors };

    switch (field) {
      case 'summary':
        if (!value.trim()) {
          newErrors.summary = 'Summary is required';
        } else if (value.length > 255) {
          newErrors.summary = 'Summary must be 255 characters or less';
        } else {
          delete newErrors.summary;
        }
        break;
      case 'details':
        if (!value.trim()) {
          newErrors.details = 'Details are required';
        } else if (value.trim().length < 10) {
          newErrors.details = 'Details must be at least 10 characters';
        } else {
          delete newErrors.details;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'summary') validateField('summary', summary);
    if (field === 'details') validateField('details', details);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext} is not allowed`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      newAttachments.push({ file, progress: 0, error: error || undefined });
    });

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTypeSelect = (selectedType: IssueType) => {
    setType(selectedType);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const isFormValid = () => {
    return (
      type !== null &&
      summary.trim().length > 0 &&
      summary.length <= 255 &&
      details.trim().length >= 10 &&
      !attachments.some(a => a.error)
    );
  };

  const handleSubmit = async () => {
    // Validate all fields
    validateField('summary', summary);
    validateField('details', details);
    setTouched({ summary: true, details: true });

    if (!isFormValid() || !type) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build attachment links string from file names (for now, just list them)
      const attachmentLinks = attachments
        .filter(a => !a.error)
        .map(a => a.file.name)
        .join(', ');

      const result = await createIssue({
        summary: summary.trim(),
        details: details.trim(),
        type,
        priority,
        attachmentLinks: attachmentLinks || undefined,
      });

      // Success!
      onSuccess(result.key);
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setType(null);
    setSummary('');
    setDetails('');
    setPriority('Medium');
    setAttachments([]);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {step === 1 ? 'Create New Issue' : `New ${type}`}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Type Selection
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                What type of issue are you reporting?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TYPE_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleTypeSelect(option.value)}
                      className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange transition-all text-left"
                    >
                      <div className={`w-14 h-14 rounded-xl ${option.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${option.color}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {option.value === 'Bug' && 'Report a problem or error'}
                        {option.value === 'Task' && 'Request work to be done'}
                        {option.value === 'Story' && 'Describe a new feature'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Step 2: Issue Details
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (touched.summary) validateField('summary', e.target.value);
                  }}
                  onBlur={() => handleBlur('summary')}
                  placeholder="Summarize the issue briefly"
                  maxLength={255}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.summary && touched.summary
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-relay-orange'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                />
                <div className="flex justify-between mt-1">
                  {errors.summary && touched.summary ? (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.summary}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-sm ${summary.length > 255 ? 'text-red-500' : 'text-gray-400'}`}>
                    {summary.length}/255
                  </span>
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (touched.details) validateField('details', e.target.value);
                  }}
                  onBlur={() => handleBlur('details')}
                  placeholder="Provide as much detail as possible about the issue"
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.details && touched.details
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-relay-orange'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors resize-none`}
                />
                {errors.details && touched.details && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.details}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select according to Issue Reporting SOP
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {PRIORITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        priority === option.value
                          ? 'border-relay-orange bg-relay-orange/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className={option.color}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Attach screenshots, videos, or relevant files (max 10MB each)
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-relay-orange bg-relay-orange/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-relay-orange font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Images, PDFs, videos, or zip files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                  />
                </div>

                {/* Attachment list */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          attachment.error
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <File className={`w-5 h-5 ${attachment.error ? 'text-red-500' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {attachment.file.name}
                          </p>
                          {attachment.error ? (
                            <p className="text-xs text-red-500">{attachment.error}</p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {(attachment.file.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {submitError}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {step === 2 ? (
            <>
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-relay-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Issue
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full text-center text-sm text-gray-500 dark:text-gray-400">
              Select an issue type to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
