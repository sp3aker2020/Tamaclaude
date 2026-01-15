import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Pet } from './components/Pet'
import { PetStats } from './components/PetStats'
import { ActionButtons } from './components/ActionButtons'
import { WalletButton } from './components/WalletButton'
import { ScoreDisplay } from './components/ScoreDisplay'
import { GameOver } from './components/GameOver'
import { usePetState } from './hooks/usePetState'
import { getWalletHistory } from './api/client'

function Particles() {
  return (
    <div className="particles">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  )
}

function ClaimPetScreen({ onClaim, walletStats }) {
  return (
    <div className="claim-screen">
      <div className="claim-card glass-card">
        <h2>🐣 Welcome to Tamaclaude!</h2>

        {walletStats && walletStats.totalPets > 0 ? (
          <div className="returning-user">
            <p>Welcome back! You've raised <strong>{walletStats.totalPets}</strong> pets.</p>
            <p>Your best score: <strong>{walletStats.highScore?.toLocaleString() || 0}</strong></p>
          </div>
        ) : (
          <div className="new-user">
            <p>Your wallet is connected! Ready to adopt your first pet?</p>
          </div>
        )}

        <div className="claim-pet-preview">
          <img src="/src/assets/pet-sprites.png" alt="Your future pet" className="claim-pet-image" />
        </div>

        <button className="claim-btn" onClick={onClaim}>
          {walletStats && walletStats.totalPets > 0 ? '🎮 Start New Pet' : '🐣 Claim Your Pet'}
        </button>

        <p className="claim-info">
          Keep your pet alive by feeding, playing, and letting it rest!
        </p>
      </div>
    </div>
  )
}

function ConnectWalletScreen() {
  return (
    <div className="connect-screen">
      <div className="connect-card glass-card">
        <h1 className="connect-title">🎮 Tamaclaude</h1>
        <p className="connect-subtitle">Your Solana-powered virtual pet</p>

        <div className="connect-pet-preview">
          <img src="/src/assets/pet-sprites.png" alt="Tamaclaude pet" className="connect-pet-image" />
        </div>

        <p className="connect-info">Connect your Solana wallet to start playing!</p>

        <WalletButton />

        <div className="connect-features">
          <div className="feature">🐾 Raise a virtual pet</div>
          <div className="feature">🏆 Compete on leaderboards</div>
          <div className="feature">💾 Progress saved to your wallet</div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() || null

  const [hasClaimed, setHasClaimed] = useState(false)
  const [walletStats, setWalletStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const {
    stats, action, message, mood, cooldowns,
    isAlive, score, highScores,
    feed, play, sleep, restartGame
  } = usePetState(walletAddress)

  // Check if user has existing pet history when wallet connects
  useEffect(() => {
    if (connected && walletAddress) {
      setLoading(true)
      getWalletHistory(walletAddress)
        .then(data => {
          setWalletStats(data.stats)
          // Auto-claim if they've played before or if pet is currently alive
          const hasPlayedBefore = data.stats && data.stats.totalPets > 0
          const petIsAlive = localStorage.getItem('tamaclaude-alive') !== 'false'
          setHasClaimed(hasPlayedBefore || petIsAlive)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setHasClaimed(false)
      setWalletStats(null)
      setLoading(false)
    }
  }, [connected, walletAddress])

  const handleClaim = () => {
    restartGame()
    setHasClaimed(true)
  }

  const handleRestart = () => {
    setHasClaimed(false)
  }

  // Not connected - show connect screen
  if (!connected) {
    return (
      <>
        <Particles />
        <div className="app-container">
          <ConnectWalletScreen />
        </div>
      </>
    )
  }

  // Loading wallet data
  if (loading) {
    return (
      <>
        <Particles />
        <div className="app-container">
          <div className="loading-screen glass-card">
            <p>Loading your pet data...</p>
          </div>
        </div>
      </>
    )
  }

  // Connected but hasn't claimed pet
  if (!hasClaimed) {
    return (
      <>
        <Particles />
        <div className="app-container">
          <ClaimPetScreen onClaim={handleClaim} walletStats={walletStats} />
        </div>
      </>
    )
  }

  // Main game
  return (
    <>
      <Particles />
      <div className="app-container">
        <header className="header">
          <h1>Tamaclaude</h1>
          <p>Your Solana-powered virtual pet</p>
        </header>

        <div className="game-container">
          <ScoreDisplay score={score} />
          <Pet action={action} message={message} mood={mood} isAlive={isAlive} />
          <PetStats stats={stats} />
          <ActionButtons
            onFeed={feed}
            onPlay={play}
            onSleep={sleep}
            disabled={!isAlive}
            cooldowns={cooldowns}
          />
        </div>

        <WalletButton />
      </div>

      {!isAlive && (
        <GameOver
          score={score}
          highScores={highScores}
          onRestart={handleRestart}
          walletStats={walletStats}
        />
      )}
    </>
  )
}

export default App
