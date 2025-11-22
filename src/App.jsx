import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Home, Bell, Search, Navigation, Car, Clock, ChevronRight, 
  ShieldAlert, Users, Sparkles, Map as MapIcon, Sliders, X, 
  CheckCircle2, ArrowRight, Zap, Coffee, Music, Utensils, 
  Calendar, Thermometer, Wind, Activity, Lock, Unlock, TrendingUp,
  AlertCircle, Send
} from 'lucide-react';

// --- 1. REALISTIC DATA ENGINE ---

const DISTRICT_DATA = {
  reno: {
    name: "Midtown District",
    city: "Reno, NV",
    temp: "72°",
    crowdLevel: 78,
    crowdTrend: "filling_up",
    safetyScore: 94,
    safetyStats: [
      { label: "Theft (48h)", val: 0, status: "safe" },
      { label: "Break-ins", val: 1, status: "warning" },
      { label: "Patrols", val: "Active", status: "safe" }
    ],
    venues: [
      { id: 1, name: "Rum Sugar Lime", type: "Cocktail Bar", wait: "15m", vibe: "Lively", crowd: 85, dist: "0.1m" },
      { id: 2, name: "The Depot", type: "Gastropub", wait: "45m", vibe: "Packed", crowd: 98, dist: "0.3m" },
      { id: 3, name: "Recycled Records", type: "Retail", wait: "0m", vibe: "Chill", crowd: 12, dist: "0.2m" },
    ],
    alerts: [
      { id: 101, type: "traffic", title: "Construction on S. Virginia", time: "2h ago", impact: "Medium Delay" },
      { id: 102, type: "safety", title: "Vehicle Break-in Reported", loc: "Side Street Parking", time: "45m ago", impact: "Be Aware" }
    ]
  },
  dallas: {
    name: "Bishop Arts",
    city: "Dallas, TX",
    temp: "85°",
    crowdLevel: 42,
    crowdTrend: "stable",
    safetyScore: 88,
    safetyStats: [
      { label: "Theft (48h)", val: 2, status: "warning" },
      { label: "Break-ins", val: 3, status: "warning" },
      { label: "Patrols", val: "Low", status: "alert" }
    ],
    venues: [
      { id: 4, name: "Paradiso", type: "Dining", wait: "2h", vibe: "Trending", crowd: 100, dist: "0.0m" },
      { id: 5, name: "Wild Detectives", type: "Bookstore Bar", wait: "10m", vibe: "Cozy", crowd: 45, dist: "0.2m" },
    ],
    alerts: [
      { id: 201, type: "crowd", title: "Art Walk Starting", time: "10m ago", impact: "High Traffic" }
    ]
  }
};

// --- 2. ADVANCED MICRO-COMPONENTS ---

const CrowdPulse = ({ level }) => {
  const color = level > 80 ? 'bg-orange-500' : level > 50 ? 'bg-blue-500' : 'bg-emerald-500';
  const shadowColor = level > 80 ? 'shadow-orange-500/50' : level > 50 ? 'shadow-blue-500/50' : 'shadow-emerald-500/50';
  
  return (
    <div className="relative w-3 h-3">
      <div className={`absolute inset-0 rounded-full opacity-75 animate-ping ${color}`}></div>
      <div className={`relative w-3 h-3 rounded-full ${color} shadow-lg ${shadowColor}`}></div>
    </div>
  );
};

const AnimatedNumber = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

// Ripple Effect Hook
const useRipple = () => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = { x, y, size, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return { ripples, createRipple };
};

// Interactive Button Component
const InteractiveButton = ({ children, onClick, className = "", variant = "default", ...props }) => {
  const { ripples, createRipple } = useRipple();
  const [pressed, setPressed] = useState(false);

  const handleClick = (e) => {
    createRipple(e);
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    if (onClick) onClick(e);
  };

  return (
    <button 
      onClick={handleClick}
      className={`relative overflow-hidden transition-all duration-200 ${
        pressed ? 'scale-95' : 'scale-100'
      } ${className}`}
      {...props}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/40 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
      {children}
      <style>{`
        @keyframes ripple {
          to { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </button>
  );
};

// Particle Background
const ParticleField = ({ count = 15 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    x: Math.random() * 100,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full blur-sm"
          style={{
            left: `${p.x}%`,
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(0) translateX(20px) scale(1); }
          90% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// --- 3. VIEWS ---

const WelcomeView = ({ onNext }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden flex flex-col p-8 pt-20">
      {/* Animated Background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <ParticleField count={20} />
      
      <div className={`relative z-10 flex-1 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-slate-400/50 hover:rotate-12 hover:scale-110 transition-all duration-300">
          <Navigation className="text-white" size={32} />
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-6">
          Krowd<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-gradient">
            Guide.
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 font-medium max-w-[280px] leading-relaxed">
          The definitive operating system for urban navigation, safety, and atmosphere.
        </p>

        {/* Feature Pills */}
        <div className="mt-8 space-y-3">
          {['Real-time crowd intel', 'Smart parking', 'Safety alerts'].map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 opacity-0 animate-in slide-in-from-left duration-500"
              style={{animationDelay: `${800 + i * 150}ms`, animationFillMode: 'forwards'}}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <InteractiveButton 
        onClick={onNext}
        className="group w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-between px-8 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-300"
      >
        <span>Initialize</span>
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
      </InteractiveButton>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

const CitySelectView = ({ onSelect }) => {
  const [active, setActive] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);
  
  return (
    <div className={`h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-16 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Select Region</h2>
        <p className="text-slate-500 font-medium">Access real-time district data.</p>
      </div>
      
      <div className="space-y-4">
        {Object.entries(DISTRICT_DATA).map(([key, data], index) => (
          <InteractiveButton
            key={key}
            onClick={() => setActive(key)}
            className={`w-full text-left p-6 rounded-3xl transition-all duration-500 border-2 ${
              active === key 
                ? 'bg-white border-blue-600 shadow-2xl shadow-blue-200/50 scale-[1.02]' 
                : 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300'
            }`}
            style={{
              animationDelay: `${index * 150}ms`,
              animation: 'slideIn 0.5s ease-out forwards',
              opacity: 0
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{data.city}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{data.name}</p>
              </div>
              <div className={`transition-all duration-300 ${active === key ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <CheckCircle2 className="text-blue-600" size={28} />
              </div>
            </div>
            
            {/* Live Data Preview */}
            <div className="mt-4 flex gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Users size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors"/>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400">Crowd</span>
                  <span className="block text-sm font-bold text-slate-900">{data.crowdLevel}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <Thermometer size={16} className="text-slate-400 group-hover:text-orange-600 transition-colors"/>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400">Weather</span>
                  <span className="block text-sm font-bold text-slate-900">{data.temp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 group ml-auto">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <ShieldAlert size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors"/>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400">Safety</span>
                  <span className="block text-sm font-bold text-emerald-600">{data.safetyScore}%</span>
                </div>
              </div>
            </div>
          </InteractiveButton>
        ))}
      </div>

      <div className="fixed bottom-8 left-6 right-6">
        <InteractiveButton 
          onClick={() => active && onSelect(active)}
          disabled={!active}
          className={`w-full py-5 rounded-2xl font-bold transition-all shadow-lg ${
            active 
              ? 'bg-blue-600 text-white shadow-blue-300 hover:bg-blue-700' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Connect to City
            {active && <Send size={18} />}
          </span>
        </InteractiveButton>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const DistrictDashboard = ({ cityId, onVenueSelect }) => {
  const data = DISTRICT_DATA[cityId];
  const [selectedStat, setSelectedStat] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <div className={`pb-32 space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Dynamic Header */}
      <header className="px-6 pt-14 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            Live Feed
          </div>
          <h1 className="text-3xl font-black text-slate-900 hover:text-blue-600 transition-colors cursor-default">
            {data.name}
          </h1>
        </div>
        <InteractiveButton className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-lg hover:scale-110 transition-all">
           <img 
             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.city)}&background=0f172a&color=fff`} 
             alt="Profile" 
             className="w-full h-full object-cover"
           />
        </InteractiveButton>
      </header>

      {/* Main Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {/* Enhanced Crowd Card */}
        <div className="col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-slate-400/50 group cursor-pointer hover:shadow-blue-500/30 transition-all duration-500">
          <ParticleField count={10} />
          
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
          
          {/* Scan Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{animation: 'scan 3s ease-in-out infinite'}}></div>
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CrowdPulse level={data.crowdLevel} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Crowd Density</span>
              </div>
              <div className="text-5xl font-light tracking-tighter mb-2 group-hover:scale-105 transition-transform">
                <AnimatedNumber value={data.crowdLevel} />
                <span className="text-xl text-slate-500 font-normal">%</span>
              </div>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" />
                {data.crowdLevel > 80 ? 'Very Busy' : 'Moderate Activity'} • {data.temp} Clear
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
              <Activity className="text-emerald-400" size={24} />
            </div>
          </div>
          
          {/* Interactive Graph */}
          <div className="relative z-10 h-16 flex items-end gap-1">
            {[40, 60, 45, 70, 85, 60, 50, 75, 90, 60].map((h, i) => (
              <div 
                key={i} 
                style={{height: `${h}%`}} 
                className="flex-1 bg-gradient-to-t from-blue-500/30 to-blue-400/50 rounded-t-md transition-all duration-500 hover:from-blue-400 hover:to-blue-300 cursor-pointer hover:scale-105"
                onMouseEnter={() => setSelectedStat(h)}
                onMouseLeave={() => setSelectedStat(null)}
              >
                {selectedStat === h && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-2 py-1 rounded-lg text-xs font-bold shadow-xl whitespace-nowrap">
                    {h}% capacity
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Safety Stats */}
        {data.safetyStats.map((stat, i) => (
          <InteractiveButton
            key={i} 
            className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all flex flex-col justify-between group"
          >
            <div className={`text-3xl font-black transition-all duration-300 group-hover:scale-110 ${
              stat.status === 'alert' ? 'text-orange-500' : 
              stat.status === 'warning' ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              {typeof stat.val === 'number' ? <AnimatedNumber value={stat.val} duration={1000} /> : stat.val}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase mt-3 tracking-wide">{stat.label}</p>
            
            {/* Status Indicator */}
            <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  stat.status === 'alert' ? 'bg-orange-500 w-3/4' : 
                  stat.status === 'warning' ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-1/4'
                }`}
              />
            </div>
          </InteractiveButton>
        ))}
      </div>

      {/* Enhanced Venues List */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            Trending Now
          </h3>
          <InteractiveButton className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
            <ArrowRight size={18} />
          </InteractiveButton>
        </div>
        
        <div className="space-y-3">
          {data.venues.map((venue, index) => (
            <InteractiveButton
              key={venue.id}
              onClick={() => onVenueSelect && onVenueSelect(venue)}
              className="group w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex items-center gap-4 text-left"
              style={{
                animation: 'slideUp 0.5s ease-out forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400 group-hover:from-blue-600 group-hover:to-blue-500 group-hover:text-white transition-all duration-300 shadow-md">
                  {venue.name.charAt(0)}
                </div>
                {/* Live Status Badge */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                  venue.crowd > 90 ? 'bg-red-500' : venue.crowd > 60 ? 'bg-orange-500' : 'bg-emerald-500'
                }`}>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{backgroundColor: 'inherit'}}></span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {venue.name}
                  </h4>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 ${
                    venue.crowd > 90 ? 'bg-red-50 text-red-600' : 
                    venue.crowd > 60 ? 'bg-orange-50 text-orange-600' : 
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {venue.wait}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{venue.type}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {venue.dist}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-slate-600 font-semibold">{venue.vibe}</span>
                </div>
              </div>
              
              <ChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" size={20} />
            </InteractiveButton>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// --- 4. ENHANCED OVERLAYS ---

const AIOverlay = ({ onClose }) => {
  const [selected, setSelected] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const moods = [
    { id: 1, label: 'Low Key & Quiet', icon: Coffee, color: 'emerald' },
    { id: 2, label: 'High Energy', icon: Zap, color: 'orange' },
    { id: 3, label: 'Romantic Spot', icon: Music, color: 'pink' },
    { id: 4, label: 'Cheap Eats', icon: Utensils, color: 'blue' }
  ];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="p-6 pt-12 flex justify-end">
        <InteractiveButton 
          onClick={handleClose} 
          className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 hover:rotate-90 transition-all"
        >
          <X size={24}/>
        </InteractiveButton>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-8 pb-20">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-400/50 hover:rotate-12 hover:scale-110 transition-all duration-300">
          <Sparkles className="text-white w-12 h-12 animate-pulse" />
        </div>
        
        <h2 className="text-4xl font-black text-slate-900 mb-3">Mood Matcher</h2>
        <p className="text-xl text-slate-500 mb-10">Where should tonight take you?</p>
        
        <div className="space-y-4">
          {moods.map((mood, index) => (
            <InteractiveButton
              key={mood.id}
              onClick={() => setSelected(mood.id)}
              className={`w-full p-6 text-left rounded-2xl font-bold transition-all flex items-center gap-4 ${
                selected === mood.id 
                  ? `bg-${mood.color}-50 border-2 border-${mood.color}-500 shadow-xl scale-[1.02]` 
                  : 'bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
              style={{
                animation: 'slideIn 0.5s ease-out forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                selected === mood.id ? `bg-${mood.color}-500 text-white` : 'bg-slate-100 text-slate-400'
              }`}>
                <mood.icon size={24} />
              </div>
              <span className="flex-1 text-slate-900">{mood.label}</span>
              {selected === mood.id && <CheckCircle2 className={`text-${mood.color}-600`} size={24} />}
            </InteractiveButton>
          ))}
        </div>

        {selected && (
          <InteractiveButton className="mt-8 w-full py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-300 hover:bg-blue-700 transition-all">
            Find My Vibe
          </InteractiveButton>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

const ParkingOverlay = ({ onClose }) => {
  const [slide, setSlide] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (slide > 95) {
      setConfirmed(true);
    }
  }, [slide]);

  useEffect(() => {
    if (confirmed && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, countdown]);

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-300 animate-bounce">
          <CheckCircle2 size={64} className="text-emerald-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-3">Spot Reserved!</h2>
        <p className="text-slate-500 text-lg mb-8">Starting navigation in {countdown}s...</p>
        
        {/* Countdown Ring */}
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle cx="48" cy="48" r="44" stroke="#e2e8f0" strokeWidth="8" fill="none" />
            <circle 
              cx="48" cy="48" r="44" 
              stroke="#10b981" 
              strokeWidth="8" 
              fill="none"
              strokeDasharray={276}
              strokeDashoffset={276 * (countdown / 3)}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-emerald-600">
            {countdown}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl w-full animate-in slide-in-from-bottom duration-500">
        {/* Drag Handle */}
        <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing hover:bg-slate-300 transition-colors"></div>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">5th St. Garage</h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <MapPin size={16} />
              Level 2 • Spot B4
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              $4.50
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase">Per Hour</div>
          </div>
        </div>

        {/* Interactive Parking Grid */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Visual Layout</p>
          <div className="grid grid-cols-3 gap-3">
             {[1,2,3,4,5,6].map(i => (
               <div 
                 key={i} 
                 className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${
                   i === 5 
                     ? 'bg-blue-50 border-blue-500 border-dashed shadow-lg shadow-blue-200 scale-105' 
                     : 'bg-white border-slate-200 hover:border-slate-300'
                 }`}
               >
                 {i !== 5 ? (
                   <>
                     <Car size={28} className="text-slate-300 mb-1" />
                     <span className="text-[10px] font-bold text-slate-400">A{i}</span>
                   </>
                 ) : (
                   <>
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1 shadow-lg">
                       <MapPin size={20} className="text-white" />
                     </div>
                     <span className="text-blue-600 font-bold text-xs">YOUR SPOT</span>
                   </>
                 )}
               </div>
             ))}
          </div>
        </div>

        {/* Enhanced Slide Action */}
        <div className="relative h-20 bg-slate-900 rounded-3xl overflow-hidden cursor-pointer select-none group mb-4">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ opacity: slide / 100 }}
          ></div>
          
          <div className="absolute inset-0 flex items-center justify-center text-white font-black tracking-widest text-sm pointer-events-none">
            {slide > 50 ? 'RELEASE TO CONFIRM' : 'SLIDE TO RESERVE →'}
          </div>
          
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={slide} 
            onChange={(e) => setSlide(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          />
          
          <div 
            className="absolute top-2 bottom-2 left-2 w-16 bg-white rounded-2xl flex items-center justify-center transition-transform z-10 shadow-2xl"
            style={{ 
              transform: `translateX(${slide * 3.2}px)`,
              boxShadow: slide > 50 ? '0 0 30px rgba(59, 130, 246, 0.6)' : undefined
            }}
          >
            <ArrowRight 
              size={28} 
              className={`transition-all ${slide > 50 ? 'text-blue-600 scale-110' : 'text-slate-900'}`} 
            />
          </div>
        </div>
        
        {/* Quick Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            32 spots available
          </span>
          <span className="flex items-center gap-1">
            <Lock size={12} />
            Covered parking
          </span>
        </div>
      </div>
    </div>
  );
};

// --- 5. MAIN APP ---

export default function App() {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState('reno');
  const [tab, setTab] = useState('home');
  const [showAI, setShowAI] = useState(false);
  const [showParking, setShowParking] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const handleCitySelect = (id) => {
    setCity(id);
    setTimeout(() => setStep(2), 300);
  };

  if (step === 0) return <WelcomeView onNext={() => setStep(1)} />;
  if (step === 1) return <CitySelectView onSelect={handleCitySelect} />;

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans overflow-hidden flex flex-col relative">
      
      {/* Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {tab === 'home' && <DistrictDashboard cityId={city} onVenueSelect={setSelectedVenue} />}
        
        {tab === 'map' && (
          <div className="h-full relative bg-gradient-to-br from-slate-100 to-slate-50">
            {/* Enhanced Map Graphic */}
            <div className="absolute inset-0 opacity-40">
               <svg width="100%" height="100%">
                 <defs>
                   <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                     <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="1"/>
                   </pattern>
                   <linearGradient id="road" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#e2e8f0" />
                     <stop offset="50%" stopColor="#ffffff" />
                     <stop offset="100%" stopColor="#e2e8f0" />
                   </linearGradient>
                 </defs>
                 <rect width="100%" height="100%" fill="url(#grid)" />
                 <path d="M 100 0 L 100 800" stroke="url(#road)" strokeWidth="28" />
                 <path d="M 250 0 L 250 800" stroke="url(#road)" strokeWidth="20" />
                 <path d="M 0 300 L 400 300" stroke="url(#road)" strokeWidth="28" />
               </svg>
            </div>
            
            {/* Animated Parking Marker */}
            <InteractiveButton 
              onClick={() => setShowParking(true)}
              className="absolute top-1/3 left-1/4 animate-bounce hover:animate-none"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-xl animate-pulse"></div>
                <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-4 border-white hover:rotate-0 rotate-3 transition-all group-hover:scale-110">
                  <span className="text-white font-black text-2xl">P</span>
                  <span className="text-emerald-400 text-[10px] font-bold">OPEN</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-ping"></div>
              </div>
            </InteractiveButton>
            
            {/* Navigation Card */}
            <div className="absolute bottom-32 left-6 right-6 bg-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-200 animate-in slide-in-from-bottom duration-700">
               <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                 <Navigation size={24} />
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900">Navigating to {DISTRICT_DATA[city].name}</h4>
                 <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                   <Clock size={12} />
                   0.4 miles • 2 mins
                 </p>
               </div>
               <div className="flex gap-1">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-1 h-8 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: `${i * 200}ms`}}></div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="p-6 pt-14 pb-32">
            <div className="mb-6">
              <h1 className="text-3xl font-black mb-2">Live Alerts</h1>
              <p className="text-slate-500 font-medium">Real-time updates for your area</p>
            </div>
            
            <div className="space-y-4">
              {DISTRICT_DATA[city].alerts.map((alert, index) => (
                <div 
                  key={alert.id} 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                  style={{
                    animation: 'slideIn 0.5s ease-out forwards',
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      alert.type === 'safety' ? 'bg-orange-100 text-orange-600' : 
                      alert.type === 'traffic' ? 'bg-blue-100 text-blue-600' : 
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {alert.type === 'safety' ? <ShieldAlert size={20} /> : 
                       alert.type === 'traffic' ? <Car size={20} /> : 
                       <Users size={20} />}
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        alert.type === 'safety' ? 'text-orange-600' : 
                        alert.type === 'traffic' ? 'text-blue-600' : 
                        'text-purple-600'
                      }`}>
                        {alert.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{alert.time}</span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-400" />
                    <p className="text-sm text-slate-500 font-medium">{alert.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Floating Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[340px] px-4">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between items-center shadow-2xl shadow-slate-500/50 ring-1 ring-white/10">
          {[
            { id: 'home', icon: Home },
            { id: 'map', icon: MapIcon },
            { id: 'ai', icon: Sparkles, highlight: true },
            { id: 'alerts', icon: Bell },
            { id: 'profile', icon: Sliders }
          ].map((item) => {
             if (item.highlight) {
               return (
                 <InteractiveButton 
                  key={item.id}
                  onClick={() => setShowAI(true)}
                  className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 active:scale-95 transition-all -mt-8 border-4 border-slate-50 relative"
                 >
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                   <Sparkles className="text-white relative z-10" size={24} fill="white" />
                 </InteractiveButton>
               );
             }
             return (
               <InteractiveButton
                 key={item.id}
                 onClick={() => setTab(item.id)}
                 className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative ${
                   tab === item.id ? 'text-white bg-white/10 scale-110' : 'text-slate-400 hover:text-white hover:scale-105'
                 }`}
               >
                 <item.icon size={22} strokeWidth={tab === item.id ? 2.5 : 2} />
                 {tab === item.id && (
                   <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white"></div>
                 )}
               </InteractiveButton>
             );
          })}
        </div>
      </div>

      {/* Overlays */}
      {showAI && <AIOverlay onClose={() => setShowAI(false)} />}
      {showParking && <ParkingOverlay onClose={() => setShowParking(false)} />}

    </div>
  );
}