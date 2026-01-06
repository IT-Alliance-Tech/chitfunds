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
        message: "Failed at update settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
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
          sx={{ mb: 4, color: "#1e293b" }}
        >
          Application Settings
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 3, color: "#1e293b" }}
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
                  sx={{ backgroundColor: "white" }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 3, color: "#1e293b" }}
                >
                  Terms & Conditions (PDF)
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: "#64748b" }}>
                  These terms will appear at the bottom of the Welcome PDF and
                  Invoice receipts.
                </Typography>

                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a new term or condition..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTerm()}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddTerm}
                    sx={{
                      backgroundColor: "#2563eb",
                      borderRadius: "8px",
                      px: 3,
                    }}
                  >
                    ADD
                  </Button>
                </Box>

                <List
                  sx={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    p: 0,
                  }}
                >
                  {settings.termsAndConditions.map((term, index) => (
                    <Box key={index}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={`${index + 1}. ${term}`}
                          primaryTypographyProps={{
                            fontSize: "14px",
                            color: "#334155",
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
                        <Divider />
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

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
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
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
              borderRadius: "8px",
              fontWeight: 700,
              px: 6,
            }}
          >
            {saving ? "SAVING..." : "SAVE ALL SETTINGS"}
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
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
