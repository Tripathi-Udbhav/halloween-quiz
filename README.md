# 🎃 Haunted Potting Quiz

A live, Halloween-themed quiz. Players scan a QR code, enter their name, and answer up to 5 questions within a 2-minute timer for the whole quiz. Most correct answers wins; ties go to whoever finished faster.

- **Host screen (projector):** `https://YOUR-APP.onrender.com/host`
- **Player link (inside the QR code):** `https://YOUR-APP.onrender.com/`

## Change the questions

Edit `questions.json`. Each question looks like this:

```json
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 1
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
