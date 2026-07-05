// src/pages/Landing.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from 'framer-motion';
import {
  Rocket,
  FileText,
  CalendarCheck,
  BarChart3,
  Star,
  Calendar,
  MessageSquare,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Users,
  Award,
  TrendingUp,
  Brain,
  LayoutDashboard,
  Play,
  Quote,
  Star as StarIcon,
  ChevronDown,
  Globe,
  Lock,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Target,
  Layers,
  CheckCircle2,
  Clock3,
  Bell,
  Search,
  Activity,
  FileBarChart,
  Settings,
  User,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';

// ═══════════════════════════════════════════════════
// 1. ANIMATION VARIANTS
// ═══════════════════════════════════════════════════

const springConfig = { type: 'spring', stiffness: 100, damping: 15 };
const springBouncy = { type: 'spring', stiffness: 300, damping: 20 };
const springGentle = { type: 'spring', stiffness: 80, damping: 20 };

const fadeInUp = {
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -100, rotateY: -15 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 100, rotateY: 15 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const flipIn = {
  hidden: { opacity: 0, rotateX: -30, y: 40 },
  visible: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

// ═══════════════════════════════════════════════════
// 2. CUSTOM HOOKS
// ═══════════════════════════════════════════════════

function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  return useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
}

// ═══════════════════════════════════════════════════
// 3. HERO SECTION — FIXED NAVBAR OVERLAP + ENHANCED DASHBOARD
// ═══════════════════════════════════════════════════

function HeroSection({ handleCTA, isAuthenticated }) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, 200]);
  const y2 = useTransform(scrollY, [0, 600], [0, -150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.9]);

  const titleWords = ['Manage', 'Teams'];
  const subtitleWords = ['With', 'the', 'TeamTrack'];

  // Dashboard animation controls
  const dashboardRef = useRef(null);
  const isDashboardInView = useInView(dashboardRef, { once: true, amount: 0.1 });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 md:pt-32">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8f7f9]" />

      {/* Floating Orbs with Parallax */}
      <motion.div style={{ y: y1 }} className="absolute top-10 left-[5%] w-[500px] h-[500px] bg-[#0080c8]/8 rounded-full blur-[100px]" />
      <motion.div style={{ y: y2 }} className="absolute bottom-0 right-[5%] w-[600px] h-[600px] bg-[#92dce5]/15 rounded-full blur-[120px]" />
      <motion.div style={{ y: y1 }} className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#0080c8]/5 rounded-full blur-[80px]" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#0080c8 1px, transparent 1px), linear-gradient(90deg, #0080c8 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Floating Decorations */}
      <motion.div
        animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-36 left-[12%] w-14 h-14 bg-gradient-to-br from-[#0080c8]/20 to-[#92dce5]/30 rounded-2xl backdrop-blur-sm border border-white/50 shadow-2xl hidden lg:flex items-center justify-center"
      >
        <Sparkles className="w-7 h-7 text-[#0080c8]" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute top-52 right-[15%] w-10 h-10 bg-gradient-to-br from-[#92dce5]/30 to-[#0080c8]/20 rounded-full backdrop-blur-sm border border-white/50 shadow-xl hidden lg:flex items-center justify-center"
      >
        <Zap className="w-5 h-5 text-[#0080c8]" />
      </motion.div>

      <motion.div style={{ opacity, scale }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ...springGentle }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-[#0080c8]/15 shadow-lg shadow-[#0080c8]/5 mb-10"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-4 h-4 text-[#0080c8]" />
            </motion.div>
            <span className="text-sm font-bold text-[#0080c8]">Streamlined Team Management</span>
          </motion.div>

          {/* Heading */}
          <div className="mb-6 overflow-hidden">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
            >
              <span className="block text-[#2b2d42] mb-2">
                {titleWords.map((word, i) => (
                  <motion.span
                    key={word}
                    variants={fadeInUp}
                    custom={i}
                    className="inline-block mr-[0.25em]"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <span className="block">
                {subtitleWords.map((word, i) => (
                  <motion.span
                    key={word}
                    variants={fadeInUp}
                    custom={i + 2}
                    className="inline-block mr-[0.25em] bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-lg sm:text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto"
          >
            AI-powered platform to upload training plans, auto-generate daily tasks and quizzes,
            track attendance, and evaluate Teams — all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] text-white font-bold text-base rounded-2xl shadow-2xl shadow-[#0080c8]/30 hover:shadow-[#0080c8]/50 transition-shadow duration-500 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#00a8e8] to-[#0080c8]"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-white text-slate-700 font-bold text-base rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-lg hover:border-[#0080c8]/30 transition-all duration-300 flex items-center gap-2.5"
            >
              <Play className="w-4 h-4 text-[#0080c8]" />
              Sign In
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto"
          >
            {[
              { value: '10K+', label: 'Interns Managed' },
              { value: '500+', label: 'Organizations' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={springBouncy}
                className="text-center group cursor-default"
              >
                <motion.div
                  className="text-3xl sm:text-4xl font-extrabold text-[#2b2d42] group-hover:text-[#0080c8] transition-colors duration-300"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.15, ...springBouncy }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════
            ENHANCED DASHBOARD PREVIEW — HIGHLY VISIBLE WITH RICH ANIMATIONS
            ═══════════════════════════════════════════════════ */}
        <motion.div
          ref={dashboardRef}
          initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 10 }}
          animate={isDashboardInView ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          className="mt-16 lg:mt-20 relative max-w-6xl mx-auto"
          style={{ perspective: '1500px' }}
        >
          {/* Outer Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-8 bg-gradient-to-r from-[#0080c8]/15 via-[#92dce5]/20 to-[#0080c8]/15 rounded-[2.5rem] blur-3xl"
          />

          <motion.div
            whileHover={{ rotateX: -3, rotateY: 3, scale: 1.01 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Main Dashboard Container */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50/90 border-b border-slate-200">
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3.5 h-3.5 rounded-full bg-red-400 cursor-pointer" />
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3.5 h-3.5 rounded-full bg-amber-400 cursor-pointer" />
                  <motion.div whileHover={{ scale: 1.2 }} className="w-3.5 h-3.5 rounded-full bg-green-400 cursor-pointer" />
                </div>
                <div className="flex-1 mx-5">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-1.5 text-xs text-slate-500 border border-slate-200 flex items-center justify-center gap-2 max-w-md mx-auto shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    app.interntrack.com/dashboard
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Live</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 lg:p-6 grid grid-cols-12 gap-4 bg-gradient-to-b from-slate-50/80 to-white">
                {/* Sidebar */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="col-span-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center shadow-md">
                      <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-sm text-[#2b2d42]">TeamTrack</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { name: 'Dashboard', active: true, icon: LayoutDashboard },
                      { name: 'My Tasks', active: false, icon: CheckCircle2 },
                      { name: 'Calendar', active: false, icon: Calendar },
                      { name: 'Attendance', active: false, icon: Clock3 },
                      { name: 'Quizzes', active: false, icon: Brain },
                      { name: 'Reports', active: false, icon: FileBarChart },
                      { name: 'Settings', active: false, icon: Settings },
                    ].map((item, i) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.8 + i * 0.08, duration: 0.5 }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(0,128,200,0.05)' }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                          item.active
                            ? 'bg-[#0080c8]/10 text-[#0080c8] font-bold shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${item.active ? 'text-[#0080c8]' : 'text-slate-400'}`} />
                        {item.name}
                        {item.active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0080c8]"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* User Profile Mini */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isDashboardInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.4, duration: 0.6 }}
                    className="mt-6 pt-4 border-t border-slate-100"
                  >
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0080c8] to-[#92dce5] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#2b2d42] truncate">Alex Johnson</div>
                        <div className="text-[10px] text-slate-400">Intern</div>
                      </div>
                      <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Main Content Area */}
                <div className="col-span-9 space-y-4">
                  {/* Top Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={isDashboardInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex items-center justify-between mb-2"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-[#2b2d42]">Dashboard Overview</h3>
                      <p className="text-xs text-slate-400">Welcome back! Here is your progress today.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search...</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm cursor-pointer relative"
                      >
                        <Bell className="w-4 h-4 text-slate-500" />
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Tasks', val: '24', sub: '+12 this week', color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600', icon: CheckCircle2, trend: '+12%' },
                      { label: 'Completed', val: '18', sub: '75% rate', color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: TrendingUp, trend: '+5%' },
                      { label: 'Attendance', val: '95%', sub: 'This month', color: 'from-violet-500 to-purple-400', bg: 'bg-violet-50', text: 'text-violet-600', icon: Activity, trend: '+2%' },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={isDashboardInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ delay: 0.9 + i * 0.12, duration: 0.7, ...springGentle }}
                        whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#0080c8]/10 transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                              <s.icon className={`w-4 h-4 ${s.text}`} />
                            </div>
                            <div className="text-xs text-slate-400 font-medium">{s.label}</div>
                          </div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 1.2 + i * 0.1 }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-emerald-600 text-[10px] font-bold"
                          >
                            <TrendingUp className="w-3 h-3" />
                            {s.trend}
                          </motion.div>
                        </div>
                        <div className={`text-3xl font-black ${s.text} mb-1`}>{s.val}</div>
                        <div className="text-[11px] text-slate-400">{s.sub}</div>

                        {/* Mini Progress Bar */}
                        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={isDashboardInView ? { width: `${parseInt(s.val) * (s.val.includes('%') ? 1 : 4)}%` } : {}}
                            transition={{ duration: 1.5, delay: 1.3 + i * 0.15, ease: 'easeOut' }}
                            className={`h-1.5 rounded-full bg-gradient-to-r ${s.color}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tasks & Chart Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Recent Tasks */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 1.1, duration: 0.8 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#0080c8]" />
                          <span className="font-bold text-sm text-[#2b2d42]">Recent Tasks</span>
                        </div>
                        <span className="text-xs text-[#0080c8] font-semibold cursor-pointer hover:underline">View All</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { title: 'AI Module Training - Day 1', status: 'In Progress', progress: 75, color: 'bg-[#0080c8]', time: '2h left' },
                          { title: 'Quiz: Machine Learning Basics', status: 'Pending', progress: 0, color: 'bg-slate-300', time: 'Due tomorrow' },
                          { title: 'Submit Weekly Report', status: 'Completed', progress: 100, color: 'bg-emerald-500', time: 'Done' },
                          { title: 'Attend Expert Session', status: 'Upcoming', progress: 30, color: 'bg-amber-400', time: 'In 1h' },
                        ].map((task, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 1.3 + i * 0.12, duration: 0.5 }}
                            whileHover={{ x: 4, backgroundColor: 'rgba(0,128,200,0.03)' }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 cursor-pointer transition-colors"
                          >
                            <motion.div
                              animate={task.progress === 100 ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.5, delay: 2 + i * 0.2 }}
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                task.progress === 100 ? 'bg-emerald-500' : task.progress > 0 ? 'bg-[#0080c8]' : 'bg-slate-300'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#2b2d42] truncate">{task.title}</div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={isDashboardInView ? { width: `${task.progress}%` } : {}}
                                  transition={{ duration: 1.5, delay: 1.6 + i * 0.15, ease: 'easeOut' }}
                                  className={`h-1.5 rounded-full ${task.color}`}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
                                task.progress === 100
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : task.progress > 0
                                  ? 'bg-[#0080c8]/10 text-[#0080c8]'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {task.status}
                              </span>
                              <span className="text-[10px] text-slate-400">{task.time}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Weekly Progress Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 1.2, duration: 0.8 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#0080c8]" />
                          <span className="font-bold text-sm text-[#2b2d42]">Weekly Progress</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-[#0080c8]" />
                          Tasks
                          <div className="w-2 h-2 rounded-full bg-emerald-400 ml-2" />
                          Completed
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="flex items-end justify-between gap-3 h-32 px-2">
                        {[
                          { day: 'Mon', tasks: 65, completed: 45 },
                          { day: 'Tue', tasks: 80, completed: 60 },
                          { day: 'Wed', tasks: 55, completed: 40 },
                          { day: 'Thu', tasks: 90, completed: 75 },
                          { day: 'Fri', tasks: 70, completed: 55 },
                          { day: 'Sat', tasks: 40, completed: 30 },
                          { day: 'Sun', tasks: 30, completed: 25 },
                        ].map((day, i) => (
                          <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                            <div className="relative w-full flex items-end justify-center gap-1 h-24">
                              {/* Tasks bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={isDashboardInView ? { height: `${day.tasks}%` } : {}}
                                transition={{ duration: 1, delay: 1.5 + i * 0.08, ease: 'easeOut' }}
                                className="w-3 rounded-t-lg bg-[#0080c8]/20"
                              />
                              {/* Completed bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={isDashboardInView ? { height: `${day.completed}%` } : {}}
                                transition={{ duration: 1, delay: 1.6 + i * 0.08, ease: 'easeOut' }}
                                className="w-3 rounded-t-lg bg-gradient-to-t from-[#0080c8] to-[#00a8e8]"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{day.day}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-black text-[#2b2d42]">85%</div>
                            <div className="text-[10px] text-slate-400">Avg Completion</div>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="text-center">
                            <div className="text-lg font-black text-emerald-600">+12%</div>
                            <div className="text-[10px] text-slate-400">vs last week</div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 rounded-lg bg-[#0080c8]/10 text-[#0080c8] text-[10px] font-bold hover:bg-[#0080c8]/20 transition-colors"
                        >
                          View Report
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom Row: Upcoming Events & Notifications */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isDashboardInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 1.4, duration: 0.7 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-[#0080c8]" />
                        <span className="font-bold text-sm text-[#2b2d42]">Upcoming Events</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { title: 'Expert Session: AI Ethics', time: 'Today, 2:00 PM', type: 'session', color: 'bg-amber-50 text-amber-600' },
                          { title: 'Quiz Deadline: ML Basics', time: 'Tomorrow, 11:59 PM', type: 'deadline', color: 'bg-red-50 text-red-600' },
                          { title: 'Team Standup', time: 'Mon, 9:00 AM', type: 'meeting', color: 'bg-blue-50 text-blue-600' },
                        ].map((event, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 1.6 + i * 0.1 }}
                            whileHover={{ x: 3 }}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className={`w-8 h-8 rounded-lg ${event.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                              <Calendar className={`w-4 h-4 ${event.color.split(' ')[1]}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#2b2d42] truncate">{event.title}</div>
                              <div className="text-[10px] text-slate-400">{event.time}</div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${event.color}`}>
                              {event.type}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isDashboardInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 1.5, duration: 0.7 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-4 h-4 text-[#0080c8]" />
                        <span className="font-bold text-sm text-[#2b2d42]">Notifications</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { text: 'New task assigned: Data Analysis', time: '5 min ago', icon: CheckCircle2, color: 'text-blue-500' },
                          { text: 'Quiz graded: 92/100', time: '1 hour ago', icon: Award, color: 'text-emerald-500' },
                          { text: 'Attendance marked for today', time: '3 hours ago', icon: Clock3, color: 'text-violet-500' },
                          { text: 'Weekly report due tomorrow', time: '5 hours ago', icon: AlertCircle, color: 'text-amber-500' },
                        ].map((notif, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={isDashboardInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 1.7 + i * 0.1 }}
                            whileHover={{ x: -3, backgroundColor: 'rgba(0,128,200,0.03)' }}
                            className="flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <notif.icon className={`w-3.5 h-3.5 ${notif.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-[#2b2d42] leading-snug">{notif.text}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{notif.time}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}


// ═══════════════════════════════════════════════════
// 4. FEATURES SECTION
// ═══════════════════════════════════════════════════

function FeaturesSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const features = [
    {
      icon: Brain,
      title: 'AI Task Generation',
      description: 'Upload training plan PDFs and let AI break them into structured daily tasks with quizzes for each module.',
      gradient: 'from-blue-500 to-cyan-400',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600',
      shadowColor: 'shadow-blue-500/20',
    },
    {
      icon: CalendarCheck,
      title: 'Attendance Tracking',
      description: 'Daily attendance window with automatic absence marking and smart warnings for consecutive absences.',
      gradient: 'from-emerald-500 to-teal-400',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      shadowColor: 'shadow-emerald-500/20',
    },
    {
      icon: BarChart3,
      title: 'Quiz Engine',
      description: 'Auto-generated MCQs from task content with instant grading and score tracking for evaluation.',
      gradient: 'from-violet-500 to-purple-400',
      bgLight: 'bg-violet-50',
      iconColor: 'text-violet-600',
      shadowColor: 'shadow-violet-500/20',
    },
    {
      icon: Star,
      title: 'Weekly Evaluations',
      description: 'Computed performance scores based on attendance, task completion, and expert feedback.',
      gradient: 'from-amber-500 to-orange-400',
      bgLight: 'bg-amber-50',
      iconColor: 'text-amber-600',
      shadowColor: 'shadow-amber-500/20',
    },
    {
      icon: Calendar,
      title: 'Expert Sessions',
      description: 'Schedule weekly expert sessions per discipline with automated notifications for all participants.',
      gradient: 'from-rose-500 to-pink-400',
      bgLight: 'bg-rose-50',
      iconColor: 'text-rose-600',
      shadowColor: 'shadow-rose-500/20',
    },
    {
      icon: MessageSquare,
      title: 'Submission Review',
      description: 'Interns upload task proof, admins review and provide feedback — all tracked in the system.',
      gradient: 'from-sky-500 to-blue-400',
      bgLight: 'bg-sky-50',
      iconColor: 'text-sky-600',
      shadowColor: 'shadow-sky-500/20',
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f7f9] via-white to-white" />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#0080c8]/5 rounded-full blur-[120px]"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0080c8]/5 border border-[#0080c8]/10 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-4 h-4 text-[#0080c8]" />
            </motion.div>
            <span className="text-sm font-bold text-[#0080c8]">Powerful Features</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#2b2d42] mb-6 tracking-tight"
          >
            Everything You Need to
            <span className="block mt-2 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent">
              Run Internships
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-slate-500 leading-relaxed"
          >
            From onboarding to evaluation, manage the entire internship lifecycle with our
            comprehensive toolset.
          </motion.p>
        </motion.div>
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={flipIn}
              whileHover={{ y: -12, scale: 1.02 }}
              transition={springGentle}
              className="group relative"
            >
              <div className="relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 h-full overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-[#0080c8]/[0.03] to-[#92dce5]/[0.05]"
                />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-[0.08]`} />
                </div>
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`relative w-14 h-14 rounded-2xl ${feature.bgLight} flex items-center justify-center mb-6 group-hover:shadow-lg ${feature.shadowColor} transition-shadow duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={1.5} />
                </motion.div>
                <h3 className="relative text-xl font-bold text-[#2b2d42] mb-3 group-hover:text-[#0080c8] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="relative text-slate-500 leading-relaxed text-sm">
                  {feature.description}
                </p>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ x: 0 }}
                  className="relative mt-6 flex items-center gap-1.5 text-sm font-bold text-[#0080c8] opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  Learn more
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// 5. HOW IT WORKS
// ═══════════════════════════════════════════════════

function HowItWorksSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const steps = [
    {
      number: '01',
      title: 'Upload Training Plan',
      description: 'Upload your PDF training plan. Our AI parses the document, identifies key modules and learning objectives, then automatically generates structured daily tasks.',
      icon: FileText,
      color: 'from-blue-500 to-cyan-400',
    },
    {
      number: '02',
      title: 'Auto-Generate Tasks',
      description: 'AI automatically creates daily tasks and quizzes tailored to each module. Interns receive their daily assignments with clear instructions and deadlines.',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-400',
    },
    {
      number: '03',
      title: 'Track & Evaluate',
      description: 'Monitor attendance, review submissions, and get automated performance reports. Weekly evaluations combine attendance, task completion, and quiz scores.',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-400',
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0080c8]/5 border border-[#0080c8]/10 mb-8"
          >
            <Clock className="w-4 h-4 text-[#0080c8]" />
            <span className="text-sm font-bold text-[#0080c8]">Simple Process</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#2b2d42] mb-6 tracking-tight"
          >
            Get Started in
            <span className="block mt-2 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent">
              3 Easy Steps
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-slate-500 leading-relaxed"
          >
            From setup to evaluation, our streamlined process gets you running in minutes.
          </motion.p>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden lg:block absolute top-24 left-[20%] right-[20%] h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.8, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-[#0080c8]/30 via-[#92dce5]/50 to-[#0080c8]/30 origin-left"
            />
          </div>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={index === 0 ? slideInLeft : index === 2 ? slideInRight : fadeInUp}
              transition={{ delay: index * 0.25 }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={springGentle}
                className="relative bg-gradient-to-b from-slate-50/80 to-white rounded-2xl p-8 border border-slate-100 hover:border-[#0080c8]/20 hover:shadow-xl transition-all duration-500 h-full group"
              >
                <div className="flex items-center justify-between mb-8">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  >
                    <step.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.6 + index * 0.2, ...springBouncy }}
                    className="text-6xl font-black text-slate-100 group-hover:text-[#0080c8]/10 transition-colors duration-500"
                  >
                    {step.number}
                  </motion.span>
                </div>
                <h3 className="text-xl font-bold text-[#2b2d42] mb-4 group-hover:text-[#0080c8] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {step.description}
                </p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 1 + index * 0.3, ...springBouncy }}
                  className="hidden lg:block absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-4 border-[#0080c8] shadow-lg z-10"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// 6. TESTIMONIALS
// ═══════════════════════════════════════════════════

function TestimonialsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const testimonials = [
    {
      name: 'Ayesha Khan',
      role: 'HR Director',
      company: 'TechVenture Pakistan',
      country: 'Pakistan',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'TeamTrack transformed our internship program. The AI task generation saved us 20+ hours per week. Our intern satisfaction scores increased by 40%.',
    },
    {
      name: 'Omar Al-Rashid',
      role: 'Training Manager',
      company: 'Gulf Innovations',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'The automated attendance tracking and quiz generation are game-changers. We can now focus on mentoring rather than administrative tasks.',
    },
    {
      name: 'Amara Okafor',
      role: 'Talent Development Lead',
      company: 'AfriTech Solutions',
      country: 'Nigeria',
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'Finally, a platform that understands the needs of African tech companies. The evaluation system is robust and fair. Highly recommended!',
    },
    {
      name: 'James Mitchell',
      role: 'CTO',
      company: 'CloudScale Inc.',
      country: 'United States',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'We evaluated 5 different platforms before choosing TeamTrack. The AI capabilities and intuitive UI made it an easy choice. Our interns love it.',
    },
    {
      name: 'Priya Sharma',
      role: 'Operations Director',
      company: 'Infosphere India',
      country: 'India',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'The submission review workflow is incredibly smooth. Our admin team processes 3x more intern evaluations with the same headcount.',
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Head of Learning',
      company: 'SEA Digital',
      country: 'Malaysia',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
      rating: 5,
      text: 'Expert session scheduling used to be a nightmare. Now it is automated and interns never miss a session. The notification system is perfect.',
    },
  ];

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [isPaused, goNext]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction) => ({
      x: direction > 0 ? -400 : 400,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? -15 : 15,
    }),
  };

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-white via-[#f8f7f9] to-white">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#0080c8]/5 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[#92dce5]/10 rounded-full blur-[120px]"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0080c8]/5 border border-[#0080c8]/10 mb-8"
          >
            <Users className="w-4 h-4 text-[#0080c8]" />
            <span className="text-sm font-bold text-[#0080c8]">Trusted Worldwide</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#2b2d42] mb-6 tracking-tight"
          >
            What Our Users
            <span className="block mt-2 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent">
              Say
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-slate-500 leading-relaxed"
          >
            See how TeamTrack is transforming internship management across the globe.
          </motion.p>
        </motion.div>
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden py-4" style={{ perspective: '1200px' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {[0, 1, 2].map((offset) => {
                  const idx = (activeIndex + offset) % testimonials.length;
                  const t = testimonials[idx];
                  return (
                    <motion.div
                      key={`${activeIndex}-${idx}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: offset * 0.1, duration: 0.5 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 h-full group"
                    >
                      <motion.div
                        initial={{ rotate: -20, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + offset * 0.1 }}
                      >
                        <Quote className="w-10 h-10 text-[#0080c8]/15 mb-5" />
                      </motion.div>
                      <div className="flex gap-1 mb-5">
                        {[...Array(t.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3 + offset * 0.1 + i * 0.08, ...springBouncy }}
                          >
                            <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-slate-600 leading-relaxed mb-8 text-[15px]">{t.text}</p>
                      <div className="flex items-center gap-4 pt-5 border-t border-slate-100">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          transition={springBouncy}
                        >
                          <img
                            src={t.image}
                            alt={t.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#0080c8]/10 shadow-md"
                            loading="lazy"
                          />
                        </motion.div>
                        <div>
                          <div className="font-bold text-[#2b2d42] text-sm">{t.name}</div>
                          <div className="text-xs text-slate-400 font-medium">
                            {t.role} · {t.company}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3 text-slate-300" />
                            <span className="text-[11px] text-slate-300 font-medium">{t.country}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-center gap-4 mt-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goPrev}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:border-[#0080c8]/30 hover:shadow-lg transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </motion.button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative h-2.5 rounded-full transition-all duration-500"
                  style={{ width: index === activeIndex ? 32 : 10 }}
                >
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-500 ${
                      index === activeIndex
                        ? 'bg-gradient-to-r from-[#0080c8] to-[#00a8e8]'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goNext}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:border-[#0080c8]/30 hover:shadow-lg transition-all duration-300"
            >
              <ChevronRightIcon className="w-5 h-5 text-slate-600" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════
// 7. PRICING
// ═══════════════════════════════════════════════════

function PricingSection({ handleCTA }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [billingCycle, setBillingCycle] = useState('monthly');

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'Up to 5 interns',
      features: ['Up to 5 interns', '1 discipline', 'Basic task generation', 'Attendance tracking', 'Email support'],
      cta: 'Start Free',
      featured: false,
      icon: Rocket,
      gradient: 'from-slate-500 to-slate-400',
    },
    {
      name: 'Professional',
      price: billingCycle === 'monthly' ? '$49' : '$39',
      period: billingCycle === 'monthly' ? 'per month' : 'per month, billed annually',
      features: ['Up to 50 interns', 'Unlimited disciplines', 'AI task & quiz generation', 'Expert session scheduling', 'Advanced evaluations', 'Priority support'],
      cta: 'Start Trial',
      featured: true,
      icon: Award,
      gradient: 'from-[#0080c8] to-[#00a8e8]',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      features: ['Unlimited interns', 'Custom integrations', 'Dedicated support', 'Custom AI models', 'SLA guarantee', 'SSO & SAML'],
      cta: 'Contact Sales',
      featured: false,
      icon: Shield,
      gradient: 'from-violet-500 to-purple-400',
    },
  ];

  return (
    <section id="pricing" ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0080c8]/5 border border-[#0080c8]/10 mb-8"
          >
            <TrendingUp className="w-4 h-4 text-[#0080c8]" />
            <span className="text-sm font-bold text-[#0080c8]">Flexible Pricing</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#2b2d42] mb-6 tracking-tight"
          >
            Simple, Transparent
            <span className="block mt-2 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent">
              Pricing
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-slate-500 leading-relaxed mb-10"
          >
            Choose the plan that fits your organization&apos;s needs
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, ...springGentle }}
            className="inline-flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#2b2d42] shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-[#2b2d42] shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Yearly
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-2.5 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] rounded-full font-bold"
              >
                Save 20%
              </motion.span>
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start"
        >
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={scaleIn}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -12, scale: plan.featured ? 1.05 : 1.03 }}
                transition={springGentle}
                className={`relative rounded-3xl p-8 transition-all duration-500 h-full ${
                  plan.featured
                    ? 'bg-gradient-to-b from-[#0080c8] to-[#006ba8] text-white shadow-2xl shadow-[#0080c8]/30 scale-105 lg:scale-110 z-10'
                    : 'bg-white border-2 border-slate-100 hover:border-[#0080c8]/20 hover:shadow-2xl hover:shadow-slate-200/50'
                }`}
              >
                {plan.featured && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, ...springBouncy }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                  >
                    <div className="px-5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-black rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  </motion.div>
                )}
                <div className="text-center mb-8">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
                      plan.featured ? 'bg-white/20' : `bg-gradient-to-br ${plan.gradient} opacity-10`
                    }`}
                  >
                    <plan.icon className={`w-7 h-7 ${plan.featured ? 'text-white' : 'text-[#0080c8]'}`} strokeWidth={1.5} />
                  </motion.div>
                  <h3 className={`text-lg font-bold mb-2 ${plan.featured ? 'text-white' : 'text-[#2b2d42]'}`}>
                    {plan.name}
                  </h3>
                  <motion.div
                    key={plan.price}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`text-5xl font-black mb-2 ${plan.featured ? 'text-white' : 'text-[#2b2d42]'}`}
                  >
                    {plan.price}
                  </motion.div>
                  <p className={`text-sm font-medium ${plan.featured ? 'text-white/70' : 'text-slate-400'}`}>
                    {plan.period}
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.8 + index * 0.1 + i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.featured ? 'bg-white/20' : 'bg-green-50'
                        }`}
                      >
                        <Check className={`w-3 h-3 ${plan.featured ? 'text-white' : 'text-green-500'}`} strokeWidth={3} />
                      </motion.div>
                      <span className={`text-sm font-medium ${plan.featured ? 'text-white/90' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCTA}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    plan.featured
                      ? 'bg-white text-[#0080c8] shadow-lg hover:shadow-xl'
                      : 'bg-[#0080c8] text-white hover:bg-[#006ba8] shadow-lg shadow-[#0080c8]/20 hover:shadow-[#0080c8]/40'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// 8. FAQ
// ═══════════════════════════════════════════════════

function FAQSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does the AI task generation work?',
      answer: 'Simply upload your training plan PDF. Our AI engine parses the document, identifies key modules and learning objectives, then automatically generates structured daily tasks with corresponding quiz questions for each section.',
    },
    {
      question: 'Can I customize the evaluation criteria?',
      answer: "Yes! You can configure custom weightings for attendance, task completion, quiz scores, and expert feedback. You can also create custom evaluation rubrics tailored to your organization&apos;s needs.",
    },
    {
      question: 'Is there a limit on the number of interns?',
      answer: 'The Starter plan supports up to 5 interns. Professional supports up to 50, and Enterprise offers unlimited interns. You can upgrade or downgrade at any time.',
    },
    {
      question: 'How does the attendance tracking system work?',
      answer: 'Interns mark their attendance through a daily check-in window. The system automatically detects consecutive absences and sends smart warnings to both interns and administrators.',
    },
    {
      question: 'Can I integrate with my existing HR tools?',
      answer: 'Enterprise plans include custom integrations with popular HR platforms, LMS systems, and communication tools. Contact our sales team for specific integration requirements.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption (AES-256), SOC 2 Type II compliance, and regular security audits. Your data is stored in geographically redundant data centers.',
    },
  ];

  return (
    <section id="faq" ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-[#f8f7f9] via-white to-white">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0080c8]/5 border border-[#0080c8]/10 mb-8"
          >
            <MessageSquare className="w-4 h-4 text-[#0080c8]" />
            <span className="text-sm font-bold text-[#0080c8]">Got Questions?</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#2b2d42] mb-6 tracking-tight"
          >
            Frequently Asked
            <span className="block mt-2 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] bg-clip-text text-transparent">
              Questions
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-slate-500 leading-relaxed"
          >
            Everything you need to know about TeamTrack
          </motion.p>
        </motion.div>
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="space-y-3"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-[#0080c8]/15 transition-colors duration-300 shadow-sm hover:shadow-md"
            >
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left group"
              >
                <span className="font-bold text-[#2b2d42] group-hover:text-[#0080c8] transition-colors duration-300 pr-4 text-[15px]">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#0080c8]/10 flex items-center justify-center transition-colors duration-300"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#0080c8] transition-colors" />
                </motion.div>
              </motion.button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      className="px-6 pb-6 text-slate-500 leading-relaxed text-[15px]"
                    >
                      {faq.answer}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// 9. CTA SECTION
// ═══════════════════════════════════════════════════

function CTASection({ handleCTA, isAuthenticated }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 500], [0, 120]);

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0080c8] via-[#0070b0] to-[#006ba8]" />
      <motion.div style={{ y: yBg }} className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.02] rounded-full blur-[80px]"
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-20 left-[15%] w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center hidden lg:flex"
      >
        <Target className="w-8 h-8 text-white/60" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        className="absolute bottom-20 right-[15%] w-12 h-12 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center hidden lg:flex"
      >
        <Layers className="w-6 h-6 text-white/60" />
      </motion.div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, ...springBouncy }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 mb-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm font-bold text-white">Start Your Journey Today</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-6 tracking-tight"
          >
            Ready to Transform Your
            <span className="block mt-2 text-[#92dce5]">Internship Program?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-white/70 leading-relaxed mb-12 max-w-2xl mx-auto"
          >
            Join thousands of organizations already using TeamTrack to streamline their
            internship management.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group px-8 py-4 bg-white text-[#0080c8] font-bold text-base rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 flex items-center gap-2.5"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('#', '_blank')}
              className="group px-8 py-4 bg-white/10 text-white font-bold text-base rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2.5"
            >
              <Mail className="w-5 h-5" />
              Contact Sales
            </motion.button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-14 flex flex-wrap justify-center items-center gap-8 text-white/50 text-sm font-medium"
          >
            {[
              { icon: Shield, label: 'SOC 2 Compliant' },
              { icon: Lock, label: 'GDPR Ready' },
              { icon: Check, label: 'No Credit Card Required' },
            ].map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ scale: 1.05, color: 'rgba(255,255,255,0.8)' }}
                className="flex items-center gap-2 cursor-default"
              >
                <badge.icon className="w-4 h-4" />
                <span>{badge.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// 10. FOOTER
// ═══════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#0f111a] text-white relative overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-[#0080c8]/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center shadow-lg shadow-[#0080c8]/20"
              >
                <LayoutDashboard className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="text-xl font-bold tracking-tight">
                Intern<span className="text-[#0080c8]">Track</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
              Modern internship management platform powered by AI. Streamline collaboration, track
              progress, and hit every deadline effortlessly.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Globe, label: 'Website' },
                { icon: Mail, label: 'Email' },
                { icon: Phone, label: 'Phone' },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href="#"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#0080c8]/20 hover:border-[#0080c8]/30 transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-slate-500 group-hover:text-[#0080c8] transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Integrations'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Resources', links: ['Documentation', 'API Reference', 'Guides', 'Community'] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-slate-500 hover:text-white text-sm transition-colors duration-300 inline-block"
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm">&copy; 2026 TeamTrack. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
              <a key={link} href="#" className="text-slate-600 hover:text-white text-sm transition-colors duration-300">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════
// 11. MAIN LANDING COMPONENT
// ═══════════════════════════════════════════════════

export function Landing() {
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const scaleX = useScrollProgress();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate(profile?.role === 'admin' ? '/admin' : '/intern');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f9] font-sans antialiased">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0080c8] to-[#00a8e8] z-[60] origin-left"
        style={{ scaleX }}
      />

      <HeroSection handleCTA={handleCTA} isAuthenticated={isAuthenticated} />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection handleCTA={handleCTA} />
      <FAQSection />
      <CTASection handleCTA={handleCTA} isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
