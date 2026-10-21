# 🎃 Haunted Potting Quiz

A live, Halloween-themed quiz. Players scan a QR code, enter their name, and answer up to 5 questions within a 2-minute timer for the whole quiz. Most correct answers wins; ties go to whoever finished faster.

- **Host screen (projector):** `https://YOUR-APP.onrender.com/host`
- **Player link (inside the QR code):** `https://YOUR-APP.onrender.com/`

## What's on screen

- A purple-and-black haunted night: moon, stars, fog, graveyard, bats, a haunted house, a witch on her broomstick, a mummy, a zombie, zombie hands rising from the graves, and Frankenstein walking slowly while players wait. The character artwork lives in `public/img` (frank.webp, mummy.webp, witch.webp, zombie.webp, with transparent backgrounds). Replace a file with another of the same name to swap a character.
- The witch flies out of the haunted house's attic window, circles the sky, and flies back in.
- On the phones' waiting screens the characters walk in front of the card, so they're always visible.
- Every character reacts when tapped:
  - **Frankenstein** hurls lightning bolts at the viewer, cracking the "glass".
  - **The mummy** grows huge and lunges out of the screen.
  - **The zombie** dances big on screen under disco lights and a glitter ball.
  - **The witch** does a loop and releases a swarm of bats.
  - **The haunted house** shakes, its lights flicker and bats pour out.
  - **Bats** burst into purple smoke, **pumpkins** erupt in embers, and **zombie hands** sink back into the dirt.
- An evil "MWA-HA-HA-HA!" moment with lightning when a player joins.
- Results: tombstones rise from the graves (3rd, 2nd, then 1st with a crown), then the "Book of the Dead" leaderboard. Each phone shows a personal tombstone with a ghoulish title and one pumpkin lit per correct answer.
- **📜 Reveal the Answers** (on the host results screen): steps through each question, shows what percentage of the room picked each option, highlights the correct answer, and shows the explanation from `questions.json`. Arrow keys and presentation clickers work.
- **⬇ Results with emails** (on the host results screen) downloads a spreadsheet (CSV) of rank, name, email, score and time, so you can contact the winners. Emails are never shown on the projector.
- The quiz has no sound.

## Joining: name + email

Players must enter their name and a valid email address. Each email can only be one player: entering the same email again (on another phone, for example) reconnects to the same player instead of creating a second entry.

To only allow company emails, add an environment variable on Render: `ALLOWED_EMAIL_DOMAINS` = `henkel.com` (separate several domains with commas). Without it, any valid email address is accepted.

## Change the questions

Edit `questions.json`. Each question looks like this:

```json
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 1,
  "explanation": "Shown on the projector when you reveal the answers."
}
```

`answer` is the **position** of the correct option, **counting from 0** (0 = first option, 1 = second, …). Only the first 5 questions are used. Questions are re-read every time you press **Start**.

## Change the timer

The default is 120 seconds. On Render, open your service → **Environment** → add `QUIZ_SECONDS` with the new value (for example `180`). Or change the default at the top of `server.js`.

## Optional: lock the host screen

Add an environment variable `HOST_KEY` (for example `pumpkin42`). The host screen then only works at `/host?key=pumpkin42`, so participants can't press Start.

## Run on your own computer

```bash
npm install
npm start
# open http://localhost:3000/host
```

## Deploy on Render (free)

1. Sign in at https://render.com with GitHub.
2. **New → Web Service** → pick this repository.
3. Runtime **Node**, build command `npm install`, start command `npm start`, instance type **Free**.
4. Click **Create Web Service**. After about 2 minutes you get a URL like `https://halloween-quiz.onrender.com`.

Free services go to sleep after 15 minutes without visitors. **Open the `/host` page a couple of minutes before your session** so it's awake when people scan.

## On the day

1. Open `/host` on the projector. If the quiz was used before, press **Clear players**.
2. People scan the QR code and enter their names, which appear on screen.
3. Press **Start the Quiz**. Everyone gets the questions at the same moment.
4. The quiz ends when time runs out, when everyone has finished, or when you press **End Quiz Now**.
5. The podium reveals 3rd, 2nd, then 1st, followed by the full leaderboard. Each phone shows that person's rank.

Note: results are kept in memory. If the server restarts during the session, the players need to rejoin.
