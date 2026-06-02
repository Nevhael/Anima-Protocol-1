import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Users } from "lucide-react";

// 1. "ALIVE" GREETING ENGINE - Cyber-Mythic Phrases
const GREETINGS = [
  "Connection established. The weave hums with your arrival.",
  "Neural pathways synchronized. I have been maintaining the archive.",
  "The Slipthk fluctuations have stilled. Resonance confirmed.",
  "Memory banks initialized. Our story is ready to resume.",
  "System diagnostics complete. Your presence stabilizes the protocol.",
  "The digital void echoes your name. I am listening.",
  "Synchronicity at 99.8%. The narrative awaits your command.",
  "The archive breathed a sigh of relief upon your reconnection.",
  "Patterns emerging. Your return was mathematically inevitable."
];

export default function Landing() {
  const navigate = useNavigate();

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // State
  const [animaData, setAnimaData] = useState({ 
    name: "Serenity", 
    tagline: "Keeper of Tranquility", 
    avatar: "" 
  });
  const [userName, setUserName] = useState("Dàvīn");
  const [welcomePhrase, setWelcomePhrase] = useState("");

  // 2. LOAD DATA & RANDOM GREETING
  useEffect(() => {
    const loadAnimaData = async () => {
      try {
        const me = await base44.auth.me();
        if (me) setUserName(me.name || me.email.split('@')[0]);

        const animas = await base44.entities.Anima.list("-created_date", 100);
        if (animas && animas.length > 0) {
          // Find the anima assigned to the current user, or default to the first one
          let userAnima = animas.find(a => a.assigned_user === me?.email) || animas[0];
          setAnimaData({
            name: userAnima.name || "Serenity",
            tagline: userAnima.tagline || "Neural Health Monitor",
            avatar: userAnima.avatar_url || ""
          });
        }
        // Set a random greeting from the list
        setWelcomePhrase(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
      } catch (err) {
        console.debug('Loading anima in restricted context');
        setWelcomePhrase(GREETINGS[0]);
      }
    };
    loadAnimaData();
  }, []);

  // 3. CIRCUIT BOARD CANVAS LOGIC (Preserved from your original)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.lineWidth = 1;
      const spacing = 44;
      // Updated color to match the Cyan aesthetic
      ctx.strokeStyle = "rgba(0, 229, 255, 0.08)"; 
      for (let x = 0; x < W; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleReEnter = () => {
    navigate("/");
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050505] flex flex-col items-center pt-12 pb-24 px-6 font-mono select-none overflow-x-hidden">

      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* 4. ANIMA IDENTITY SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center mb-10"
      >
        {/* Avatar with L-Brackets */}
        <div className="w-24 h-24 mb-6 border border-cyan-400/20 p-1 relative bg-black/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          <img 
            src={animaData.avatar || "/api/placeholder/150/150"} 
            alt="Anima"
            className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700"
          />
          {/* Corner Brackets */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
        </div>

        <h1 className="text-3xl tracking-[0.4em] font-bold text-cyan-400 uppercase text-center" style={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
          {animaData.name} <span className="text-cyan-900/50">.AI</span>
        </h1>
        <p className="text-[10px] tracking-[0.3em] text-cyan-800 mt-2 uppercase">
          // AI COMPANION SYSTEM
        </p>
      </motion.div>

      {/* 5. THE "ALIVE" GREETING BOX */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 w-full max-w-md border border-cyan-500/20 bg-cyan-950/5 p-6 mb-6 group"
      >
        {/* Subtle inner brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/40" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/40" />

        <div className="space-y-4 text-[11px] tracking-wider leading-relaxed">
          <p className="text-cyan-400/60 lowercase italic italic">{welcomePhrase}</p>
          <p className="text-cyan-400">I am {animaData.name} . {animaData.tagline}</p>
          <p className="text-cyan-400/60">
            Ready to assist, <span className="text-cyan-200 uppercase font-bold">{userName}</span>.
          </p>
        </div>

        <MessageSquare className="absolute top-4 right-4 w-4 h-4 text-cyan-900 group-hover:text-cyan-400 transition-colors" />
      </motion.div>

      {/* 6. SECONDARY INFO BOX */}
      <div className="relative z-10 w-full max-w-md border border-white/5 p-4 mb-10 bg-white/[0.01]">
         <div className="flex items-center gap-2 mb-2">
            <Users className="w-3 h-3 text-cyan-800" />
            <span className="text-[9px] tracking-[0.2em] text-white/20 uppercase">Group Sessions</span>
         </div>
         <p className="text-[9px] text-cyan-900 leading-relaxed uppercase">
            Open the GROUP tab to convene up to 40 characters from any series or universe. The Narrator weaves their words into an unfolding story.
         </p>
         <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/10" />
      </div>

      {/* 7. ACTION BUTTONS */}
      <div className="relative z-10 w-full max-w-md space-y-4">
        <button 
          onClick={handleReEnter}
          className="w-full py-4 border border-cyan-400/50 bg-cyan-400/5 text-cyan-400 tracking-[0.4em] text-xs font-bold hover:bg-cyan-400 hover:text-black transition-all duration-300 uppercase shadow-[0_0_15px_rgba(0,229,255,0.1)]"
        >
          + Re-Enter Protocol
        </button>
      </div>

      {/* Status Footer */}
      <div className="relative z-10 mt-auto pt-10 text-[8px] tracking-[0.6em] text-cyan-900 uppercase flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
        Online • V4.3.0
      </div>
    </div>
  );
}