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
import { PET_TYPES, PET_LIST } from './data/petTypes'

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

function ClaimPetScreen({ onClaim, walletStats, petHistory }) {
  const [selectedPet, setSelectedPet] = useState(PET_LIST[0].id)

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const causeEmoji = {
    starvation: '🍔',
    sadness: '💔',
    exhaustion: '😴'
  }

  const currentPet = PET_TYPES[selectedPet]

  return (
    <div className="claim-screen">
      <div className="claim-card glass-card">
        <h2>🐣 Welcome to PokeClawd!</h2>

        {walletStats && walletStats.totalPets > 0 ? (
          <div className="returning-user">
            <p>Welcome back! You've raised <strong>{walletStats.totalPets}</strong> pets.</p>
            <p>Your best score: <strong>{walletStats.highScore?.toLocaleString() || 0}</strong></p>
          </div>
        ) : (
          <div className="new-user">
            <p>Your wallet is connected! Choose your PokeClawd:</p>
          </div>
        )}

        <div className="pet-selector">
          <h3>⚡ Choose Your PokeClawd</h3>
          <div className="pet-options">
            {PET_LIST.map(pet => (
              <div
                key={pet.id}
                className={`pet-option ${selectedPet === pet.id ? 'selected' : ''}`}
                onClick={() => setSelectedPet(pet.id)}
              >
                <img src={pet.sprites.idle} alt={pet.name} className="pet-option-img" />
                <div className="pet-option-info">
                  <span className="pet-option-name">{pet.name}</span>
                  <span className="pet-option-type">{pet.type}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="pet-description">{currentPet.description}</p>
        </div>

        <button className="claim-btn" onClick={() => onClaim(selectedPet)}>
          {walletStats && walletStats.totalPets > 0 ? '🎮 Start New Pet' : '🐣 Catch This PokeClawd!'}
        </button>

        {petHistory && petHistory.length > 0 && (
          <div className="pet-history">
            <h3>📜 Your Pet History</h3>
            <div className="history-list">
              {petHistory.slice(0, 5).map((pet, i) => (
                <div key={i} className="history-item">
                  <span className="history-cause">{causeEmoji[pet.causeOfDeath] || '💀'}</span>
                  <span className="history-score">{pet.score?.toLocaleString()}</span>
                  <span className="history-time">{formatTime(pet.timeAliveMs)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="claim-info">
          Keep your PokeClawd alive by feeding, playing, and letting it rest!
        </p>
      </div>
    </div>
  )
}

function ConnectWalletScreen() {
  // Show Pikaclaw as the default preview
  const previewPet = PET_LIST[0]

  return (
    <div className="connect-screen">
      <div className="connect-card glass-card">
        <h1 className="connect-title">⚡ PokeClawd</h1>
        <p className="connect-subtitle">Open Claw Powered Pets</p>

        <div className="connect-pet-showcase">
          {PET_LIST.slice(0, 2).map(pet => (
            <div key={pet.id} className="connect-pet-item">
              <img src={pet.sprites.idle} alt={pet.name} className="connect-pet-image" />
              <span className="connect-pet-name">{pet.name}</span>
            </div>
          ))}
        </div>

        <p className="connect-info">Connect your wallet to choose your companion!</p>

        <WalletButton />

        <div className="connect-features">
          <div className="feature">⚡ Raise your own PokeClawd</div>
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
  const [petHistory, setPetHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPetType, setSelectedPetType] = useState(null)

  const {
    stats, action, message, mood, cooldowns,
    isAlive, score, highScores,
    feed, play, sleep, restartGame,
    setCustomMessage
  } = usePetState(walletAddress, selectedPetType)

  // Load selected pet type from localStorage
  useEffect(() => {
    if (walletAddress) {
      const storageKey = `tamaclaude-${walletAddress.slice(0, 8)}-petType`
      const saved = localStorage.getItem(storageKey)
      if (saved && PET_TYPES[saved]) {
        setSelectedPetType(PET_TYPES[saved])
      }
    }
  }, [walletAddress])

  // Check if user has existing pet history when wallet connects
  useEffect(() => {
    if (connected && walletAddress) {
      setLoading(true)
      getWalletHistory(walletAddress)
        .then(data => {
          setWalletStats(data.stats)
          setPetHistory(data.history || [])
          const storageKey = `tamaclaude-${walletAddress.slice(0, 8)}-alive`
          const petIsAlive = localStorage.getItem(storageKey) !== 'false' && localStorage.getItem(storageKey) !== null
          const isClaimed = petIsAlive && localStorage.getItem(storageKey) === 'true'
          setHasClaimed(isClaimed)

          // Legacy migration: If claimed but no pet type, default to Pikaclaw
          if (isClaimed) {
            const typeKey = `tamaclaude-${walletAddress.slice(0, 8)}-petType`
            if (!localStorage.getItem(typeKey)) {
              localStorage.setItem(typeKey, 'pikaclaw')
              setSelectedPetType(PET_TYPES.pikaclaw)
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setHasClaimed(false)
      setWalletStats(null)
      setPetHistory([])
      setSelectedPetType(null)
      setLoading(false)
    }
  }, [connected, walletAddress])

  const handleClaim = (petTypeId) => {
    const petType = PET_TYPES[petTypeId]
    setSelectedPetType(petType)
    // Save selection to localStorage
    if (walletAddress) {
      const storageKey = `tamaclaude-${walletAddress.slice(0, 8)}-petType`
      localStorage.setItem(storageKey, petTypeId)
    }
    restartGame()
    setHasClaimed(true)
  }

  const handleRestart = () => {
    setHasClaimed(false)
  }

  const handleBattle = () => {
    setCustomMessage("PvP Battle Arena coming soon! ⚔️")
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
          <ClaimPetScreen onClaim={handleClaim} walletStats={walletStats} petHistory={petHistory} />
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
          <h1>PokeClawd</h1>
          <p>Open Claw Powered Pets</p>
        </header>

        <div className="game-container">
          <ScoreDisplay score={score} />
          <Pet action={action} message={message} mood={mood} isAlive={isAlive} petType={selectedPetType} />
          <PetStats stats={stats} />
          <ActionButtons
            onFeed={feed}
            onPlay={play}
            onSleep={sleep}
            onBattle={handleBattle}
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
