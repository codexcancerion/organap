"use client";

import React from "react";
import {
  Button,
  Chip,
  Label,
  ListBox,
  Popover,
  Select,
} from "@heroui/react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";

export type CatalogFilterOption = {
  id: string;
  label: string;
};

export type CatalogFilterField = {
  id: string;
  label: string;
  ariaLabel?: string;
  value: string;
  defaultValue?: string;
  options: CatalogFilterOption[];
  onChange: (value: string) => void;
};

export type CatalogFilterDropdownProps = {
  filters: CatalogFilterField[];
  triggerLabel?: string;
  className?: string;
};

/**
 * Standardized toolbar filter control for OrGanap catalogs and tables:
 * - Single filter (1 field): renders a direct HeroUI Select dropdown.
 * - Multiple filters (2+ fields): renders a unified HeroUI Popover dropdown
 *   housing all filter Select controls, an active count badge, and a Reset button.
 */
export function CatalogFilterDropdown({
  filters,
  triggerLabel = "Filters",
  className,
}: CatalogFilterDropdownProps) {
  if (filters.length === 0) {
    return null;
  }

  if (filters.length === 1) {
    const field = filters[0];
    const defaultVal = field.defaultValue ?? "all";

    return (
      <Select
        aria-label={field.ariaLabel ?? field.label}
        className={className ?? "w-full md:w-56"}
        value={field.value}
        onChange={(val) => field.onChange(val != null ? String(val) : defaultVal)}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {field.options.map((opt) => (
              <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                {opt.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    );
  }

  const activeCount = filters.reduce((acc, field) => {
    const defaultVal = field.defaultValue ?? "all";

    return field.value !== defaultVal ? acc + 1 : acc;
  }, 0);

  const handleResetAll = () => {
    for (const field of filters) {
      const defaultVal = field.defaultValue ?? "all";

      if (field.value !== defaultVal) {
        field.onChange(defaultVal);
      }
    }
  };

  return (
    <Popover>
      <Button
        aria-label={
          activeCount > 0
            ? `${triggerLabel} (${activeCount} active)`
            : triggerLabel
        }
        className={
          className ??
          "w-full md:w-auto md:min-w-44 justify-between font-normal bg-surface border border-border/50 hover:border-border"
        }
        variant="secondary"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="text-muted shrink-0" size={15} />
          <span>{triggerLabel}</span>
          {activeCount > 0 ? (
            <Chip color="accent" size="sm" variant="soft">
              {activeCount}
            </Chip>
          ) : null}
        </span>
        <ChevronDown className="text-muted shrink-0" size={15} />
      </Button>

      <Popover.Content className="w-72 sm:w-80 p-0" placement="bottom end">
        <Popover.Dialog className="p-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/30">
            <Popover.Heading className="text-xs font-semibold uppercase tracking-wider text-muted">
              Filter Options
            </Popover.Heading>
            {activeCount > 0 ? (
              <Button
                className="h-6 px-2 text-xs"
                size="sm"
                variant="ghost"
                onPress={handleResetAll}
              >
                <RotateCcw size={12} />
                Reset
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {filters.map((field) => {
              const defaultVal = field.defaultValue ?? "all";

              return (
                <Select
                  key={field.id}
                  fullWidth
                  aria-label={field.ariaLabel ?? field.label}
                  value={field.value}
                  variant="secondary"
                  onChange={(val) =>
                    field.onChange(val != null ? String(val) : defaultVal)
                  }
                >
                  <Label className="text-xs font-medium text-foreground">
                    {field.label}
                  </Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {field.options.map((opt) => (
                        <ListBox.Item
                          key={opt.id}
                          id={opt.id}
                          textValue={opt.label}
                        >
                          {opt.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              );
            })}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
