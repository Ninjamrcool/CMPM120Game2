// Assets:
// https://kenney.nl/assets/board-game-icons
// https://kenney.nl/assets/top-down-shooter
// https://kenney.nl/assets/pico-8-city
//
// https://pixabay.com/music/video-games-the-return-of-the-8-bit-era-301292/
// https://pixabay.com/sound-effects/film-special-effects-8-bit-game-over-sound-effect-331435/
// https://pixabay.com/sound-effects/film-special-effects-fist-fight-192117/
// https://pixabay.com/sound-effects/film-special-effects-gunner-sound-43794/

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 800,
    height: 600,
    scene: [GameScene]
}


const game = new Phaser.Game(config);