export const ORGANIZATION_CATEGORIES = [
  { value: "academic", label: "Academic" },
  { value: "student_government", label: "Student Government" },
  { value: "cultural", label: "Cultural" },
  { value: "service", label: "Service" },
  { value: "sports", label: "Sports" },
  { value: "special_interest", label: "Special Interest" },
] as const;

export const ORGANIZATION_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ORGANIZATION_CATEGORIES.map((c) => [c.value, c.label])
);
