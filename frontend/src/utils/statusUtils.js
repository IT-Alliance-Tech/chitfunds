/**
 * Shared status color mapping for consistent UI across pages
 */
export const getStatusColor = (status) => {
  const s = status?.toLowerCase();

  // Success / Green
  if (["active", "paid", "upcoming"].includes(s)) {
    return { bg: "#dcfce7", text: "#166534" };
  }

  // Danger / Red
  if (["inactive", "overdue", "closed", "completed"].includes(s)) {
    return { bg: "#fee2e2", text: "#991b1b" };
  }

  // Warning / Amber
  if (["partial", "pending"].includes(s)) {
    return { bg: "#fef3c7", text: "#92400e" };
  }

  // Default / Gray
  return { bg: "#f1f5f9", text: "#475569" };
};

/**
 * Shared MUI Table Header Styles
 */
export const tableHeaderSx = {
  backgroundColor: "#e2e8f0",
  "& th": {
    fontWeight: 700,
    fontSize: "12px",
    color: "#1e293b",
    textTransform: "uppercase",
    py: 1.5,
    borderBottom: "1px solid #cbd5e1",
  },
};
