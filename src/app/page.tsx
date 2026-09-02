"use client";

import React, { useState, useEffect } from "react";
import { StarBackground } from "@/components/StarBackground";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { GlassPanel } from "@/components/GlassPanel";
import { AIChatView } from "@/components/AIChatView";
import { CoordinatorChatView } from "@/components/CoordinatorChatView";
import { HumanChatView } from "@/components/HumanChatView";
import { AboutView } from "@/components/AboutView";
import { SafetyView } from "@/components/SafetyView";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ProfileModal } from "@/components/ProfileModal";
import { SessionUser } from "@/types";

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("ai");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // 1. Fetch current user state
  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);

        // Check if onboarding/consent is required
        if (!data.user || !data.user.hasAcceptedConsents) {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      setShowOnboarding(true);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleOnboardingComplete = (consents: string[]) => {
    setShowOnboarding(false);
    if (user) {
      setUser({ ...user, hasAcceptedConsents: true });
    }
  };

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-[#091024] text-blue-100 font-sans">
      {/* Dynamic Starry Night Sky Background */}
      <StarBackground />

      {/* Onboarding / Consent Flow (Multi-step) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdated={(u) => setUser(u)}
        onLogout={handleLogout}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onOpenProfile={() => setShowProfile(true)}
        onLogout={handleLogout}
        isOpenMobile={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-2 md:p-4 z-10">
        {/* Top Header Bar */}
        <Header
          user={user}
          onOpenProfile={() => setShowProfile(true)}
          onToggleMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Main Central Rounded Glassmorphism Panel (matches reference image) */}
        <div className="flex-1 flex overflow-hidden my-1">
          <GlassPanel
            className="flex-1 flex flex-col h-full w-full p-3 md:p-6 rounded-3xl bg-[#111f3f]/50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {activeTab === "ai" && (
              <AIChatView onRequestHuman={() => setActiveTab("coordinator")} />
            )}

            {activeTab === "coordinator" && (
              <CoordinatorChatView user={user} />
            )}

            {activeTab === "human" && (
              <HumanChatView user={user} />
            )}

            {activeTab === "about" && <AboutView />}

            {activeTab === "safety" && <SafetyView />}
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}