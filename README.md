#Flappy Bird  (Enhanced Cavas Edition)

An enhanced Flappy Bird-style game built with vanlla HTML5 Canvas, CSS,and JavaScript. No frameworks and no build step.

This project includes a shop + consumable power-ups , rockets, a ortal/ space-world mode, sound effects/music, and responsive (mobile-friendly) UI.

## controls

Desktop:
- Space: flap / start
- P or Esc: pause / resume
- Q: power boost
-E: shield
-G: anti-rocket(gravity)
-W/Up: move down(space world)

Mobile:
- Tap the canvas to flap
- Tap the power icons on the left to use powers
- Tap the pause button (top-right) to pause/resume

## How to play

1. Open the game and press **Start**.
2. On the **Get Ready** screen, tap once to begin.
3. Keeo the bird in the air and fly through the gaps between ppes.
4. Every pipe you pass increases your score.
5. If you hit a pipe or the ground (without protection), the game ends and you go to the Game Over screen.

## Goal

-Get the highest score possible.
-Collect coins and use them in the shop to buy power-up charges.

## Game content(what's inside)
- **Pipes ( main obstacle):** fly through gap to score.
- **Score + Best score:** shown with sprite numbers.
- **Coins (currency):** shown on the start screen and in-game ; use in the Shop.
-**Shop:** buy consumable power-up quantities (charges).
- **Power buttons (in-game):** use the powers you purchased.
- **Rockets (enemy waves):** additional hazards during gameplay.
- **Anti-rocket gravity power:** drops rockets down when used.
- **Portal + Space World:** portal events can move you into a space world mod where you can collect coins.
- **Medals:** shown on the Game over scoreboard based on your score.
- **Pause button:** pause/resume during gameplay.

## Power-ups

- **Power boost:** temporary invincibility + fastr gameply.
- **Shield:** absorbs multiple hits (limited health) before breaking.
- **Anti-rocket(gravity):** pulls rockets down (cooldown-based).

## Shop and coins

- You earn coins while playing.
- Shop items ar **consumables**: each purchase increases your quantity by 1.
- Using a power decreases its quantity by 1.

## Tips


- Tap in a steady rhythm instead of spamming.
- Save power-ups   for difficult sections.
- If rockets appear, be ready to use the gravity pwer.
- Playing on mobile works best in full-screen with stable orientation.

## Main features

-Classic pipe-dodging gameplay with score + best score
- Shop + coin economy (consumable quantities)
- Power boost (temporary invincibility + speed)
- Shield (absorbs multiple hits)
- Rockets + antirocket gravity power
- Portal system with a space-world coin collection mode
-Sound effects + background music
-Pixel-art rendering (no smoothing)
- Responsive layout for desktop and mobile screens

## Screen

- Start screen: title + Start + shop
- Get Ready screen: instructions before play
- In-game HUD: score, coins , pause,power buttions
- Game Over screen : scoreboard + OK (restart)
- Shop screen: buy power-up quantities using coins


## Project structure

```text
FLAPPY-BIRD/
 index.html
 features.html
 README.md
 assests/
   favicon.ico
   images/
   sounds/
 css/
   style.cs
   features.css
 js/
   game.js
   bird.js
   pipe.js
   coin.js
   powerup.js
   shield.js
   rocket.js
   gravity.js
   portal.js
   spaceWorld.js
   features.js
```


## Dta save in the browser

The game uses `localStorage` to keep progress:
- `flappyBirdHighScore` : highest scor
- `flappybird_coins `: coin balance
- `flappybird_owned` : owned quantities (shield/power/antibomb)


To rest all progress , clear sit data / localStorage for the page.

## Notes 

-Canvas internal width is fired at 400px; height adaptes on mobile to prevent stretching
- Favicon is loaded from `assests/favicon.ico`.