import { NextResponse } from 'next/server'

export async function GET() {
  const username = process.env.GITHUB_USERNAME
  const token = process.env.GITHUB_TOKEN

  const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
        repositories(last: 5, orderBy: { field: UPDATED_AT, direction: DESC }) {
          nodes {
            name
            url
            pushedAt
          }
        }
      }
    }
  `

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const data = await response.json()
  return NextResponse.json(data)
}