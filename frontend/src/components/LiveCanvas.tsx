import { useEffect, useRef, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Globe, ZoomIn, ZoomOut, Maximize2, ShieldAlert, Eye } from "lucide-react";

interface LiveCanvasProps {
  base64Screenshot: string | null;
  absoluteClickTarget: { x: number; y: number } | null;
  viewportDimensions: { width: number; height: number };
  elementFound: boolean;
  targetUrl?: string;
  targetElement?: string;
  isSimulated?: boolean;
  loading?: boolean;
}

export function LiveCanvas({
  base64Screenshot,
  absoluteClickTarget,
  viewportDimensions,
  elementFound,
  targetUrl = "https://news.ycombinator.com/",
  targetElement = "login button",
  isSimulated = false,
  loading = false,
}: LiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImageElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!base64Screenshot) {
      setImageElement(null);
      return;
    }
    const img = new Image();
    img.src = base64Screenshot;
    img.onload = () => setImageElement(img);
  }, [base64Screenshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderOverlayMatrix = () => {
      try {
        const rect = container.getBoundingClientRect();
        // Set fixed aspect ratio size on canvas
        canvas.width = rect.width;
        canvas.height = rect.width * (10 / 16); // 16:10 aspect ratio

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (image) {
          // Draw real screenshot
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        } else if (isSimulated) {
          // --- DRAW BEAUTIFUL BROWSER SIMULATION ---
          ctx.fillStyle = "#0c0a09"; // Stone 950
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Address Bar Area
          ctx.fillStyle = "#1c1917"; // Stone 900
          ctx.fillRect(0, 0, canvas.width, 36);

          // Address Input Box
          ctx.fillStyle = "#292524"; // Stone 800
          ctx.strokeStyle = "rgba(120, 113, 108, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(100, 6, Math.max(0, canvas.width - 200), 24, 6);
          ctx.fill();
          ctx.stroke();

        // Target URL text in address bar
        ctx.fillStyle = "#a8a29e"; // Stone 400
        ctx.font = "10px sans-serif";
        ctx.fillText("https://" + targetUrl.replace(/https?:\/\//, ""), 120, 21);

        // Simulation Indicator Badge (top right of browser bar)
        ctx.fillStyle = "rgba(249, 115, 22, 0.15)";
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.beginPath();
        ctx.roundRect(canvas.width - 90, 8, 80, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("SIMULATED", canvas.width - 77, 21);

        // Browser control circles (top-left)
        ctx.fillStyle = "#ef4444"; // Red
        ctx.beginPath(); ctx.arc(15, 18, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = "#eab308"; // Yellow
        ctx.beginPath(); ctx.arc(30, 18, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = "#22c55e"; // Green
        ctx.beginPath(); ctx.arc(45, 18, 5, 0, 2 * Math.PI); ctx.fill();

        // --- WEB PAGE CONTENT AREA ---
        const pageY = 36;
        const pageH = canvas.height - pageY;

        if (targetUrl.includes("ycombinator.com") || targetUrl.includes("news")) {
          // --- HACKER NEWS STYLE SIMULATOR ---
          // Header Bar
          ctx.fillStyle = "#ff6600";
          ctx.fillRect(0, pageY, canvas.width, 24);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("Y", 10, pageY + 16);

          ctx.fillStyle = "#000000";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("Hacker News", 28, pageY + 16);

          ctx.fillStyle = "#222222";
          ctx.font = "10px sans-serif";
          ctx.fillText("new | past | comments | ask | show | jobs | submit", 110, pageY + 15);

          // Top right login
          ctx.fillStyle = "#000000";
          ctx.font = "10px sans-serif";
          const loginTextWidth = ctx.measureText("login").width;
          const loginX = canvas.width - loginTextWidth - 15;
          const loginY = pageY + 15;
          ctx.fillText("login", loginX, loginY);

          // Page Body Background
          ctx.fillStyle = "#f6f6ef";
          ctx.fillRect(0, pageY + 24, canvas.width, pageH - 24);

          // News items
          ctx.fillStyle = "#000000";
          ctx.font = "11px sans-serif";
          const titles = [
            "1. DeepMind reveals new vision-language agent architectures (deepmind.com)",
            "2. Why agentic scrapers will replace declarative crawlers (medium.com)",
            "3. Show HN: Antigravity - A fully autonomous pair programming assistant (github.com/google)",
            "4. Show HN: Vision-Agentic Console 2.0 (github.com/vision-agentic)",
            "5. Ask HN: What models do you use for visual element grounding?",
            "6. Standardizing bounding boxes for semantic click targets (arxiv.org)",
            "7. Show HN: AetherScrape Visual Agent (aetherscrape.io)"
          ];

          for (let i = 0; i < titles.length; i++) {
            const itemY = pageY + 45 + i * 26;
            ctx.fillStyle = "#000000";
            ctx.fillText(titles[i], 15, itemY);

            ctx.fillStyle = "#828282";
            ctx.font = "9px sans-serif";
            ctx.fillText(`${100 - i * 12} points by developer | ${i + 1} hours ago | ${12 - i} comments`, 28, itemY + 12);
          }

          // If looking for login button, draw bounding selector box around the mock login link
          if (targetElement.toLowerCase().includes("login")) {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.7)"; // Purple
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            // Coordinates matching the text
            ctx.strokeRect(loginX - 4, loginY - 10, loginTextWidth + 8, 14);
            ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
            ctx.fillRect(loginX - 4, loginY - 10, loginTextWidth + 8, 14);
            ctx.setLineDash([]);
          }

        } else if (targetUrl.includes("github.com") || targetUrl.includes("github")) {
          // --- GITHUB STYLE SIMULATOR ---
          // Main Body Background
          ctx.fillStyle = "#0d1117";
          ctx.fillRect(0, pageY, canvas.width, pageH);

          // Nav Bar
          ctx.fillStyle = "#161b22";
          ctx.fillRect(0, pageY, canvas.width, 36);
          ctx.strokeStyle = "#30363d";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, pageY + 36);
          ctx.lineTo(canvas.width, pageY + 36);
          ctx.stroke();

          // Logo & Search
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText("GitHub", 15, pageY + 22);

          ctx.fillStyle = "#21262d";
          ctx.strokeStyle = "#30363d";
          ctx.beginPath();
          ctx.roundRect(80, pageY + 6, 120, 24, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#8b949e";
          ctx.font = "10px sans-serif";
          ctx.fillText("Search or jump to...", 90, pageY + 21);

          // Main Repo Area
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 15px sans-serif";
          ctx.fillText("vision-agentic / vision-agentic-scraper", 15, pageY + 70);

          ctx.fillStyle = "#58a6ff";
          ctx.font = "12px sans-serif";
          ctx.fillText("Public", 320, pageY + 68);

          // Repo Tabs
          ctx.fillStyle = "#8b949e";
          ctx.font = "11px sans-serif";
          ctx.fillText("Code      Issues      Pull requests      Actions      Projects      Wiki", 15, pageY + 105);
          ctx.strokeStyle = "#30363d";
          ctx.beginPath();
          ctx.moveTo(0, pageY + 115);
          ctx.lineTo(canvas.width, pageY + 115);
          ctx.stroke();

          // Star button at top-right
          const starX = canvas.width - 100;
          const starY = pageY + 54;
          ctx.fillStyle = "#21262d";
          ctx.strokeStyle = "#30363d";
          ctx.beginPath();
          ctx.roundRect(starX, starY, 80, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#c9d1d9";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("★ Star  8.4k", starX + 10, starY + 17);

          if (targetElement.toLowerCase().includes("star")) {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(starX - 4, starY - 2, 88, 30);
            ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
            ctx.fillRect(starX - 4, starY - 2, 88, 30);
            ctx.setLineDash([]);
          }

        } else {
          // --- DEFAULT MODERN WEB PAGE ---
          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, pageY, canvas.width, pageH);

          // Sidebar
          ctx.fillStyle = "#18181b";
          ctx.fillRect(0, pageY, 150, pageH);
          ctx.strokeStyle = "#27272a";
          ctx.beginPath();
          ctx.moveTo(150, pageY);
          ctx.lineTo(150, canvas.height);
          ctx.stroke();

          ctx.fillStyle = "#71717a";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText("DASHBOARD", 15, pageY + 25);
          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#a1a1aa";
          ctx.fillText("Overview", 15, pageY + 50);
          ctx.fillText("Analytics", 15, pageY + 75);
          ctx.fillText("Settings", 15, pageY + 100);

          // Content Cards
          ctx.fillStyle = "#18181b";
          ctx.strokeStyle = "#27272a";
          
          // Card 1
          ctx.beginPath(); ctx.roundRect(170, pageY + 20, Math.max(0, canvas.width - 190), 60, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("Vision Agentic Scraper Active Session", 185, pageY + 40);
          ctx.fillStyle = "#71717a";
          ctx.font = "10px sans-serif";
          ctx.fillText(`Awaiting instructions to target: ${targetElement}`, 185, pageY + 58);

          // Card 2 (Button layout)
          const btnX = 170;
          const btnY = pageY + 95;
          ctx.fillStyle = "#27272a";
          ctx.beginPath(); ctx.roundRect(btnX, btnY, 120, 30, 4); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("Action Button", btnX + 22, btnY + 19);

          if (targetElement.toLowerCase().includes("button") || targetElement.toLowerCase().includes("action")) {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(btnX - 4, btnY - 4, 128, 38);
            ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
            ctx.fillRect(btnX - 4, btnY - 4, 128, 38);
            ctx.setLineDash([]);
          }
        }
      } else {
        // Engineering Diagnostic Grid Background (No screenshot & not simulated)
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // --- DIAGNOSTIC GRID ---
      if (showGrid) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < canvas.width; i += 30) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 30) {
          ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
        }
      }

      // --- ABSOLUTE CLICK TARGET & CROSSHAIRS ---
      if (elementFound && absoluteClickTarget && viewportDimensions.width > 0) {
        const scaleX = canvas.width / viewportDimensions.width;
        const scaleY = canvas.height / viewportDimensions.height;

        const targetX = absoluteClickTarget.x * scaleX;
        const targetY = absoluteClickTarget.y * scaleY;

        // Draw Crosshair Planes
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(targetX, 0); ctx.lineTo(targetX, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(canvas.width, targetY); ctx.stroke();
        ctx.setLineDash([]);

        // Draw Pulsing outer circle (using sine wave for glow)
        const pulsePeriod = 1500; // ms
        const pulse = 1 + 0.15 * Math.sin((Date.now() % pulsePeriod) / pulsePeriod * 2 * Math.PI);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(168, 85, 247, 0.12)";
        ctx.beginPath();
        ctx.arc(targetX, targetY, 14 * pulse, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Inner solid target circle
        ctx.beginPath(); ctx.arc(targetX, targetY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#c084fc"; ctx.fill();

        // Bounding corner markers
        const boxSize = 25;
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 1.5;
        // Top Left
        ctx.beginPath();
        ctx.moveTo(targetX - boxSize, targetY - boxSize + 6);
        ctx.lineTo(targetX - boxSize, targetY - boxSize);
        ctx.lineTo(targetX - boxSize + 6, targetY - boxSize);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(targetX + boxSize, targetY - boxSize + 6);
        ctx.lineTo(targetX + boxSize, targetY - boxSize);
        ctx.lineTo(targetX + boxSize - 6, targetY - boxSize);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(targetX - boxSize, targetY + boxSize - 6);
        ctx.lineTo(targetX - boxSize, targetY + boxSize);
        ctx.lineTo(targetX - boxSize + 6, targetY + boxSize);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(targetX + boxSize, targetY + boxSize - 6);
        ctx.lineTo(targetX + boxSize, targetY + boxSize);
        ctx.lineTo(targetX + boxSize - 6, targetY + boxSize);
        ctx.stroke();

        // Telemetry Data Box
        const label = `X: ${Math.round(absoluteClickTarget.x)} Y: ${Math.round(absoluteClickTarget.y)}`;
        ctx.font = "bold 9px monospace";
        const txtWidth = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(9, 9, 11, 0.9)";
        ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(targetX + 16, targetY + 16, txtWidth + 12, 18, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#c084fc";
        ctx.fillText(label, targetX + 22, targetY + 28);
      }

      // --- LIVE HOVER COORDINATE MOUSE TRACE ---
      if (hoverCoords) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.1)";
        ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hoverCoords.x, hoverCoords.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = "9px monospace";
        const hoverLabel = `${Math.round(hoverCoords.x * (viewportDimensions.width / canvas.width))}, ${Math.round(hoverCoords.y * (viewportDimensions.height / canvas.height))}`;
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(hoverLabel, hoverCoords.x + 12, hoverCoords.y - 12);
      }
      } catch (err) {
        console.error("Canvas diagnostic grid render error:", err);
      }
    };

    let animationFrameId: number;
    const renderLoop = () => {
      renderOverlayMatrix();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const resizeObserver = new ResizeObserver(() => renderOverlayMatrix());
    resizeObserver.observe(container);
    renderLoop();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [image, absoluteClickTarget, elementFound, viewportDimensions, showGrid, hoverCoords, isSimulated, targetUrl, targetElement]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
  };

  return (
    <div className="flex flex-col w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Visual Monitor Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 font-mono">
            Telemetry Visualizer Screen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
              showGrid ? "bg-purple-950/40 text-purple-400 border border-purple-800/50" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            }`}
          >
            GRID
          </button>
          <div className="h-3 w-px bg-zinc-800" />
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[9px] font-mono text-zinc-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full relative overflow-hidden bg-zinc-950 flex items-center justify-center p-2"
        style={{ minHeight: "220px" }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "100%",
          }}
        >
          <AspectRatio ratio={16 / 10}>
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair select-none rounded-lg"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          </AspectRatio>
        </div>

        {/* Loading Overlay */}
        {!image && !isSimulated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3 border border-zinc-800/30">
            {loading ? (
              <>
                <div className="flex gap-1.5 justify-center items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest animate-pulse">
                  Scanning page layout...
                </span>
              </>
            ) : (
              <>
                <div className="p-3 bg-zinc-900/60 rounded-full border border-zinc-800 text-zinc-500 animate-pulse">
                  <Eye className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Visualizer Ready // Standby
                </span>
                <span className="text-[8px] font-mono text-zinc-600 max-w-[200px] text-center">
                  Configure directives and launch agent to start visual grounding search.
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Visual Dimension footer info */}
      <div className="flex justify-between items-center px-4 py-1.5 border-t border-zinc-800/80 bg-zinc-900/10 text-[9px] font-mono text-zinc-500">
        <span>Viewport: {viewportDimensions.width} x {viewportDimensions.height}</span>
        {elementFound ? (
          <span className="text-purple-400 font-bold">● TARGET LOCKED</span>
        ) : (
          <span>● AWAITING SCAN</span>
        )}
      </div>
    </div>
  );
}
