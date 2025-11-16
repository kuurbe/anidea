"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin, Navigation, AlertCircle, Clock, Shield, Users, TrendingUp,
  Play, Info, Bell, X, Settings, Calendar, Zap, ChevronRight, ChevronUp,
  Star, Sparkles, Activity
} from 'lucide-react';

// ======================
// UTILITY FUNCTIONS
// ======================

const generateHourlyPredictions = (venue, currentTime) => {
  if (!venue) return [];
  const predictions = [];
  const baseTime = new Date(currentTime);
  
  for (let i = 0; i < 12; i++) {
    const hour = new Date(baseTime.getTime() + i * 60 * 60 * 1000);
    const hourNum = hour.getHours();
    let crowdLevel = venue.crowd;
    let confidence = 95 - (i * 5);

    if (venue.type.includes('Restaurant') || venue.type.includes('Brewery')) {
      if (hourNum >= 17 && hourNum <= 21) {
        crowdLevel = Math.min(95, venue.crowd + (hourNum - 17) * 8);
      } else if (hourNum >= 12 && hourNum <= 14) {
        crowdLevel = Math.min(85, venue.crowd + 15);
      } else {
        crowdLevel = Math.max(20, venue.crowd - 20);
      }
    } else if (venue.type.includes('Arts') || venue.type.includes('Shopping')) {
      if (hourNum >= 14 && hourNum <= 19) {
        crowdLevel = Math.min(90, venue.crowd + 15);
      } else {
        crowdLevel = Math.max(30, venue.crowd - 10);
      }
    }

    if (venue.events && venue.events.some(e => {
      const eventHour = parseInt(e.time.split(':')[0], 10);
      return Math.abs(eventHour - hourNum) <= 1;
    })) {
      crowdLevel = Math.min(95, crowdLevel + 25);
      confidence = Math.min(90, confidence + 5);
    }

    const parkingAvailable = Math.max(10, 100 - crowdLevel);
    predictions.push({
      hour,
      hourNum,
      time: hour.toLocaleTimeString([], { hour: 'numeric' }),
      crowd: Math.round(crowdLevel),
      parking: Math.round(parkingAvailable),
      confidence: Math.max(60, confidence),
      status: crowdLevel < 50 ? 'clear' : crowdLevel < 75 ? 'moderate' : 'busy'
    });
  }
  return predictions;
};

const generateInsights = (venues, currentTime) => {
  const insights = [];
  const currentHour = currentTime.getHours();

  venues.forEach(venue => {
    const predictions = generateHourlyPredictions(venue, currentTime);
    const nextHourPrediction = predictions[1];

    if (nextHourPrediction && nextHourPrediction.crowd > venue.crowd + 20) {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        venue: venue.name,
        message: `Crowd surging soon - ${nextHourPrediction.crowd}% in 1 hour`,
        actionable: `Visit now or wait until ${predictions.find(p => p.crowd < 60)?.time || 'later'}`,
        priority: 'high'
      });
    }

    if (nextHourPrediction && nextHourPrediction.parking < 30 && venue.crowd < 60) {
      insights.push({
        type: 'info',
        icon: AlertCircle,
        venue: venue.name,
        message: 'Parking filling up soon',
        actionable: 'Arrive in next 30 minutes for easier parking',
        priority: 'medium'
      });
    }

    const optimalWindow = predictions.find(p => p.crowd < 50 && p.confidence > 75);
    if (optimalWindow && venue.crowd > 70) {
      insights.push({
        type: 'success',
        icon: Zap,
        venue: venue.name,
        message: `Best time to visit: ${optimalWindow.time}`,
        actionable: `${optimalWindow.crowd}% capacity with ${optimalWindow.parking}% parking available`,
        priority: 'low'
      });
    }

    if (venue.events) {
      venue.events.forEach(event => {
        const eventTime = parseInt(event.time.split(':')[0], 10);
        if (Math.abs(eventTime - currentHour) <= 2) {
          insights.push({
            type: 'event',
            icon: Calendar,
            venue: venue.name,
            message: event.name,
            actionable: event.impact,
            priority: 'high'
          });
        }
      });
    }
  });

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

// ======================
// DATA
// ======================

const CITIES = {
  'oak-cliff': {
    name: 'Oak Cliff',
    subtitle: 'Dallas, TX',
    description: 'Neighborhood intelligence',
    icon: '🏙️',
    venues: [
      {
        id: 1,
        name: 'Bishop Arts District',
        type: 'Arts & Shopping',
        address: 'N Bishop Ave, Oak Cliff',
        distance: '0.3 mi',
        status: 'moderate',
        crowd: 68,
        safety: 94,
        trending: true,
        icon: '🎨',
        description: 'Gallery openings and boutique shopping',
        peakTime: '7:00 PM',
        currentWait: 'No wait',
        isOpen: true,
        hours: 'Open until 10 PM',
        civicZone: 'Oak Cliff Arts District',
        alerts: ['Street event 6-9 PM', 'Limited parking'],
        events: [
          {
            name: 'First Friday Art Walk',
            time: '18:00',
            impact: 'Expect 200+ attendees, Bishop Ave closed',
            crowdSurge: 85
          }
        ]
      },
      {
        id: 2,
        name: 'Kessler Theater',
        type: 'Live Venue',
        address: '1230 W Davis St',
        distance: '0.8 mi',
        status: 'clear',
        crowd: 42,
        safety: 96,
        trending: false,
        icon: '🎭',
        description: 'Historic theater with live performances',
        peakTime: '8:30 PM',
        currentWait: 'Tickets available',
        isOpen: true,
        hours: 'Show at 8 PM',
        civicZone: 'Historic Oak Cliff',
        alerts: [],
        events: [
          {
            name: 'Concert - Show ends 10 PM',
            time: '20:00',
            impact: 'Expect crowd dispersal 10-10:30 PM',
            crowdSurge: 90
          }
        ]
      },
      {
        id: 3,
        name: 'Fuel City Tacos',
        type: 'Restaurant',
        address: '801 S Riverfront Blvd',
        distance: '1.2 mi',
        status: 'busy',
        crowd: 85,
        safety: 90,
        trending: true,
        icon: '🌮',
        description: 'Authentic tacos, open 24/7',
        peakTime: 'Always busy',
        currentWait: '15-20 min',
        isOpen: true,
        hours: 'Open 24/7',
        civicZone: 'Industrial District',
        alerts: ['High volume', 'Cash preferred']
      },
      {
        id: 4,
        name: 'Trinity River Park',
        type: 'Outdoor',
        address: 'Great Trinity Forest',
        distance: '1.5 mi',
        status: 'clear',
        crowd: 28,
        safety: 98,
        trending: false,
        icon: '🌳',
        description: '6,000 acres of urban forest and trails',
        peakTime: 'Sunset (6:45 PM)',
        currentWait: 'Open access',
        isOpen: true,
        hours: 'Dawn to dusk',
        civicZone: 'Great Trinity Forest',
        alerts: []
      },
      {
        id: 5,
        name: 'Oak Cliff Brewing',
        type: 'Brewery',
        address: '301 E 8th St',
        distance: '0.6 mi',
        status: 'moderate',
        crowd: 72,
        safety: 92,
        trending: true,
        icon: '🍺',
        description: 'Local craft brewery with patio',
        peakTime: '6:00 PM',
        currentWait: '10 min for table',
        isOpen: true,
        hours: 'Open until 11 PM',
        civicZone: 'Downtown Oak Cliff',
        alerts: ['Live music tonight'],
        events: [
          {
            name: 'Trivia Night',
            time: '19:00',
            impact: 'Popular event - arrive early',
            crowdSurge: 88
          }
        ]
      }
    ]
  },
  'reno': {
    name: 'Reno',
    subtitle: 'The Biggest Little City',
    description: 'Entertainment & outdoor hub',
    icon: '🎰',
    venues: [
      {
        id: 6,
        name: 'Midtown District',
        type: 'Entertainment & Dining',
        address: 'Midtown Reno',
        distance: '0.4 mi',
        status: 'moderate',
        crowd: 65,
        safety: 92,
        trending: true,
        icon: '🍸',
        description: 'Vibrant dining and nightlife scene',
        peakTime: '8:00 PM',
        currentWait: '10-15 min for tables',
        isOpen: true,
        hours: 'Most venues until midnight',
        civicZone: 'Midtown',
        alerts: ['Live music tonight at multiple venues'],
        events: [
          {
            name: 'Art Walk - First Saturday',
            time: '18:00',
            impact: 'Streets crowded 6-9 PM',
            crowdSurge: 80
          }
        ]
      },
      {
        id: 7,
        name: 'Truckee River Walk',
        type: 'Outdoor',
        address: 'Downtown Reno',
        distance: '0.6 mi',
        status: 'clear',
        crowd: 35,
        safety: 96,
        trending: false,
        icon: '🌊',
        description: 'Scenic riverside walking path',
        peakTime: 'Sunset (5:30 PM)',
        currentWait: 'Open access',
        isOpen: true,
        hours: 'Dawn to dusk',
        civicZone: 'Downtown',
        alerts: []
      },
      {
        id: 8,
        name: 'The Nevada Museum of Art',
        type: 'Arts & Culture',
        address: '160 W Liberty St',
        distance: '0.8 mi',
        status: 'clear',
        crowd: 28,
        safety: 98,
        trending: false,
        icon: '🎨',
        description: 'Contemporary art museum',
        peakTime: '2:00 PM',
        currentWait: 'No wait',
        isOpen: true,
        hours: 'Open until 6 PM',
        civicZone: 'Downtown',
        alerts: ['New exhibition opening this week']
      },
      {
        id: 9,
        name: 'Greater Nevada Field',
        type: 'Sports & Events',
        address: '250 Evans Ave',
        distance: '1.2 mi',
        status: 'busy',
        crowd: 82,
        safety: 90,
        trending: true,
        icon: '⚾',
        description: 'Home of Reno Aces baseball',
        peakTime: 'Game time - 7:00 PM',
        currentWait: 'Gates open',
        isOpen: true,
        hours: 'Event schedule varies',
        civicZone: 'Downtown',
        alerts: ['Game tonight', 'Heavy traffic expected'],
        events: [
          {
            name: 'Aces vs. Sacramento - 7:05 PM',
            time: '19:05',
            impact: 'Expect 6,000+ attendees, parking limited',
            crowdSurge: 95
          }
        ]
      }
    ]
  }
};

// ======================
// REUSABLE COMPONENTS
// ======================

const GlassCard = ({ children, className = '', onClick, noPadding = false }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl ${
      noPadding ? '' : 'p-4 sm:p-6'
    } ${onClick ? 'cursor-pointer active:scale-[0.98] hover:from-white/[0.15] hover:to-white/[0.06] transition-all duration-200' : ''} ${className}`}
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    {children}
  </div>
);

const StatusBadge = ({ status, crowd }) => {
  const configs = {
    clear: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-400/30', label: 'Clear' },
    moderate: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-400/30', label: 'Moderate' },
    busy: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-400/30', label: 'Busy' }
  };
  const config = configs[status] || configs.moderate;

  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${config.bg} border ${config.border}`}>
      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${config.text.replace('text-', 'bg-')} animate-pulse`} />
      <span className={`text-[10px] sm:text-xs font-medium ${config.text}`}>
        <span className="hidden sm:inline">{config.label} (</span>
        {crowd}%
        <span className="hidden sm:inline">)</span>
      </span>
    </div>
  );
};

const CrowdMeter = ({ value, label, showPercentage = true, size = 'md' }) => {
  const getColor = (val) => {
    if (val < 50) return 'from-emerald-500 to-emerald-400';
    if (val < 75) return 'from-amber-500 to-amber-400';
    return 'from-rose-500 to-rose-400';
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/50">{label}</span>
        {showPercentage && <span className="text-xs font-medium text-white/70">{value}%</span>}
      </div>
      <div className="w-full bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} bg-gradient-to-r ${getColor(value)} transition-all duration-500 rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// ======================
// LANDING HERO
// ======================

const LandingHero = ({ setAppState }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6 sm:p-8 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/30 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-pink-500/20 rounded-full blur-3xl animate-float-slow" />
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/20 rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 animate-gradient" />

      <div className={`max-w-2xl w-full text-center space-y-6 sm:space-y-8 relative z-10 transition-all duration-1000 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/[0.08] backdrop-blur-xl rounded-full border border-white/10 mb-2 sm:mb-4 animate-slide-down">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse-slow" />
          <span className="text-xs sm:text-sm text-white/70">AI-Powered Crowd Intelligence</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight animate-gradient-text px-4">
          KROWDGUIDE
        </h1>

        <p className="text-base sm:text-xl text-white/60 max-w-lg mx-auto leading-relaxed animate-fade-in-delayed px-4">
          Never walk into a crowded venue again. Real-time crowd tracking and predictive insights for your city.
        </p>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto mt-8 sm:mt-12 px-4">
          {[
            { icon: Activity, label: 'Live Updates', desc: 'Real-time data', delay: '0.2s' },
            { icon: TrendingUp, label: 'Predictions', desc: 'AI forecasts', delay: '0.4s' },
            { icon: Shield, label: 'Safety First', desc: 'Verified info', delay: '0.6s' }
          ].map(({ icon: Icon, label, desc, delay }) => (
            <div 
              key={label} 
              className="text-center space-y-2 animate-scale-in"
              style={{ animationDelay: delay }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 cursor-pointer">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
              </div>
              <div className="text-xs sm:text-sm font-medium text-white">{label}</div>
              <div className="text-[10px] sm:text-xs text-white/40">{desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setAppState('location')}
          className="mt-8 sm:mt-12 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:from-purple-700 active:to-blue-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/25 transition-all duration-200 transform active:scale-95 hover:shadow-purple-500/40 text-base sm:text-lg animate-bounce-in group"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="flex items-center gap-2 justify-center">
            Get Started
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        <p className="text-xs text-white/30 mt-4 sm:mt-6 animate-fade-in-slow px-4">
          Currently available in Oak Cliff & Reno
        </p>
      </div>
    </div>
  );
};

// ======================
// LOCATION SELECTOR
// ======================

const LocationSelector = ({ setAppState, setCurrentCity }) => {
  const cities = Object.entries(CITIES);

  return (
    <div className="h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="max-w-2xl w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center space-y-2 sm:space-y-3 animate-slide-down px-4">
          <div className="relative inline-block">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mx-auto animate-bounce-slow" />
            <div className="absolute inset-0 bg-purple-400/30 blur-xl rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Select Your City</h2>
          <p className="text-sm sm:text-base text-white/50">Choose a location to see live crowd data</p>
        </div>

        <div className="grid gap-3 sm:gap-4 px-4">
          {cities.map(([key, city], idx) => (
            <div
              key={key}
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <GlassCard
                onClick={() => {
                  setCurrentCity(key);
                  setAppState('main');
                }}
                className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-4xl sm:text-5xl transform group-active:scale-95 transition-transform flex-shrink-0">{city.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1 group-hover:text-purple-300 transition-colors truncate">{city.name}</h3>
                    <p className="text-xs sm:text-sm text-white/50 truncate">{city.subtitle}</p>
                    <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {city.venues.length} venues tracked
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        <div className="text-center animate-fade-in-slow px-4">
          <button
            onClick={() => setAppState('splash')}
            className="text-sm text-white/40 hover:text-white/60 active:text-white/80 transition-colors inline-flex items-center gap-1 group py-2 px-4 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================
// NOW VIEW
// ======================

const NowView = ({ venues, insights, cityStatus, settings, setSelectedVenue, showInsights, setShowInsights }) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current && scrollRef.current.scrollTop > 50) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const activeInsights = insights.filter(insight => {
    if (insight.type === 'warning' && !settings.crowdSurgeAlerts) return false;
    if (insight.type === 'info' && !settings.parkingAlerts) return false;
    if (insight.type === 'event' && !settings.eventAlerts) return false;
    return true;
  });

  return (
    <div className="h-full relative">
      <div ref={scrollRef} className="h-full overflow-y-auto px-4 sm:px-6 scrollbar-custom">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8">
          {settings.proactiveAlerts && activeInsights.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="w-full flex items-center justify-between mb-3 sm:mb-4 group active:scale-[0.98] transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-pulse-slow" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Smart Insights</h3>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full animate-bounce-subtle">
                    {activeInsights.length}
                  </span>
                </div>
                <ChevronUp className={`w-5 h-5 text-white/40 transition-transform duration-300 ${showInsights ? '' : 'rotate-180'}`} />
              </button>

              <div className={`transition-all duration-500 ease-in-out ${showInsights ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3 mb-4 sm:mb-6">
                  {activeInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="animate-slide-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <GlassCard className="border-l-4 border-purple-500/50 hover:border-purple-400 active:scale-[0.99] transition-all duration-200">
                        <div className="flex gap-3 sm:gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            insight.priority === 'high' ? 'bg-rose-500/20' :
                            insight.priority === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                          }`}>
                            <insight.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-white/40 mb-1">{insight.venue}</div>
                            <div className="text-sm font-medium text-white mb-1">{insight.message}</div>
                            <div className="text-xs text-white/60 leading-relaxed">{insight.actionable}</div>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 px-1">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              Nearby Venues
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {venues.map((venue, idx) => (
                <div
                  key={venue.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <GlassCard
                    onClick={() => setSelectedVenue(venue)}
                    className="hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="text-3xl sm:text-4xl transform group-active:scale-95 transition-transform">{venue.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-semibold text-white mb-1 flex items-center gap-2 group-hover:text-purple-300 transition-colors truncate">
                              <span className="truncate">{venue.name}</span>
                              {venue.trending && (
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 animate-pulse flex-shrink-0" />
                              )}
                            </h4>
                            <p className="text-xs sm:text-sm text-white/50 truncate">{venue.type} • {venue.distance}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <StatusBadge status={venue.status} crowd={venue.crowd} />
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-white/60 mb-3 line-clamp-2">{venue.description}</p>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                          <CrowdMeter value={venue.crowd} label="Capacity" size="sm" />
                          <CrowdMeter value={venue.safety} label="Safety Score" size="sm" />
                        </div>

                        {venue.alerts && venue.alerts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {venue.alerts.map((alert, idx) => (
                              <span key={idx} className="px-2 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-lg border border-amber-500/20">
                                {alert}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs text-white/40">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="truncate">{venue.hours}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="truncate">{venue.currentWait}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-4" />
        </div>
      </div>

      {showScrollIndicator && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce-slow pointer-events-none">
          <div className="flex flex-col items-center gap-1 sm:gap-2 text-white/40 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            <span className="text-xs">Scroll to explore</span>
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
          </div>
        </div>
      )}
    </div>
  );
};

// ======================
// MAP VIEW
// ======================

const MapView = ({ venues, cityStatus, CITIES, currentCity, setSelectedVenue }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const ref = scrollContainerRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [venues]);

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
      <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          <div className="text-center space-y-3 sm:space-y-4 relative z-10">
            <div className="relative inline-block">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto animate-bounce-slow" />
              <div className="absolute inset-0 bg-purple-400/30 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-sm sm:text-base text-white/60 font-medium">Interactive map view</p>
            <p className="text-xs sm:text-sm text-white/40">{CITIES[currentCity].name}</p>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6">
          {venues.length > 2 && (
            <div className="mb-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white/60">
                <ChevronRight className="w-3 h-3" />
                <span>Swipe to explore venues</span>
                <ChevronRight className="w-3 h-3 rotate-180" />
              </div>
            </div>
          )}
          
          <div className="relative">
            {showLeftArrow && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-gradient-to-r from-black/80 to-transparent items-center justify-start pl-2 animate-fade-in-delayed active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>
            )}

            {showRightArrow && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-gradient-to-l from-black/80 to-transparent items-center justify-end pr-2 animate-fade-in-delayed active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}

            <div 
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory touch-pan-x"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {venues.map((venue, idx) => (
                <div
                  key={venue.id}
                  className="snap-center animate-slide-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <GlassCard
                    onClick={() => !isDragging && setSelectedVenue(venue)}
                    className="min-w-[260px] sm:min-w-[280px] flex-shrink-0 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl sm:text-3xl transform group-active:scale-95 transition-transform">{venue.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">{venue.name}</h4>
                        <p className="text-xs text-white/50 truncate">{venue.distance}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={venue.status} crowd={venue.crowd} />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
            
            <div className="flex sm:hidden justify-center gap-1 mt-3">
              {venues.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === 0 ? 'w-6 bg-purple-500' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================
// ALERTS VIEW
// ======================

const AlertsView = ({ CITIES, currentCity, currentTime, cityStatus, settings, insights, venues }) => {
  const timeStr = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const scrollRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current && scrollRef.current.scrollTop > 50) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="h-full relative">
      <div ref={scrollRef} className="h-full overflow-y-auto px-4 sm:px-6 scrollbar-custom">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8">
          <div className="animate-slide-down pt-2">
            <GlassCard className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/25 hover:to-blue-500/25 transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center animate-pulse-slow flex-shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Alert Center</h3>
                  <p className="text-xs sm:text-sm text-white/60 truncate">Real-time notifications • {timeStr}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-medium text-white/50 mb-3 uppercase tracking-wider flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Active Alerts
            </h4>
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight, idx) => (
                <div
                  key={idx}
                  className="animate-slide-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <GlassCard className="hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group">
                    <div className="flex gap-3 sm:gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        insight.priority === 'high' ? 'bg-rose-500/20 group-hover:bg-rose-500/30' :
                        insight.priority === 'medium' ? 'bg-amber-500/20 group-hover:bg-amber-500/30' : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                      }`}>
                        <insight.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">{insight.venue}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                            insight.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                            insight.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {insight.priority}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-1">{insight.message}</p>
                        <p className="text-xs text-white/50 leading-relaxed">{insight.actionable}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}

              {insights.length === 0 && (
                <GlassCard className="animate-fade-in-delayed">
                  <div className="text-center py-8">
                    <div className="relative inline-block mb-3">
                      <Info className="w-10 h-10 sm:w-12 sm:h-12 text-white/30 mx-auto" />
                      <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse" />
                    </div>
                    <p className="text-sm sm:text-base text-white/50">No active alerts</p>
                    <p className="text-xs sm:text-sm text-white/30 mt-1 px-4">We'll notify you when something important happens</p>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-medium text-white/50 mb-3 uppercase tracking-wider px-1">Venue Status</h4>
            <div className="grid gap-3">
              {venues.map((venue, idx) => (
                <div
                  key={venue.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <GlassCard className="hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-xl sm:text-2xl transform group-active:scale-95 transition-transform flex-shrink-0">{venue.icon}</div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">{venue.name}</h5>
                          <p className="text-xs text-white/50 truncate">{venue.type}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={venue.status} crowd={venue.crowd} />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-4" />
        </div>
      </div>

      {showScrollIndicator && insights.length > 0 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce-slow pointer-events-none">
          <div className="flex flex-col items-center gap-1 sm:gap-2 text-white/40 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            <span className="text-xs">Scroll for more</span>
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
          </div>
        </div>
      )}
    </div>
  );
};

// ======================
// VENUE DETAIL MODAL
// ======================

const VenueDetailModal = ({ venue, onClose, selectedHour, onHourSelect, showTimeline, setShowTimeline, currentTime }) => {
  const predictions = useMemo(() => generateHourlyPredictions(venue, currentTime), [venue, currentTime]);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  if (!venue) return null;

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (currentY - startY > 100) {
      onClose();
    }
    setStartY(0);
    setCurrentY(0);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-delayed"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-gray-900 to-black w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden border-t sm:border border-white/10 max-h-[90vh] flex flex-col animate-slide-up shadow-2xl shadow-purple-500/20"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="sm:hidden flex justify-center py-2 bg-white/[0.02]">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="text-4xl sm:text-5xl flex-shrink-0">{venue.icon}</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 line-clamp-2">{venue.name}</h2>
                <p className="text-xs sm:text-sm text-white/50 truncate">{venue.address}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all flex-shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
            </button>
          </div>
          <StatusBadge status={venue.status} crowd={venue.crowd} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-custom">
          <p className="text-sm sm:text-base text-white/70 leading-relaxed">{venue.description}</p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <GlassCard>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-xs sm:text-sm text-white/60">Capacity</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-2">{venue.crowd}%</div>
              <CrowdMeter value={venue.crowd} label="" showPercentage={false} />
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="text-xs sm:text-sm text-white/60">Safety</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-2">{venue.safety}%</div>
              <CrowdMeter value={venue.safety} label="" showPercentage={false} />
            </GlassCard>
          </div>

          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.12] rounded-xl sm:rounded-2xl transition-all active:scale-[0.98]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="font-medium text-sm sm:text-base text-white">12-Hour Forecast</span>
            </div>
            <ChevronUp className={`w-5 h-5 text-white/40 transition-transform ${showTimeline ? '' : 'rotate-180'}`} />
          </button>

          {showTimeline && (
            <div className="space-y-2 sm:space-y-3 overflow-hidden">
              {predictions.map((pred, idx) => (
                <button
                  key={idx}
                  onClick={() => onHourSelect(pred)}
                  className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 animate-slide-in group text-left ${
                    selectedHour?.hourNum === pred.hourNum
                      ? 'bg-purple-500/20 border-2 border-purple-500/50 scale-[1.01]'
                      : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:bg-white/[0.12] hover:border-white/20 active:scale-[0.99]'
                  }`}
                  style={{ 
                    animationDelay: `${idx * 0.05}s`,
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium transition-colors ${
                      selectedHour?.hourNum === pred.hourNum ? 'text-purple-300' : 'text-white group-hover:text-purple-200'
                    }`}>
                      {pred.time}
                    </span>
                    <StatusBadge status={pred.status} crowd={pred.crowd} />
                  </div>
                  <CrowdMeter value={pred.crowd} label="Predicted Capacity" size="sm" />
                  <div className="mt-2 text-xs text-white/40 flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {pred.parking}% parking
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {pred.confidence}% confidence
                    </span>
                  </div>
                  {selectedHour?.hourNum === pred.hourNum && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-purple-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        Selected time slot
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {venue.events && venue.events.length > 0 && (
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">Upcoming Events</h4>
              </div>
              {venue.events.map((event, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10' : ''}>
                  <div className="text-sm font-medium text-white mb-1">{event.name}</div>
                  <div className="text-xs sm:text-sm text-white/60 leading-relaxed">{event.impact}</div>
                </div>
              ))}
            </GlassCard>
          )}

          <button 
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:from-purple-700 active:to-blue-700 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
            Navigate to {venue.name}
          </button>

          <div className="text-xs text-white/40 text-center pb-2">
            {venue.civicZone} • {venue.hours}
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================
// CITY SELECTOR MODAL
// ======================

const CitySelectorModal = ({ setIsCitySelectorOpen, setCurrentCity, currentCity, CITIES, onCityChange }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsCitySelectorOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-delayed" 
      onClick={handleBackdropClick}
    >
      <GlassCard className="max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white">Select City</h3>
          <button
            onClick={() => setIsCitySelectorOpen(false)}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-300 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(CITIES).map(([key, city], idx) => (
            <button
              key={key}
              onClick={() => {
                setCurrentCity(key);
                setIsCitySelectorOpen(false);
                onCityChange();
              }}
              className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 text-left animate-slide-in group ${
                currentCity === key
                  ? 'bg-purple-500/20 border-2 border-purple-500/50 scale-[1.01]'
                  : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:bg-white/[0.12] hover:border-purple-500/30 active:scale-[0.99]'
              }`}
              style={{ 
                animationDelay: `${idx * 0.1}s`,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl transform group-active:scale-95 transition-transform">{city.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base sm:text-lg font-semibold transition-colors truncate ${
                    currentCity === key ? 'text-purple-300' : 'text-white group-hover:text-purple-200'
                  }`}>
                    {city.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-white/50 truncate">{city.subtitle}</p>
                </div>
                {currentCity === key && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 flex items-center justify-center animate-scale-in flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ======================
// SETTINGS MODAL
// ======================

const SettingsModal = ({ setIsSettingsOpen, settings, setSettings }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsSettingsOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-delayed" 
      onClick={handleBackdropClick}
    >
      <GlassCard className="max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-custom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-inherit z-10 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Settings</h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-300 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Alert Preferences
          </h4>
          
          {[
            { key: 'proactiveAlerts', label: 'Proactive Insights', desc: 'Get smart recommendations', icon: Sparkles },
            { key: 'crowdSurgeAlerts', label: 'Crowd Surge Alerts', desc: 'Notify when crowds increase', icon: TrendingUp },
            { key: 'parkingAlerts', label: 'Parking Alerts', desc: 'Warn about parking availability', icon: MapPin },
            { key: 'eventAlerts', label: 'Event Alerts', desc: 'Notify about nearby events', icon: Calendar }
          ].map(({ key, label, desc, icon: Icon }, idx) => (
            <div 
              key={key} 
              className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.04] rounded-xl sm:rounded-2xl border border-white/10 hover:bg-white/[0.06] active:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-300 group animate-slide-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">{label}</div>
                  <div className="text-xs text-white/50 truncate">{desc}</div>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                className={`w-11 sm:w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ml-2 ${
                  settings[key] ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/20'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 absolute top-0.5 ${
                  settings[key] ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 text-xs text-white/40 text-center flex items-center justify-center gap-2 animate-fade-in-slow">
          <Sparkles className="w-3 h-3 text-purple-400" />
          KROWDGUIDE v1.0 • AI-Powered Crowd Intelligence
        </div>
      </GlassCard>
    </div>
  );
};

// ======================
// MAIN APP
// ======================

export default function App() {
  const [appState, setAppState] = useState('splash');
  const [currentCity, setCurrentCity] = useState('oak-cliff');
  const [activeView, setActiveView] = useState('now');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [showInsights, setShowInsights] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [settings, setSettings] = useState({
    proactiveAlerts: true,
    crowdSurgeAlerts: true,
    parkingAlerts: true,
    eventAlerts: true
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { venues } = useMemo(() => CITIES[currentCity] || CITIES['oak-cliff'], [currentCity]);
  const insights = useMemo(() => generateInsights(venues, currentTime), [venues, currentTime]);

  const resetVenueState = () => {
    setSelectedVenue(null);
    setSelectedHour(null);
    setShowTimeline(false);
  };

  if (appState === 'splash') {
    return <LandingHero setAppState={setAppState} />;
  }

  if (appState === 'location') {
    return <LocationSelector setAppState={setAppState} setCurrentCity={setCurrentCity} />;
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm">
        <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white">KROWDGUIDE</div>
                <div className="text-xs text-white/40">{CITIES[currentCity].name}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setIsCitySelectorOpen(true)}
                className="p-2 sm:p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-xl sm:text-2xl">{CITIES[currentCity].icon}</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 sm:p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-all active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-[72px] sm:pt-20 pb-[88px] sm:pb-24 overflow-hidden">
        {activeView === 'now' && (
          <NowView
            venues={venues}
            insights={insights}
            cityStatus={CITIES[currentCity]}
            settings={settings}
            setSelectedVenue={setSelectedVenue}
            showInsights={showInsights}
            setShowInsights={setShowInsights}
          />
        )}
        {activeView === 'map' && (
          <MapView
            venues={venues}
            cityStatus={CITIES[currentCity]}
            CITIES={CITIES}
            currentCity={currentCity}
            setSelectedVenue={setSelectedVenue}
          />
        )}
        {activeView === 'alerts' && (
          <AlertsView
            CITIES={CITIES}
            currentCity={currentCity}
            currentTime={currentTime}
            cityStatus={CITIES[currentCity]}
            settings={settings}
            insights={insights}
            venues={venues}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-safe bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md z-40">
        <div className="pb-3 sm:pb-6 px-3 sm:px-6 pt-3">
          <GlassCard noPadding className="overflow-hidden shadow-2xl">
            <div className="flex items-center justify-around p-1.5 sm:p-2 relative">
              <div
                className="absolute h-full bg-gradient-to-r from-purple-600/40 to-blue-600/40 rounded-xl sm:rounded-2xl transition-all duration-500 ease-out"
                style={{
                  width: '33.333%',
                  left: activeView === 'now' ? '0%' : activeView === 'map' ? '33.333%' : '66.666%',
                }}
              />
              
              {[
                { id: 'now', icon: Play, label: 'Now' },
                { id: 'map', icon: MapPin, label: 'Map' },
                { id: 'alerts', icon: Bell, label: 'Alerts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex flex-col items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 relative z-10 group active:scale-95 ${
                    activeView === tab.id
                      ? 'text-white scale-105'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className={`relative ${activeView === tab.id ? 'animate-bounce-subtle' : ''}`}>
                    <tab.icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        activeView === tab.id ? 'drop-shadow-glow' : ''
                      }`} 
                      strokeWidth={activeView === tab.id ? 2.5 : 2} 
                    />
                    {activeView === tab.id && (
                      <div className="absolute inset-0 bg-white/30 blur-md rounded-full animate-pulse-slow" />
                    )}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
                    activeView === tab.id ? 'tracking-wide' : ''
                  }`}>
                    {tab.label}
                  </span>
                  
                  {activeView === tab.id && (
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl animate-ripple bg-white/10" />
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {selectedVenue && (
        <VenueDetailModal
          venue={selectedVenue}
          onClose={resetVenueState}
          selectedHour={selectedHour}
          onHourSelect={setSelectedHour}
          showTimeline={showTimeline}
          setShowTimeline={setShowTimeline}
          currentTime={currentTime}
        />
      )}

      {isCitySelectorOpen && (
        <CitySelectorModal
          setIsCitySelectorOpen={setIsCitySelectorOpen}
          setCurrentCity={setCurrentCity}
          currentCity={currentCity}
          CITIES={CITIES}
          onCityChange={resetVenueState}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          setIsSettingsOpen={setIsSettingsOpen}
          settings={settings}
          setSettings={setSettings}
        />
      )}
    </div>
  );
}
