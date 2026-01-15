import { useState, useEffect, useCallback, useRef } from 'react'
import { saveScore } from '../api/client'

const INITIAL_STATS = {
    hunger: 80,
    happiness: 70,
    energy: 90
}

// Decay rates - stats drop over time
const DECAY_RATE = {
    hunger: 0.5,
    happiness: 0.3,
    energy: 0.2
}

const DECAY_INTERVAL = 3000 // 3 seconds

// All cooldowns are 5 minutes (300 seconds)
const COOLDOWNS = {
    feed: 300000,
    play: 300000,
    sleep: 300000
}

// Action effects
const ACTION_EFFECTS = {
    feed: { hunger: 25 },
    play: { happiness: 20, energy: -15 },
    sleep: { energy: 30, happiness: 5 }
}

// Helper to get wallet-specific localStorage key
const getStorageKey = (walletAddress, key) => {
    if (!walletAddress) return null
    return `tamaclaude-${walletAddress.slice(0, 8)}-${key}`
}

// Helper to read from localStorage
const readStorage = (walletAddress, key, defaultValue) => {
    const storageKey = getStorageKey(walletAddress, key)
    if (!storageKey) return defaultValue

    const saved = localStorage.getItem(storageKey)
    if (saved) {
        try {
            return JSON.parse(saved)
        } catch {
            return defaultValue
        }
    }
    return defaultValue
}

// Helper to write to localStorage
const writeStorage = (walletAddress, key, value) => {
    const storageKey = getStorageKey(walletAddress, key)
    if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(value))
    }
}

export function usePetState(walletAddress = null) {
    // Track the previous wallet to detect changes
    const prevWalletRef = useRef(walletAddress)

    const [stats, setStats] = useState(INITIAL_STATS)
    const [isAlive, setIsAlive] = useState(true)
    const [score, setScore] = useState({ actionsCompleted: 0, startTime: Date.now(), deathTime: null })
    const [highScores, setHighScores] = useState([])
    const [cooldowns, setCooldowns] = useState({ feed: 0, play: 0, sleep: 0 })
    const [action, setAction] = useState(null)
    const [message, setMessage] = useState(null)
    const [, forceUpdate] = useState(0)

    // Load state when wallet changes
    useEffect(() => {
        if (walletAddress && walletAddress !== prevWalletRef.current) {
            // Wallet changed - load new wallet's data
            setStats(readStorage(walletAddress, 'stats', INITIAL_STATS))
            setIsAlive(readStorage(walletAddress, 'alive', true))
            setScore(readStorage(walletAddress, 'score', { actionsCompleted: 0, startTime: Date.now(), deathTime: null }))
            setHighScores(readStorage(walletAddress, 'highscores', []))
            setCooldowns(readStorage(walletAddress, 'cooldowns', { feed: 0, play: 0, sleep: 0 }))
            setAction(null)
            setMessage(null)
        } else if (!walletAddress && prevWalletRef.current) {
            // Wallet disconnected - reset to defaults
            setStats(INITIAL_STATS)
            setIsAlive(true)
            setScore({ actionsCompleted: 0, startTime: Date.now(), deathTime: null })
            setHighScores([])
            setCooldowns({ feed: 0, play: 0, sleep: 0 })
        }

        prevWalletRef.current = walletAddress
    }, [walletAddress])

    // Save states to localStorage (wallet-specific)
    useEffect(() => {
        writeStorage(walletAddress, 'stats', stats)
    }, [walletAddress, stats])

    useEffect(() => {
        writeStorage(walletAddress, 'alive', isAlive)
    }, [walletAddress, isAlive])

    useEffect(() => {
        writeStorage(walletAddress, 'score', score)
    }, [walletAddress, score])

    useEffect(() => {
        writeStorage(walletAddress, 'highscores', highScores)
    }, [walletAddress, highScores])

    useEffect(() => {
        writeStorage(walletAddress, 'cooldowns', cooldowns)
    }, [walletAddress, cooldowns])

    // Check for death condition
    useEffect(() => {
        if (isAlive && (stats.hunger <= 0 || stats.happiness <= 0 || stats.energy <= 0)) {
            handleDeath()
        }
    }, [stats, isAlive])

    // Handle pet death
    const handleDeath = useCallback(async () => {
        const deathTime = Date.now()
        const timeAlive = deathTime - score.startTime
        const finalScore = calculateFinalScore(timeAlive, score.actionsCompleted)
        const causeOfDeath = stats.hunger <= 0 ? 'starvation' : stats.happiness <= 0 ? 'sadness' : 'exhaustion'

        // Save to high scores locally
        const newHighScore = {
            score: finalScore,
            timeAlive,
            actionsCompleted: score.actionsCompleted,
            date: new Date().toISOString(),
            causeOfDeath
        }

        // Freeze the time by saving death time
        setScore(prev => ({
            ...prev,
            deathTime
        }))

        setHighScores(prev => {
            const updated = [...prev, newHighScore]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
            return updated
        })

        // Save to API if wallet is connected
        if (walletAddress) {
            try {
                await saveScore({
                    walletAddress,
                    score: finalScore,
                    timeAliveMs: timeAlive,
                    actionsCompleted: score.actionsCompleted,
                    causeOfDeath
                })
                console.log('Score saved to API')
            } catch (error) {
                console.error('Failed to save score to API:', error)
            }
        }

        setIsAlive(false)
        setMessage('💀 Game Over!')
    }, [score, stats, walletAddress])

    // Calculate final score: 1 point per second alive + 100 points per action
    const calculateFinalScore = (timeAlive, actions) => {
        const secondsAlive = Math.floor(timeAlive / 1000)
        return secondsAlive + (actions * 100)
    }

    // Get current score
    const getCurrentScore = useCallback(() => {
        const endTime = score.deathTime || Date.now()
        const timeAlive = endTime - score.startTime
        return calculateFinalScore(timeAlive, score.actionsCompleted)
    }, [score])

    // Get time alive formatted
    const getTimeAlive = useCallback(() => {
        const endTime = score.deathTime || Date.now()
        const timeAlive = endTime - score.startTime
        const seconds = Math.floor(timeAlive / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        }
        return `${seconds}s`
    }, [score.startTime, score.deathTime])

    // Restart game
    const restartGame = useCallback(() => {
        setStats(INITIAL_STATS)
        setScore({ actionsCompleted: 0, startTime: Date.now(), deathTime: null })
        setCooldowns({ feed: 0, play: 0, sleep: 0 })
        setIsAlive(true)
        setMessage('🐣 New pet!')
    }, [])

    // Decay stats over time (only if alive)
    useEffect(() => {
        if (!isAlive || !walletAddress) return

        const interval = setInterval(() => {
            setStats(prev => ({
                hunger: Math.max(0, prev.hunger - DECAY_RATE.hunger),
                happiness: Math.max(0, prev.happiness - DECAY_RATE.happiness),
                energy: Math.max(0, prev.energy - DECAY_RATE.energy)
            }))
        }, DECAY_INTERVAL)

        return () => clearInterval(interval)
    }, [isAlive, walletAddress])

    // Update display every second
    useEffect(() => {
        const interval = setInterval(() => {
            forceUpdate(n => n + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Clear action after animation
    useEffect(() => {
        if (action) {
            const timeout = setTimeout(() => setAction(null), 1500)
            return () => clearTimeout(timeout)
        }
    }, [action])

    // Clear message after display
    useEffect(() => {
        if (message) {
            const timeout = setTimeout(() => setMessage(null), 2500)
            return () => clearTimeout(timeout)
        }
    }, [message])

    // Check if action is on cooldown
    const isOnCooldown = useCallback((actionType) => {
        return Date.now() < cooldowns[actionType]
    }, [cooldowns])

    // Get remaining cooldown time in seconds
    const getCooldownRemaining = useCallback((actionType) => {
        const remaining = cooldowns[actionType] - Date.now()
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0
    }, [cooldowns])

    // Format cooldown as mm:ss
    const formatCooldown = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Set cooldown for an action
    const startCooldown = useCallback((actionType) => {
        setCooldowns(prev => ({
            ...prev,
            [actionType]: Date.now() + COOLDOWNS[actionType]
        }))
    }, [])

    // Increment action counter
    const incrementActions = useCallback(() => {
        setScore(prev => ({
            ...prev,
            actionsCompleted: prev.actionsCompleted + 1
        }))
    }, [])

    const feed = useCallback(() => {
        if (!isAlive || !walletAddress) return

        if (isOnCooldown('feed')) {
            setMessage(`Wait ${formatCooldown(getCooldownRemaining('feed'))}! 🍔`)
            return
        }

        if (stats.hunger > 95) {
            setMessage("I'm full! 🫃")
            return
        }

        setStats(prev => ({
            ...prev,
            hunger: Math.min(100, prev.hunger + ACTION_EFFECTS.feed.hunger)
        }))
        setAction('eating')
        setMessage('Yummy! 🍔')
        startCooldown('feed')
        incrementActions()
    }, [isAlive, walletAddress, stats.hunger, isOnCooldown, getCooldownRemaining, startCooldown, incrementActions])

    const play = useCallback(() => {
        if (!isAlive || !walletAddress) return

        if (isOnCooldown('play')) {
            setMessage(`Wait ${formatCooldown(getCooldownRemaining('play'))}! 🎮`)
            return
        }

        if (stats.energy < 15) {
            setMessage('Too tired... 😴')
            return
        }

        if (stats.happiness > 95) {
            setMessage("So happy! 💖")
            return
        }

        setStats(prev => ({
            ...prev,
            happiness: Math.min(100, prev.happiness + ACTION_EFFECTS.play.happiness),
            energy: Math.max(0, prev.energy + ACTION_EFFECTS.play.energy)
        }))
        setAction('playing')
        setMessage('Wheee! ✨')
        startCooldown('play')
        incrementActions()
    }, [isAlive, walletAddress, stats.energy, stats.happiness, isOnCooldown, getCooldownRemaining, startCooldown, incrementActions])

    const sleep = useCallback(() => {
        if (!isAlive || !walletAddress) return

        if (isOnCooldown('sleep')) {
            setMessage(`Wait ${formatCooldown(getCooldownRemaining('sleep'))}! 💤`)
            return
        }

        if (stats.energy > 95) {
            setMessage("Not sleepy! 😊")
            return
        }

        setStats(prev => ({
            ...prev,
            energy: Math.min(100, prev.energy + ACTION_EFFECTS.sleep.energy),
            happiness: Math.min(100, prev.happiness + ACTION_EFFECTS.sleep.happiness)
        }))
        setAction('sleeping')
        setMessage('Zzz... 💤')
        startCooldown('sleep')
        incrementActions()
    }, [isAlive, walletAddress, stats.energy, isOnCooldown, getCooldownRemaining, startCooldown, incrementActions])

    const getMood = useCallback(() => {
        if (!isAlive) return 'dead'
        const avg = (stats.hunger + stats.happiness + stats.energy) / 3
        if (avg > 70) return 'happy'
        if (avg > 40) return 'neutral'
        return 'sad'
    }, [stats, isAlive])

    return {
        stats,
        action,
        message,
        mood: getMood(),
        isAlive,
        score: {
            current: getCurrentScore(),
            actionsCompleted: score.actionsCompleted,
            timeAlive: getTimeAlive()
        },
        highScores,
        cooldowns: {
            feed: getCooldownRemaining('feed'),
            play: getCooldownRemaining('play'),
            sleep: getCooldownRemaining('sleep')
        },
        feed,
        play,
        sleep,
        restartGame
    }
}
