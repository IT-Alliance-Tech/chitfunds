"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import { apiRequest } from "@/config/api";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    termsAndConditions: [],
    companyName: "",
    paymentDueDate: 10,
  });
  const [newTerm, setNewTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiRequest("/settings");
      setSettings(res.data.settings);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setSnackbar({
        open: true,
        message: "Failed to load settings",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, newTerm.trim()],
    }));
    setNewTerm("");
  };

  const handleDeleteTerm = (index) => {
    setSettings((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("/settings/update", "POST", settings);
      setSnackbar({
        open: true,
        message: "Settings updated successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to update settings:", err);
      setSnackbar({
        open: true,
        message: "Failed to update settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#10b981" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ mb: 4, color: "#0f172a", letterSpacing: "-0.02em" }}
        >
          Application Settings
        </Typography>

        <Grid container spacing={4}>
          {/* General & Payment Settings */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                height: "100%",
                background: "white",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    mb: 3,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  General Branding
                </Typography>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      "&.Mui-focused fieldset": { borderColor: "#10b981" },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                height: "100%",
                background: "white",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 3, color: "#0f172a" }}
                >
                  Payment Settings
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Default Due Day of Month"
                  helperText="Day of month when payments are considered overdue (1-31)"
                  value={settings.paymentDueDate}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 31) {
                      setSettings({ ...settings, paymentDueDate: val });
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      "&.Mui-focused fieldset": { borderColor: "#10b981" },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Terms & Conditions */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                background: "white",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 1, color: "#0f172a" }}
                >
                  Terms & Conditions (PDF)
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: "#64748b" }}>
                  These terms appear on Welcome PDFs and Invoice receipts.
                </Typography>

                <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a new term or condition..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTerm()}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        "&.Mui-focused fieldset": { borderColor: "#10b981" },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddTerm}
                    sx={{
                      backgroundColor: "#0f172a",
                      "&:hover": { backgroundColor: "#1e293b" },
                      borderRadius: "12px",
                      px: 4,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Add
                  </Button>
                </Box>

                <List
                  sx={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "16px",
                    p: 1,
                  }}
                >
                  {settings.termsAndConditions.map((term, index) => (
                    <Box key={index}>
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={term}
                          primaryTypographyProps={{
                            fontSize: "14px",
                            color: "#334155",
                            fontWeight: 500,
                          }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteTerm(index)}
                          >
                            <DeleteIcon sx={{ color: "#ef4444" }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < settings.termsAndConditions.length - 1 && (
                        <Divider sx={{ mx: 2 }} />
                      )}
                    </Box>
                  ))}
                  {settings.termsAndConditions.length === 0 && (
                    <ListItem sx={{ py: 4, justifyContent: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No terms added yet.
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            sx={{
              backgroundColor: "#10b981",
              "&:hover": { backgroundColor: "#059669" },
              borderRadius: "12px",
              fontWeight: 800,
              px: 8,
              py: 1.5,
              fontSize: "1rem",
              boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)",
              textTransform: "none",
            }}
          >
            {saving ? "Saving Changes..." : "Save All Settings"}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            borderRadius: "12px",
            fontWeight: 600,
            backgroundColor:
              snackbar.severity === "success" ? "#10b981" : undefined,
            color: snackbar.severity === "success" ? "white" : undefined,
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
