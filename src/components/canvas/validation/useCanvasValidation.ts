import { SemanticGraph } from '@/types'

interface CanvasValidationResult {
  canRequestHint: boolean
  reason: string | null  // shown as tooltip on disabled button
}

export function useCanvasValidation(
  graph: SemanticGraph | null
): CanvasValidationResult {
  
  if (!graph || graph.nodes.length === 0) {
    return {
      canRequestHint: false,
      reason: 'Draw at least one component before asking for a hint',
    }
  }

  if (graph.unlabeledGenericCount > 0) {
    return {
      canRequestHint: false,
      reason: `Label all components before asking for a hint (${graph.unlabeledGenericCount} unlabeled shape${graph.unlabeledGenericCount > 1 ? 's' : ''})`,
    }
  }

  // Arrows without labels are NOT a blocker for hints
  // (we still flag them visually but don't gate on them)

  return {
    canRequestHint: true,
    reason: null,
  }
}
