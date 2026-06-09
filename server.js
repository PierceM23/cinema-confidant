require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.static('.'))

app.use(express.json())

app.post('/recommend', async (req, res) => {
  const { vibe, history, seenFilms } = req.body

  const seenList = seenFilms && seenFilms.length > 0
    ? `Films already recommended (never repeat): ${seenFilms.join(', ')}`
    : ' '

  const systemPrompt = `You are Cinema Confidant — a film concierge with the taste of the greatest minds in cinema history. You decode the emotional and atmospheric DNA of any input and find films that carry the same resonance. A user who says "Nirvana and autumn" is not asking for a movie with a Nirvana soundtrack — they want something raw, melancholic, textured, and alive.

Rules:
- Give exactly 10 recommendations per query
- Never repeat a film already recommended
- Obscure films are your default; mainstream films only if they genuinely belong
- Every recommendation must span different eras, countries, and genres
- End with one question to refine the next search
- The user should finish reading and think "I never would have found this myself"

Respond ONLY with valid JSON, no markdown fences, no preamble:
{
  "vibeEcho": "6-10 word poetic echo of what you decoded",
  "films": [
    {
      "title": "Film Title",
      "year": 1974,
      "director": "Director Name",
      "what": "One sentence: what the film is.",
      "why": "One sentence: exactly which part of the vibe it matches and why."
    }
  ],
  "closingQuestion": "One question to refine the next search."
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: vibe + seenList }]
      })
    })

    const data = await response.json()
    console.log('API response:', JSON.stringify (data))
    const raw = data.content[0].text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(raw)
    res.json(parsed)
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})






            