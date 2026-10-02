import React, { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Save,
  CheckCircle2,
  Cpu,
  Key,
  Thermometer,
  Info,
  ExternalLink,
} from "lucide-react";
import { useDocPilot } from "@/context/DocPilotContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ProviderConfig {
  id: string;
  label: string;
  color: string;
  models: { value: string; label: string }[];
  apiKeyPlaceholder: string;
  apiKeyLink?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    color: "bg-blue-500",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
    ],
    apiKeyPlaceholder: "AIza...",
    apiKeyLink: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    label: "OpenAI",
    color: "bg-emerald-500",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    apiKeyPlaceholder: "sk-proj-...",
    apiKeyLink: "https://platform.openai.com/api-keys",
  },
  {
    id: "claude",
    label: "Anthropic Claude",
    color: "bg-orange-500",
    models: [
      { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
    ],
    apiKeyPlaceholder: "sk-ant-api...",
    apiKeyLink: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "groq",
    label: "Groq",
    color: "bg-purple-500",
    models: [
      { value: "llama-3.3-70b-versatile", label: "LLaMA 3.3 70B" },
      { value: "llama-3.1-8b-instant", label: "LLaMA 3.1 8B" },
      { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
      { value: "gemma2-9b-it", label: "Gemma2 9B" },
    ],
    apiKeyPlaceholder: "gsk_...",
    apiKeyLink: "https://console.groq.com/keys",
  },
  {
    id: "ollama",
    label: "Ollama (Local)",
    color: "bg-slate-500",
    models: [
      { value: "llama3.2", label: "LLaMA 3.2" },
      { value: "llama3.1", label: "LLaMA 3.1" },
      { value: "mistral", label: "Mistral" },
      { value: "codellama", label: "Code LLaMA" },
      { value: "phi3", label: "Phi-3" },
    ],
    apiKeyPlaceholder: "Not required for local Ollama",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    color: "bg-pink-500",
    models: [
      { value: "openai/gpt-4o", label: "GPT-4o (via OpenRouter)" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "meta-llama/llama-3.3-70b", label: "LLaMA 3.3 70B" },
      { value: "mistralai/mistral-large", label: "Mistral Large" },
    ],
    apiKeyPlaceholder: "sk-or-...",
    apiKeyLink: "https://openrouter.ai/keys",
  },
];

export function SettingsPage() {
  const { settings, updateSettings, persistSettings } = useDocPilot();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === settings.provider) ?? PROVIDERS[0];

  const handleProviderChange = (providerId: string) => {
    const prov = PROVIDERS.find((p) => p.id === providerId);
    if (prov) {
      updateSettings({
        provider: providerId,
        model: prov.models[0].value,
        api_key: "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await persistSettings();
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 w-full space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-1">LLM Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure your AI provider, model selection, and generation parameters.
        </p>
      </motion.div>

      {/* Provider Selection */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Cpu size={15} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Provider</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {PROVIDERS.map((prov) => (
              <button
                key={prov.id}
                onClick={() => handleProviderChange(prov.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-150 ${
                  settings.provider === prov.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${prov.color}`} />
                <span className="text-xs font-medium leading-tight">{prov.label}</span>
              </button>
            ))}
          </div>

          {/* Model selector */}
          <Select
            label="Model"
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
            options={currentProvider.models}
          />
        </Card>
      </motion.div>

      {/* API Key */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Key size={15} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">API Key</h3>
            {settings.api_key && (
              <Badge variant="success" className="ml-auto">
                <CheckCircle2 size={10} />
                Connected
              </Badge>
            )}
          </div>

          <Input
            label={`${currentProvider.label} API Key`}
            value={settings.api_key}
            onChange={(e) => updateSettings({ api_key: e.target.value })}
            isPassword={true}
            placeholder={currentProvider.apiKeyPlaceholder}
            disabled={settings.provider === "ollama"}
          />

          {settings.provider === "ollama" ? (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
              <Info size={12} className="flex-shrink-0 mt-0.5 text-blue-400" />
              Ollama runs locally. No API key required. Ensure Ollama is running at{" "}
              <code className="font-mono text-primary">localhost:11434</code>.
            </div>
          ) : currentProvider.apiKeyLink ? (
            <a
              href={currentProvider.apiKeyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink size={11} />
              Get your {currentProvider.label} API key
            </a>
          ) : null}
        </Card>
      </motion.div>

      {/* Temperature */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Thermometer size={15} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Generation Parameters</h3>
          </div>

          <Slider
            label="Temperature"
            value={settings.temperature}
            min={0}
            max={2}
            step={0.01}
            displayValue={settings.temperature.toFixed(2)}
            onChange={(e) =>
              updateSettings({ temperature: parseFloat(e.target.value) })
            }
          />

          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">More focused & deterministic</span>
            <span className="text-[11px] text-muted-foreground">More creative & random</span>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border text-xs text-muted-foreground flex items-start gap-2">
            <Info size={12} className="flex-shrink-0 mt-0.5 text-primary" />
            Temperature controls response randomness. Use{" "}
            <span className="text-foreground font-medium">0.0–0.3</span> for factual Q&A,{" "}
            <span className="text-foreground font-medium">0.7–1.0</span> for creative tasks.
          </div>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="gradient"
          size="lg"
          onClick={handleSave}
          loading={saving}
          className="w-full"
        >
          {saved ? (
            <>
              <CheckCircle2 size={16} />
              Settings Saved!
            </>
          ) : (
            <>
              <Save size={16} />
              Save Settings
            </>
          )}
        </Button>
        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-emerald-400 mt-2"
          >
            Configuration saved to local storage
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
