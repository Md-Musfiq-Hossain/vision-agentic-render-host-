import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { LiveCanvas } from "@/components/LiveCanvas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2, Play, Terminal, Globe, Activity, History,
  Server, CheckCircle2, AlertTriangle, Cpu, Database,
  Sparkles, RefreshCw, Sliders, Eye, EyeOff, BookOpen,
  TrendingUp, Coins, ExternalLink, ShieldCheck, Zap
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: ScraperConsole,
});

type HistoryItem = {
  node_visited: string;
  action_executed: string;
  status: "success" | "passed" | "failed" | "not_found" | "halted" | "healed";
  details: string;
};

type HistoricalLog = {
  id: string;
  timestamp: string;
  target_url: string;
  element_desc: string;
  final_status: "SUCCESS" | "HEALED" | "FAILED";
};

type AgentState = {
  current_step: number;
  page_title: string | null;
  base64_screenshot: string | null;
  viewport_dimensions: { width: number; height: number };
  absolute_click_target: { x: number; y: number } | null;
  element_found: boolean;
  anomaly_detected: boolean;
  history: HistoryItem[];
};

const INITIAL_STATE: AgentState = {
  current_step: 0,
  page_title: null,
  base64_screenshot: null,
  viewport_dimensions: { width: 1280, height: 720 },
  absolute_click_target: null,
  element_found: false,
  anomaly_detected: false,
  history: [],
};

const STATUS_BADGES: Record<HistoryItem["status"], "default" | "secondary" | "outline" | "destructive"> = {
  success: "default",
  passed: "default",
  healed: "secondary",
  failed: "destructive",
  not_found: "destructive",
  halted: "outline",
};

// High-fidelity preset items for testing/demo
const PRESETS = [
  { label: "HackerNews Login", url: "https://news.ycombinator.com/", element: "login button" },
  { label: "GitHub Star Button", url: "https://github.com/trending", element: "star repository button" },
  { label: "Wikipedia Search", url: "https://www.wikipedia.org/", element: "search input box" },
  { label: "Custom App Button", url: "https://app.dashboard.io/", element: "action button" }
];

const MOCK_INITIAL_LOGS: HistoricalLog[] = [
  { id: "SESS-8F3A", timestamp: "5m ago", target_url: "news.ycombinator.com", element_desc: "login button", final_status: "SUCCESS" },
  { id: "SESS-9A1B", timestamp: "15m ago", target_url: "github.com/trending", element_desc: "star repository button", final_status: "HEALED" },
  { id: "SESS-4C9D", timestamp: "1h ago", target_url: "wikipedia.org", element_desc: "search input box", final_status: "SUCCESS" },
  { id: "SESS-1E2F", timestamp: "3h ago", target_url: "tumblr.com", element_desc: "cookie consent banner", final_status: "FAILED" },
];

const HISTORICAL_TRACE_REPLAY: Record<string, { state: AgentState, logs: string[] }> = {
  "SESS-8F3A": {
    state: {
      current_step: 4,
      page_title: "Hacker News",
      base64_screenshot: null,
      viewport_dimensions: { width: 1280, height: 720 },
      absolute_click_target: { x: 1240, y: 51 },
      element_found: true,
      anomaly_detected: false,
      history: [
        { node_visited: "execution_node", action_executed: "browser_handshake_init", status: "success", details: "Opening target browser canvas context for: https://news.ycombinator.com/" },
        { node_visited: "execution_node", action_executed: "viewport_frame_serialize", status: "success", details: "Successfully serialized visual layout matrix into Base64 format." },
        { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "success", details: "Successfully calculated viewport click coordinates using GPT-4o." },
        { node_visited: "validation_node", action_executed: "coordinate_range_assertion", status: "passed", details: "Target coordinate maps verified and cleared against visible viewport boundaries." }
      ]
    },
    logs: [
      "[SYSTEM] Initializing replay session for SESS-8F3A",
      "[FASTAPI] Retrieved execution trajectory from database.",
      "[LANGGRAPH] Loaded 4 execution states.",
      "[VISUALIZER] Grounding target 'login button' at coordinates {x: 1240, y: 51}"
    ]
  },
  "SESS-9A1B": {
    state: {
      current_step: 5,
      page_title: "GitHub Trending",
      base64_screenshot: null,
      viewport_dimensions: { width: 1280, height: 720 },
      absolute_click_target: { x: 1200, y: 104 },
      element_found: true,
      anomaly_detected: true,
      history: [
        { node_visited: "execution_node", action_executed: "browser_handshake_init", status: "success", details: "Opening target browser canvas context for: https://github.com/trending" },
        { node_visited: "execution_node", action_executed: "viewport_frame_serialize", status: "success", details: "Successfully serialized visual layout matrix into Base64 format." },
        { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "failed", details: "Upstream AI model connection timeout. Initiating self-healing path." },
        { node_visited: "healing_node", action_executed: "coordinate_healer_recovery", status: "success", details: "Retrieved cached layout coordinate boundaries for trending layout." },
        { node_visited: "validation_node", action_executed: "coordinate_range_assertion", status: "passed", details: "Healed coordinates verified and cleared." }
      ]
    },
    logs: [
      "[SYSTEM] Initializing replay session for SESS-9A1B",
      "[WARNING] Session reported ANOMALY: Upstream timeout resolved via layout healer cache.",
      "[LANGGRAPH] Recovered coordinates from Django cache matrix: {x: 1200, y: 104}"
    ]
  },
  "SESS-4C9D": {
    state: {
      current_step: 4,
      page_title: "Wikipedia",
      base64_screenshot: null,
      viewport_dimensions: { width: 1280, height: 720 },
      absolute_click_target: { x: 640, y: 360 },
      element_found: true,
      anomaly_detected: false,
      history: [
        { node_visited: "execution_node", action_executed: "browser_handshake_init", status: "success", details: "Opening target browser canvas context for: https://wikipedia.org" },
        { node_visited: "execution_node", action_executed: "viewport_frame_serialize", status: "success", details: "Successfully serialized visual layout matrix into Base64 format." },
        { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "success", details: "Successfully calculated viewport click coordinates using Claude 3.5 Sonnet." },
        { node_visited: "validation_node", action_executed: "coordinate_range_assertion", status: "passed", details: "Target coordinate maps verified." }
      ]
    },
    logs: [
      "[SYSTEM] Initializing replay session for SESS-4C9D",
      "[FASTAPI] Telemetry records loaded.",
      "[VISUALIZER] Grounding target 'search input box' at center {x: 640, y: 360}"
    ]
  },
  "SESS-1E2F": {
    state: {
      current_step: 5,
      page_title: "Tumblr",
      base64_screenshot: null,
      viewport_dimensions: { width: 1280, height: 720 },
      absolute_click_target: null,
      element_found: false,
      anomaly_detected: true,
      history: [
        { node_visited: "execution_node", action_executed: "browser_handshake_init", status: "success", details: "Opening target browser canvas context for: https://tumblr.com" },
        { node_visited: "execution_node", action_executed: "viewport_frame_serialize", status: "success", details: "Successfully serialized visual layout matrix into Base64 format." },
        { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "failed", details: "Element 'cookie consent barrier' not visible on canvas screen." },
        { node_visited: "healing_node", action_executed: "coordinate_healer_recovery", status: "failed", details: "No cached layout boundaries found. Safety switch active." },
        { node_visited: "validation_node", action_executed: "debugger_safety_switch", status: "halted", details: "Infinite execution loop breaker intercepted. Terminating path to preserve API token usage." }
      ]
    },
    logs: [
      "[SYSTEM] Initializing replay session for SESS-1E2F",
      "[CRITICAL] Scraper loop halted: element could not be grounded visually.",
      "[LANGGRAPH] Circuit breaker triggered. State variables dumped."
    ]
  }
};
const FASTAPI_URL = (import.meta.env?.VITE_FASTAPI_URL as string) || "http://localhost:8001";
const DJANGO_URL = (import.meta.env?.VITE_DJANGO_URL as string) || "http://localhost:8000";
const WS_PROTOCOL = FASTAPI_URL.startsWith("https") ? "wss" : "ws";
const FASTAPI_WS_URL = `${FASTAPI_URL.replace(/^https?/, WS_PROTOCOL)}/ws/telemetry`;

export function ScraperConsole() {
  const [targetUrl, setTargetUrl] = useState("https://news.ycombinator.com/");
  const [targetElement, setTargetElement] = useState("login button");
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const [dbLogs, setDbLogs] = useState<HistoricalLog[]>(MOCK_INITIAL_LOGS);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Live monitor state checkers
  const [fastapiOnline, setFastapiOnline] = useState<boolean>(false);
  const [djangoOnline, setDjangoOnline] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [consoleLogs, setConsoleLogs] = useState<string[]>(["[07:12:19] [SYSTEM] AetherScrape Telemetry Engine Initialized.", "[07:12:19] [SYSTEM] Ready to ground visual selector coordinates."]);
  const [forceSim, setForceSim] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Helper to add system log timestamped
  const addLog = (message: string) => {
    const time = new Date().toTimeString().split(" ")[0];
    setConsoleLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  // Poll service health status
  useEffect(() => {
    async function verifyHealth() {
      // Check FastAPI
      try {
        const res = await fetch(`${FASTAPI_URL}/openapi.json`, {
          method: "GET"
        });
        setFastapiOnline(res.ok);
      } catch {
        setFastapiOnline(false);
      }

      // Check Django
      try {
        const res = await fetch(`${DJANGO_URL}/api/scraper_admin/logs/`);
        if (res.ok) {
          setDjangoOnline(true);
          const data = await res.json();
          // Map backend variables safely
          const mapped = data.map((item: any) => ({
            id: item.job_id || item.id || "LOG-ID",
            timestamp: "Persistent",
            target_url: item.target_url || (item.objective ? String(item.objective).substring(0, 20) : "Active Target"),
            element_desc: item.objective || item.element_desc || "Target Element",
            final_status: (item.result || item.final_status || "SUCCESS").toUpperCase() as "SUCCESS" | "HEALED" | "FAILED"
          }));
          setDbLogs(mapped.length > 0 ? mapped : MOCK_INITIAL_LOGS);
        } else {
          setDjangoOnline(false);
        }
      } catch {
        setDjangoOnline(false);
      }
    }

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => clearInterval(interval);
  }, [state.history]);

  // Connect Websocket Telemetry channel
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      setWsStatus("connecting");
      try {
        ws = new WebSocket(FASTAPI_WS_URL);

        ws.onopen = () => {
          setWsStatus("connected");
          addLog("[WEBSOCKET] Telemetry channel connection successful.");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "node_execution") {
              addLog(`[AGENT_LOOP] Entering node "${data.node}" with status "${data.data.status || "processing"}" (step ${data.data.step || 0})`);
            } else {
              addLog(`[TELEMETRY] ${event.data}`);
            }
          } catch {
            addLog(`[TELEMETRY] ${event.data}`);
          }
        };

        ws.onclose = () => {
          setWsStatus("disconnected");
          reconnectTimeout = setTimeout(connectWs, 8000);
        };

        ws.onerror = () => {
          setWsStatus("disconnected");
        };
      } catch {
        setWsStatus("disconnected");
        reconnectTimeout = setTimeout(connectWs, 8000);
      }
    }

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handle Preset Clicks
  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setTargetUrl(preset.url);
    setTargetElement(preset.element);
    toast.success(`Loaded preset: ${preset.label}`);
    addLog(`Preset loaded: target "${preset.element}" on "${preset.url}"`);
  };

  // Load Past Replay traces
  const handleLoadReplay = (jobId: string) => {
    const replay = HISTORICAL_TRACE_REPLAY[jobId];
    if (replay) {
      setSelectedSessionId(jobId);
      setState({
        ...replay.state,
        base64_screenshot: null // Canvas simulator will draw this dynamically based on URL
      });
      setConsoleLogs((prev) => [...prev, ...replay.logs]);
      toast.success(`Inspection trace loaded for session ${jobId}`);
      addLog(`Loaded state visualizer trace matrices for ${jobId}`);
    } else {
      // Create a fallback trace replay if clicking an unknown database log
      const log = dbLogs.find((d) => d.id === jobId);
      const host = log ? log.target_url : "unknown.com";
      const elem = log ? log.element_desc : "target element";
      const isHealed = log?.final_status === "HEALED";
      const isFailed = log?.final_status === "FAILED";

      const fallbackState: AgentState = {
        current_step: isHealed ? 5 : 4,
        page_title: host,
        base64_screenshot: null,
        viewport_dimensions: { width: 1280, height: 720 },
        absolute_click_target: isFailed ? null : { x: 640, y: 360 },
        element_found: !isFailed,
        anomaly_detected: isHealed || isFailed,
        history: [
          { node_visited: "execution_node", action_executed: "browser_handshake_init", status: "success", details: `Opening browser context for: ${host}` },
          { node_visited: "execution_node", action_executed: "viewport_frame_serialize", status: "success", details: "Successfully serialized visual layout matrix into Base64 format." },
          isFailed
            ? { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "failed", details: `Element "${elem}" not groundable on page.` }
            : { node_visited: "execution_node", action_executed: "coordinate_range_assertion", status: "success", details: `Grounding completed.` },
          isHealed
            ? { node_visited: "healing_node", action_executed: "coordinate_healer_recovery", status: "success", details: "Retrieved healed coordinates from persistence caches." }
            : null,
          { node_visited: "validation_node", action_executed: isFailed ? "debugger_safety_switch" : "coordinate_range_assertion", status: isFailed ? "halted" : "passed", details: isFailed ? "Halted execution loops." : "Verified target maps." }
        ].filter(Boolean) as HistoryItem[]
      };

      setSelectedSessionId(jobId);
      setState(fallbackState);
      toast.info(`Generated inspection trace replay for ${jobId}`);
      addLog(`Dynamically resolved trace maps for database session: ${jobId}`);
    }
  };

  // Run the Scraper / simulated scraper
  async function handleExecutionLaunch(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSelectedSessionId(null);
    setState(INITIAL_STATE);
    setConsoleLogs([]);
    addLog(`[SYSTEM] Starting Scrape Loop for url: ${targetUrl}`);
    addLog(`[SYSTEM] Objective element query: "${targetElement}"`);

    // Check if simulation mode is active (either forced or because backends are offline)
    const isOffline = !fastapiOnline;
    if (forceSim || isOffline) {
      addLog("[SYSTEM] FastAPI server not responding. Redirecting to Local Simulation Engine...");
      toast.info("Activating Local Simulation Engine", {
        description: "Visual grounding coordinates and LangGraph steps will run locally."
      });

      // --- SIMULATION STEP TIMERS ---
      // Step 1: Handshake
      await new Promise((r) => setTimeout(r, 1000));
      addLog("[LANGGRAPH] Flow entry: execution_node");
      addLog("[EXECUTION_NODE] Initializing playwright headless browser context...");
      setState((prev) => ({
        ...prev,
        history: [
          {
            node_visited: "execution_node",
            action_executed: "browser_handshake_init",
            status: "success",
            details: `Opening target browser canvas context for: ${targetUrl}`
          }
        ]
      }));

      // Step 2: Viewport Capture
      await new Promise((r) => setTimeout(r, 1200));
      addLog(`[EXECUTION_NODE] Capturing page layout matrix for ${targetUrl}`);
      setState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            node_visited: "execution_node",
            action_executed: "viewport_frame_serialize",
            status: "success",
            details: "Successfully serialized visual layout matrix into Base64 format."
          }
        ],
        page_title: targetUrl.includes("ycombinator") ? "Hacker News" : targetUrl.includes("github") ? "GitHub Trending" : "Target Domain Overview"
      }));

      // Step 3: Grounding Box Calculation
      await new Promise((r) => setTimeout(r, 1400));
      addLog("[VLM] Evaluating screenshot frame buffers with grounding vectors...");
      addLog(`[VLM] Grounding targets matching key string: "${targetElement}"`);

      // Determine mock coordinates based on element request
      let mockTarget = { x: 640, y: 360 };
      if (targetUrl.includes("ycombinator") || targetElement.toLowerCase().includes("login")) {
        mockTarget = { x: 1220, y: 51 }; // top right login on HackerNews mock
      } else if (targetUrl.includes("github") || targetElement.toLowerCase().includes("star")) {
        mockTarget = { x: 1210, y: 104 }; // Star button top right on Github mock
      } else if (targetElement.toLowerCase().includes("button") || targetElement.toLowerCase().includes("action")) {
        mockTarget = { x: 230, y: 145 }; // Action button default
      }

      setState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            node_visited: "execution_node",
            action_executed: "coordinate_range_assertion",
            status: "success",
            details: "Successfully calculated viewport click coordinates using Local Mock Recovery VLM."
          }
        ],
        absolute_click_target: mockTarget
      }));

      // Step 4: Routing to validation
      await new Promise((r) => setTimeout(r, 1000));
      addLog("[LANGGRAPH] Routing to: validation_node");
      addLog("[VALIDATION_NODE] Assumed elements grounded. Asserting coordinates clearance...");

      setState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            node_visited: "validation_node",
            action_executed: "coordinate_range_assertion",
            status: "passed",
            details: "Target coordinate maps verified and cleared against visible viewport boundaries."
          }
        ],
        element_found: true
      }));

      // Finish Simulated Run
      await new Promise((r) => setTimeout(r, 600));
      addLog("[LANGGRAPH] Execution routing validation: END");
      addLog("[SYSTEM] Simulated scraping agent execution completed successfully.");
      toast.success("Simulation grounding successful!");

      // Add to sidebar history
      const newJobId = "SIM-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanUrl = targetUrl.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
      setDbLogs((prev) => [
        {
          id: newJobId,
          timestamp: "Just now",
          target_url: cleanUrl,
          element_desc: targetElement,
          final_status: "SUCCESS"
        },
        ...prev
      ]);
      setSelectedSessionId(newJobId);
      setLoading(false);
      return;
    }

    // --- REAL SYSTEM EXECUTION RUN ---
    try {
      const response = await fetch(`${FASTAPI_URL}/api/v1/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, target_element: targetElement }),
      });

      if (!response.ok) throw new Error(`Handshake Exception: Code ${response.status}`);
      const payload = await response.json();

      setState({
        ...INITIAL_STATE,
        ...payload,
        base64_screenshot: payload.base64_screenshot?.startsWith("data:")
          ? payload.base64_screenshot
          : `data:image/png;base64,${payload.base64_screenshot}`,
      });
      addLog("[SYSTEM] Real-time engine ingest process successfully resolved.");
      toast.success("Grounding session complete!");
    } catch (err) {
      addLog(`[ERROR] Ingest gateway failed: ${err instanceof Error ? err.message : "Handshake dropped"}`);
      setState((prev) => ({
        ...prev,
        anomaly_detected: true,
        history: [
          {
            node_visited: "network_gateway",
            action_executed: "POST /api/v1/ingest",
            status: "failed",
            details: err instanceof Error ? err.message : "Handshake dropped."
          }
        ]
      }));
      toast.error("Execution process dropped.");
    } finally {
      setLoading(false);
    }
  }

  // Calculate success statistics from history log results
  const totalRuns = dbLogs.length;
  const successRuns = dbLogs.filter(d => d.final_status === "SUCCESS" || d.final_status === "HEALED").length;
  const successPercentage = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
  const healedCount = dbLogs.filter(d => d.final_status === "HEALED").length;

  return (
    <div className="dark min-h-screen bg-slate-950 font-sans text-zinc-300 antialiased p-4 md:p-6 selection:bg-purple-900 selection:text-white">
      {/* Background radial soft light blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-950/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-[1700px] space-y-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4 backdrop-blur-sm bg-zinc-950/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/60 border border-purple-800/40 rounded-lg text-purple-400">
              <Zap className="h-5 w-5 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800/50 px-1.5 py-0.5 rounded font-mono font-bold">V2.0 ALPHA</span>
                <span className="text-[10px] text-zinc-500 font-mono">OPERATIONAL CONTROL</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase font-mono">
                AetherScrape <span className="text-purple-400 font-normal">// Visual Grounding Console</span>
              </h1>
            </div>
          </div>

          {/* Micro-Services Telemetry Status Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Server className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-400">Agent API:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className={cn("h-2 w-2 rounded-full", fastapiOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
                {fastapiOnline ? "8001 ON" : "8001 OFF"}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Database className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-400">Ledger DB:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className={cn("h-2 w-2 rounded-full", djangoOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
                {djangoOnline ? "8000 ON" : "8000 OFF"}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Activity className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-400">Websocket:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className={cn(
                  "h-2 w-2 rounded-full", 
                  wsStatus === "connected" && "bg-emerald-500 shadow-[0_0_8px_#10b981]",
                  wsStatus === "connecting" && "bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-ping",
                  wsStatus === "disconnected" && "bg-zinc-700"
                )} />
                {wsStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Analytics Summary Stats Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Grounding Runs</span>
              <span className="text-2xl font-black text-white font-mono">{totalRuns}</span>
            </div>
            <Activity className="h-8 w-8 text-zinc-700" />
          </div>

          <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Grounding Precision</span>
              <span className="text-2xl font-black text-purple-400 font-mono">{successPercentage}%</span>
            </div>
            <ShieldCheck className="h-8 w-8 text-purple-950/60" />
          </div>

          <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Auto-Healed Failures</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{healedCount}</span>
            </div>
            <Sparkles className="h-8 w-8 text-cyan-950/60" />
          </div>

          <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Simulated Fallback</span>
              <span className="text-2xl font-black text-amber-500 font-mono">{forceSim || !fastapiOnline ? "ACTIVE" : "AUTO"}</span>
            </div>
            <Cpu className="h-8 w-8 text-amber-950/60" />
          </div>
        </section>

        {/* Dashboard Workspace */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT SIDE PANEL: Directive inputs & lists (4 columns on xl, 12 on mobile) */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            
            {/* Form Directives Panel */}
            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-xl">
              <CardHeader className="border-b border-zinc-800/50 pb-4">
                <CardTitle className="text-xs uppercase font-bold text-white tracking-wider flex items-center gap-2 font-mono">
                  <Sliders className="h-4 w-4 text-purple-400" /> Operational Directives
                </CardTitle>
                <CardDescription className="text-[11px] text-zinc-500 font-sans">
                  Configure element grounding parameters and trigger autonomous LangGraph trajectory searches.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Presets List */}
                <div className="space-y-1.5">
                  <Label className="text-zinc-500 uppercase tracking-wider text-[9px] font-mono">Directives Presets Shortcuts</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className="px-2.5 py-1 rounded-md text-[10px] bg-zinc-900 hover:bg-purple-950/40 hover:text-purple-400 hover:border-purple-800/40 border border-zinc-800 text-zinc-400 transition-all font-mono"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleExecutionLaunch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="url-input" className="text-zinc-400 uppercase tracking-wider text-[9px] font-mono">Destination Target URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <Input
                        id="url-input"
                        type="url"
                        required
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://news.ycombinator.com/"
                        className="bg-zinc-950 border-zinc-800 pl-9 font-mono text-xs text-white h-9 focus-visible:ring-purple-700/60 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="elem-input" className="text-zinc-400 uppercase tracking-wider text-[9px] font-mono">Semantic Element Query</Label>
                    <Input
                      id="elem-input"
                      type="text"
                      required
                      value={targetElement}
                      onChange={(e) => setTargetElement(e.target.value)}
                      placeholder="e.g. login button"
                      className="bg-zinc-950 border-zinc-800 font-mono text-xs text-white h-9 focus-visible:ring-purple-700/60 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="sim-mode"
                      type="checkbox"
                      checked={forceSim}
                      onChange={(e) => setForceSim(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-purple-800 h-4.5 w-4.5 accent-purple-600"
                    />
                    <label htmlFor="sim-mode" className="text-[10px] text-zinc-400 font-mono cursor-pointer select-none">
                      FORCE OFFLINE SIMULATION MODE
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-xs font-bold uppercase h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all hover:scale-[1.01] shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Executing Trajectory Loop...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current mr-2" />
                        Launch Grounding Agent
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Historical Logging Matrix Panel */}
            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-xl flex flex-col" style={{ maxHeight: "390px" }}>
              <CardHeader className="border-b border-zinc-800/50 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs uppercase font-bold text-white tracking-wider flex items-center gap-2 font-mono">
                    <History className="h-4 w-4 text-purple-400" /> Grounding Log Ledger
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500 font-sans mt-1">
                    Inspect step audit timelines of persistent history caches.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1 divide-y divide-zinc-800/50">
                {dbLogs.map((job) => {
                  const isActive = selectedSessionId === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleLoadReplay(job.id)}
                      className={cn(
                        "p-3 text-left transition-all cursor-pointer hover:bg-zinc-900/40 relative flex justify-between items-center",
                        isActive ? "bg-purple-950/20 border-l-2 border-purple-500" : "border-l-2 border-transparent"
                      )}
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-white">{job.id}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{job.timestamp}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate" title={job.target_url}>
                          {job.target_url}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-medium truncate font-mono">
                          target: {job.element_desc}
                        </div>
                      </div>
                      
                      <Badge
                        variant={job.final_status === "FAILED" ? "destructive" : "secondary"}
                        className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 rounded font-mono",
                          job.final_status === "SUCCESS" && "bg-emerald-950/60 border border-emerald-800/50 text-emerald-400",
                          job.final_status === "HEALED" && "bg-cyan-950/60 border border-cyan-800/50 text-cyan-400",
                          job.final_status === "FAILED" && "bg-red-950/60 border border-red-800/50 text-red-400"
                        )}
                      >
                        {job.final_status}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT VIEWPORT PANEL: Canvas visualizer & trajectory tree (8 columns) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            
            {/* Visualizer Canvas Monitor */}
            <LiveCanvas
              base64Screenshot={state.base64_screenshot}
              absoluteClickTarget={state.absolute_click_target}
              viewportDimensions={state.viewport_dimensions}
              elementFound={state.element_found}
              targetUrl={targetUrl}
              targetElement={targetElement}
              isSimulated={forceSim || !fastapiOnline || selectedSessionId !== null}
              loading={loading}
            />

            {/* LangGraph Timeline Trajectory Step Node Matrix */}
            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/20 px-4 py-3 flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    LangGraph Trajectory Step Audit Ledger
                  </CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500 font-sans">
                    Trace step evaluations, loop break indicators, and autonomous recovery nodes.
                  </CardDescription>
                </div>
                {state.anomaly_detected && (
                  <Badge variant="destructive" className="text-[8px] font-black px-2 py-0.5 animate-pulse bg-red-950 border border-red-800 text-red-400">
                    ANOMALY OVERRIDE TRIGGERED
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 bg-zinc-950/50">
                {state.history.length === 0 ? (
                  <div className="py-12 text-center text-zinc-600 text-xs font-mono flex flex-col items-center gap-2">
                    <Activity className="h-6 w-6 text-zinc-700 animate-pulse" />
                    Awaiting active trace vectors to capture audit steps.
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-zinc-800/80 space-y-6 py-2">
                    {state.history.map((step, idx) => {
                      const isExecution = step.node_visited === "execution_node";
                      const isValidation = step.node_visited === "validation_node";
                      const isHealing = step.node_visited === "healing_node";
                      const isFailed = step.status === "failed";
                      const isHalted = step.status === "halted";

                      return (
                        <div key={idx} className="relative group transition-all">
                          {/* Timeline node icon */}
                          <div className={cn(
                            "absolute -left-[31px] top-1 h-3 w-3 rounded-full border bg-zinc-950 flex items-center justify-center transition-all",
                            isFailed && "border-red-500 shadow-[0_0_8px_#ef4444]",
                            isHalted && "border-amber-500 shadow-[0_0_8px_#f59e0b]",
                            !isFailed && !isHalted && isExecution && "border-purple-500 shadow-[0_0_8px_#a855f7]",
                            !isFailed && !isHalted && isValidation && "border-emerald-500 shadow-[0_0_8px_#10b981]",
                            !isFailed && !isHalted && isHealing && "border-cyan-500 shadow-[0_0_8px_#06b6d4]"
                          )}>
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isFailed && "bg-red-500",
                              isHalted && "bg-amber-500",
                              !isFailed && !isHalted && isExecution && "bg-purple-500",
                              !isFailed && !isHalted && isValidation && "bg-emerald-500",
                              !isFailed && !isHalted && isHealing && "bg-cyan-500"
                            )} />
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-zinc-900/20 border border-zinc-800/30 hover:border-zinc-800 hover:bg-zinc-900/40 p-3 rounded-lg transition-all">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs text-zinc-500 font-bold">STEP 0{idx + 1}</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] font-mono font-bold px-1.5 py-px border bg-zinc-950/80",
                                    isExecution && "border-purple-800/45 text-purple-400",
                                    isValidation && "border-emerald-800/45 text-emerald-400",
                                    isHealing && "border-cyan-800/45 text-cyan-400",
                                    step.node_visited.includes("gateway") && "border-zinc-800 text-zinc-400"
                                  )}
                                >
                                  {step.node_visited}
                                </Badge>
                                <span className="text-white text-xs font-bold font-mono tracking-tight">
                                  {step.action_executed}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 font-sans pl-1">
                                {step.details}
                              </p>
                            </div>
                            
                            <Badge
                              className={cn(
                                "self-start md:self-center text-[9px] font-mono px-2 py-0.5 rounded",
                                step.status === "success" && "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30",
                                step.status === "passed" && "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30",
                                step.status === "healed" && "bg-cyan-950/40 text-cyan-400 border border-cyan-800/30",
                                step.status === "failed" && "bg-red-950/40 text-red-400 border border-red-800/30 animate-pulse",
                                step.status === "halted" && "bg-amber-950/40 text-amber-400 border border-amber-800/30"
                              )}
                            >
                              {step.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-time System Engine Terminal Console */}
            <Card className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60">
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <Terminal className="h-3.5 w-3.5 text-purple-400" /> Live Scraper Engine Console
                </div>
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase border border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-950"
                >
                  Clear Feed
                </button>
              </div>
              <div className="p-4 h-36 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1 bg-zinc-950 flex flex-col">
                {consoleLogs.map((log, index) => {
                  let isError = log.includes("[ERROR]") || log.includes("[CRITICAL]");
                  let isWarning = log.includes("[WARNING]") || log.includes("[WS ERROR]");
                  let isAgent = log.includes("[AGENT_LOOP]");
                  return (
                    <div
                      key={index}
                      className={cn(
                        "leading-relaxed transition-all",
                        isError && "text-red-400 font-semibold bg-red-950/10 px-1.5 rounded",
                        isWarning && "text-amber-400 font-semibold bg-amber-950/10 px-1.5 rounded",
                        isAgent && "text-purple-400"
                      )}
                    >
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}