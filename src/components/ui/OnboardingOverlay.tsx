'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Trophy, Target, Zap, Users } from 'lucide-react'

const STEPS = [
  {
    icon: <Trophy size={40} className="text-yellow-400" />,
    title: 'Boys For Goals',
    body: 'Predict the score of every World Cup 2026 match and outsmart your friends.',
  },
  {
    icon: <Target size={40} className="text-yellow-400" />,
    title: 'How scoring works',
    body: '🎯 Exact score → 10 pts\n✅ Right result + goal diff → 7 pts\n✓ Right result → 3 pts\n✗ Wrong → 0 pts',
  },
  {
    icon: <Zap size={40} className="text-yellow-400" />,
    title: 'Place your bets',
    body: 'Tap any match to predict the score. Bets lock at kickoff — no sneaky edits after the whistle!',
  },
  {
    icon: <Users size={40} className="text-yellow-400" />,
    title: 'Your crew',
    body: 'Everyone can join — tap "Add a new player" on the login screen to bring someone in.',
  },
]

const STORAGE_KEY = 'bfg_onboarding_done'

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  const current = STEPS[step]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            {/* Step content */}
            <div className="px-6 pt-8 pb-6 min-h-[240px] flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-4">{current.icon}</div>
                  <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {current.title}
                  </h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 pb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    backgroundColor: i === step ? '#FFD60A' : 'var(--border)',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 flex gap-3">
              <button
                onClick={finish}
                className="py-3 px-4 rounded-2xl text-sm font-medium"
                style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-card-2)' }}
              >
                Skip
              </button>
              <button
                onClick={next}
                className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1 transition-all active:scale-97"
                style={{ backgroundColor: '#FFD60A', color: '#0D0D0F' }}
              >
                {step < STEPS.length - 1 ? (
                  <><span>Next</span><ChevronRight size={16} /></>
                ) : (
                  "Let's go! ⚽"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
