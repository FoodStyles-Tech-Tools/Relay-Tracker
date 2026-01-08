import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Filter } from "lucide-react";
import type { IssueType, IssuePriority, IssueStatus, Tool } from "../../types";

// Tool options for filtering by project/label
const TOOL_OPTIONS: Tool[] = [
  "AI",
  "Curator",
  "Metadata",
  "AutoEat",
  "Himera",
  "Mobile App",
  "MenuCurator",
  "Reports",
];

interface FilterBarProps {
  selectedStatuses: IssueStatus[];
  selectedPriorities: IssuePriority[];
  selectedTypes: IssueType[];
  selectedTools?: Tool[];
  onStatusChange: (statuses: IssueStatus[]) => void;
  onPriorityChange: (priorities: IssuePriority[]) => void;
  onTypeChange: (types: IssueType[]) => void;
  onToolChange?: (tools: Tool[]) => void;
  onClearAll: () => void;
}

// Jira workflow statuses
const STATUS_OPTIONS: IssueStatus[] = [
  "SQA INVESTIGATION",
  "TO DO",
  "SELECTED FOR DEVELOPMENT",
  "REOPENED",
  "IN PROGRESS",
  "DEV COMPLETE",
  "DEPLOYED TO DEV",
  "QA",
  "QA IN PROGRESS",
  "QA PASSED",
  "CANCELLED",
  "DONE",
];
const PRIORITY_OPTIONS: IssuePriority[] = [
  "Highest",
  "High",
  "Medium",
  "Low",
  "Lowest",
];
const TYPE_OPTIONS: IssueType[] = ["Bug", "Task", "Story"];

// Status colors for pills - matching Jira workflow
const statusColors: Record<string, string> = {
  "SQA INVESTIGATION":
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "TO DO": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "SELECTED FOR DEVELOPMENT":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REOPENED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "IN PROGRESS": "bg-blue-600 text-white dark:bg-blue-600 dark:text-white",
  "DEV COMPLETE":
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "DEPLOYED TO DEV":
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  QA: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "QA IN PROGRESS": "bg-pink-600 text-white dark:bg-pink-600 dark:text-white",
  "QA PASSED": "bg-green-600 text-white dark:bg-green-600 dark:text-white",
  CANCELLED:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  // Legacy status support
  Open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "To Do": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "In Progress": "bg-blue-600 text-white dark:bg-blue-600 dark:text-white",
  "In Review":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  Cancelled:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

// Priority colors
const priorityColors: Record<IssuePriority, string> = {
  Highest: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Lowest: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

// Type colors
const typeColors: Record<IssueType, string> = {
  Bug: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Task: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Story: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

// Tool colors
const toolColors: Record<Tool, string> = {
  AI: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Curator: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  Metadata:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  AutoEat: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  Himera: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Mobile App": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  MenuCurator:
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  Reports:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  colorMap?: Record<T, string>;
}

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  colorMap,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
          selected.length > 0
            ? "border-relay-orange bg-relay-orange/10 text-relay-orange"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-relay-orange text-white rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selected.includes(option)
                    ? "bg-relay-orange border-relay-orange"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {selected.includes(option) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  colorMap?.[option] ||
                  "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  selectedStatuses,
  selectedPriorities,
  selectedTypes,
  selectedTools = [],
  onStatusChange,
  onPriorityChange,
  onTypeChange,
  onToolChange,
  onClearAll,
}: FilterBarProps) {
  const totalFilters =
    selectedStatuses.length +
    selectedPriorities.length +
    selectedTypes.length +
    selectedTools.length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter icon and label */}
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatuses}
          onChange={onStatusChange}
          colorMap={statusColors}
        />

        <MultiSelectDropdown
          label="Priority"
          options={PRIORITY_OPTIONS}
          selected={selectedPriorities}
          onChange={onPriorityChange}
          colorMap={priorityColors}
        />

        <MultiSelectDropdown
          label="Type"
          options={TYPE_OPTIONS}
          selected={selectedTypes}
          onChange={onTypeChange}
          colorMap={typeColors}
        />

        {onToolChange && (
          <MultiSelectDropdown
            label="Tool"
            options={TOOL_OPTIONS}
            selected={selectedTools}
            onChange={onToolChange}
            colorMap={toolColors}
          />
        )}
      </div>

      {/* Clear all button */}
      {totalFilters > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all ({totalFilters})
        </button>
      )}
    </div>
  );
}
