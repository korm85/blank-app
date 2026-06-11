import type { BetResult } from '@/types'

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): { points: number; result: BetResult } {
  // Exact score
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: 10, result: 'exact' }
  }

  const predictedDiff = predictedHome - predictedAway
  const actualDiff = actualHome - actualAway

  const predictedResult = Math.sign(predictedDiff)
  const actualResult = Math.sign(actualDiff)

  if (predictedResult !== actualResult) {
    return { points: 0, result: 'wrong' }
  }

  // Correct result + correct goal difference
  if (predictedDiff === actualDiff) {
    return { points: 7, result: 'correct_result_diff' }
  }

  // Correct result only
  return { points: 3, result: 'correct_result' }
}

export function getBetResultLabel(result: BetResult): string {
  switch (result) {
    case 'exact': return '🎯 Exact!'
    case 'correct_result_diff': return '🔥 Diff!'
    case 'correct_result': return '✓ Result'
    case 'wrong': return '✗ Wrong'
    case 'pending': return '⏳ Pending'
  }
}

export function getBetResultColor(result: BetResult): string {
  switch (result) {
    case 'exact': return 'text-green-400'
    case 'correct_result_diff': return 'text-yellow-400'
    case 'correct_result': return 'text-blue-400'
    case 'wrong': return 'text-red-400'
    case 'pending': return 'text-gray-400'
  }
}
