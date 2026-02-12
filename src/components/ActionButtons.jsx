export function ActionButtons({ onFeed, onPlay, onSleep, onBattle, disabled, cooldowns }) {
    const formatCooldown = (seconds) => {
        if (seconds <= 0) return null
        return `${seconds}s`
    }

    return (
        <div className="actions-container">
            <button
                className={`action-btn feed ${cooldowns.feed > 0 ? 'on-cooldown' : ''}`}
                onClick={onFeed}
                disabled={disabled}
            >
                <span className="icon">🍔</span>
                <span className="label">Feed</span>
                {cooldowns.feed > 0 && (
                    <span className="cooldown-timer">{formatCooldown(cooldowns.feed)}</span>
                )}
            </button>

            <button
                className={`action-btn play ${cooldowns.play > 0 ? 'on-cooldown' : ''}`}
                onClick={onPlay}
                disabled={disabled}
            >
                <span className="icon">🎮</span>
                <span className="label">Play</span>
                {cooldowns.play > 0 && (
                    <span className="cooldown-timer">{formatCooldown(cooldowns.play)}</span>
                )}
            </button>

            <button
                className={`action-btn sleep ${cooldowns.sleep > 0 ? 'on-cooldown' : ''}`}
                onClick={onSleep}
                disabled={disabled}
            >
                <span className="icon">💤</span>
                <span className="label">Sleep</span>
                {cooldowns.sleep > 0 && (
                    <span className="cooldown-timer">{formatCooldown(cooldowns.sleep)}</span>
                )}
            </button>
            <button
                className={`action-btn battle`}
                onClick={onBattle}
                disabled={disabled}
            >
                <span className="icon">⚔️</span>
                <span className="label">Battle</span>
            </button>
        </div>
    )
}
