export function GameOver({ score, highScores, onRestart, walletStats }) {
    const causeMessages = {
        starvation: '💀 Died of starvation!',
        sadness: '💔 Died of sadness!',
        exhaustion: '😵 Died of exhaustion!'
    }

    const latestScore = highScores[0]
    const isNewHighScore = walletStats?.highScore && score.current > walletStats.highScore

    return (
        <div className="game-over-overlay">
            <div className="game-over-modal glass-card">
                <h2 className="game-over-title">Game Over</h2>

                {latestScore && (
                    <p className="death-cause">
                        {causeMessages[latestScore.causeOfDeath] || '💀 Your pet has died!'}
                    </p>
                )}

                <div className="final-score">
                    <div className="final-score-label">Final Score</div>
                    <div className="final-score-value">
                        {score.current.toLocaleString()}
                        {isNewHighScore && <span className="new-high-score">🏆 NEW PERSONAL BEST!</span>}
                    </div>
                </div>

                <div className="score-breakdown">
                    <div className="breakdown-item">
                        <span>⏱️ Time Alive</span>
                        <span>{score.timeAlive}</span>
                    </div>
                    <div className="breakdown-item">
                        <span>⭐ Actions</span>
                        <span>{score.actionsCompleted}</span>
                    </div>
                </div>

                {walletStats && walletStats.totalPets > 0 && (
                    <div className="wallet-stats-summary">
                        <p>Total pets raised: <strong>{walletStats.totalPets + 1}</strong></p>
                        <p>Best score: <strong>{Math.max(walletStats.highScore || 0, score.current).toLocaleString()}</strong></p>
                    </div>
                )}

                {highScores.length > 0 && (
                    <div className="high-scores">
                        <h3>🏆 Your Recent Runs</h3>
                        <div className="high-scores-list">
                            {highScores.slice(0, 5).map((hs, i) => (
                                <div key={i} className={`high-score-row ${i === 0 ? 'top-score' : ''}`}>
                                    <span className="rank">#{i + 1}</span>
                                    <span className="hs-score">{hs.score.toLocaleString()}</span>
                                    <span className="hs-actions">{hs.actionsCompleted} actions</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button className="restart-btn" onClick={onRestart}>
                    🐣 Adopt New Pet
                </button>
            </div>
        </div>
    )
}
