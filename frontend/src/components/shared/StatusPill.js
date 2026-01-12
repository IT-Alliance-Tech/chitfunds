import React from "react";
import { Box } from "@mui/material";
import { getStatusColor } from "@/utils/statusUtils";

/**
 * Shared Status Pill component
 */
const StatusPill = ({ status }) => {
  const { bg, text } = getStatusColor(status);

  return (
    <Box
      sx={{
        display: "inline-block",
        px: 1.5,
        py: 0.5,
        borderRadius: "12px",
        backgroundColor: bg,
        color: text,
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        textAlign: "center",
        minWidth: "70px",
      }}
    >
      {status}
    </Box>
  );
};

export default StatusPill;
