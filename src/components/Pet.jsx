import { useMemo } from 'react'
import petSprites from '../assets/pet-sprites.png'
import actionFeed from '../assets/action-feed.png'
import actionPlay from '../assets/action-play.png'
import actionSleep from '../assets/action-sleep.png'

// Individual action images
const ACTION_IMAGES = {
    eating: actionFeed,
    playing: actionPlay,
    sleeping: actionSleep
}

// Sprite positions for the main sprite sheet (idle states)
const SPRITE_POSITIONS = {
    idle: { row: 0, col: 0 },
    sad: { row: 1, col: 1 }
}

export function Pet({ action, message, mood, isAlive = true }) {
    // Check if we should use a separate action image
    const useActionImage = action && ACTION_IMAGES[action]

    const currentSprite = useMemo(() => {
        if (!isAlive) return 'sad'
        return 'idle'
    }, [isAlive])

    const position = SPRITE_POSITIONS[currentSprite] || SPRITE_POSITIONS.idle
    const bgPosition = `${-position.col * 50}% ${-position.row * 50}%`

    return (
        <div className="pet-container">
            {message && (
                <div className="pet-message">{message}</div>
            )}

            {useActionImage ? (
                // Show dedicated action image
                <img
                    src={ACTION_IMAGES[action]}
                    alt={action}
                    className={`pet-sprite action-sprite ${action} ${!isAlive ? 'dead' : ''}`}
                />
            ) : (
                // Show sprite sheet for idle/dead states
                <div
                    className={`pet-sprite ${!isAlive ? 'dead' : ''}`}
                    style={{
                        backgroundImage: `url(${petSprites})`,
                        backgroundSize: '200% 200%',
                        backgroundPosition: bgPosition,
                        backgroundRepeat: 'no-repeat'
                    }}
                    title={`Mood: ${mood}`}
                />
            )}
        </div>
    )
}
