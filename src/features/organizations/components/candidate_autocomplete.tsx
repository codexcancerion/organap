"use client";

import type { CandidateProfile } from "../types";
import type { Key } from "@heroui/react";

import React from "react";
import {
  Autocomplete,
  Avatar,
  Description,
  EmptyState,
  Label,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";

export type CandidateAutocompleteProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  candidates: CandidateProfile[];
  value: string;
  onChange: (userId: string) => void;
  disabledKeys?: string[];
  isDisabled?: boolean;
  isRequired?: boolean;
  emptyMessage?: string;
  variant?: "primary" | "secondary";
};

/**
 * HeroUI v3 Autocomplete selector for university users (Governor, Adviser, Members).
 * Supports instant filtering by full name, school ID, or email.
 */
export function CandidateAutocomplete({
  label,
  description,
  placeholder = "Unassigned (Optional)",
  searchPlaceholder = "Search by name, school ID, or email…",
  candidates,
  value,
  onChange,
  disabledKeys = [],
  isDisabled = false,
  isRequired = false,
  emptyMessage = "No matching profiles found.",
  variant = "primary",
}: CandidateAutocompleteProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  const selectedCandidate = React.useMemo(
    () => candidates.find((c) => c.id === value) ?? null,
    [candidates, value]
  );

  const handleChange = (key: Key | Key[] | null) => {
    if (key == null || Array.isArray(key)) {
      onChange("");

      return;
    }

    onChange(String(key));
  };

  return (
    <Autocomplete
      fullWidth
      aria-label={typeof label === "string" ? label : "Select user"}
      disabledKeys={disabledKeys}
      isDisabled={isDisabled}
      isRequired={isRequired}
      placeholder={placeholder}
      selectionMode="single"
      value={value || null}
      variant={variant}
      onChange={handleChange}
      onClear={() => onChange("")}
    >
      <Label>{label}</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder }) => {
            if (isPlaceholder || !selectedCandidate) {
              return defaultChildren;
            }

            return (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="w-5 h-5 text-[10px] shrink-0" size="sm">
                  {selectedCandidate.avatarUrl ? (
                    <Avatar.Image
                      alt={selectedCandidate.fullName}
                      className="object-cover"
                      src={selectedCandidate.avatarUrl}
                    />
                  ) : null}
                  <Avatar.Fallback className="bg-accent/15 text-accent font-bold">
                    {selectedCandidate.fullName.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">
                  {selectedCandidate.fullName}
                </span>
                {selectedCandidate.schoolId ? (
                  <span className="text-xs text-muted shrink-0">
                    ({selectedCandidate.schoolId})
                  </span>
                ) : null}
              </div>
            );
          }}
        </Autocomplete.Value>
        {value && !isDisabled ? <Autocomplete.ClearButton /> : null}
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>

      {description ? <Description>{description}</Description> : null}

      <Autocomplete.Popover className="min-w-[280px]">
        <Autocomplete.Filter filter={contains}>
          <SearchField
            autoFocus
            aria-label={searchPlaceholder}
            name="candidate-search"
            variant="secondary"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={searchPlaceholder} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            className="max-h-60 overflow-y-auto"
            renderEmptyState={() => (
              <EmptyState className="py-6 text-xs text-muted">{emptyMessage}</EmptyState>
            )}
          >
            {candidates.map((c) => {
              const subtitle = c.schoolId
                ? `ID: ${c.schoolId}${c.email ? ` · ${c.email}` : ""}`
                : c.email ?? "Campus account";

              return (
                <ListBox.Item
                  key={c.id}
                  id={c.id}
                  textValue={`${c.fullName} ${c.schoolId ?? ""} ${c.email ?? ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 py-0.5">
                    <Avatar className="w-7 h-7 text-[11px] shrink-0" size="sm">
                      {c.avatarUrl ? (
                        <Avatar.Image
                          alt={c.fullName}
                          className="object-cover"
                          src={c.avatarUrl}
                        />
                      ) : null}
                      <Avatar.Fallback className="bg-accent/15 text-accent font-bold">
                        {c.fullName.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <Label className="text-xs font-semibold truncate">{c.fullName}</Label>
                      <Description className="text-[11px] text-muted truncate">
                        {subtitle}
                      </Description>
                    </div>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              );
            })}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}
