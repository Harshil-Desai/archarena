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

  const trulyUnlabeled = graph.nodes.filter((node) => {
    if (node.category === 'generic') {
      // Generic shapes MUST have a user-provided label
      return !node.label || node.label.trim() === ''
    }
    // Vendor shapes: empty label is fine (vendor name is sufficient)
    return false
  })

  if (trulyUnlabeled.length > 0) {
    return {
      canRequestHint: false,
      reason: `Label all components before asking for a hint (${trulyUnlabeled.length} unlabeled)`,
    }
  }

  // Arrows without labels are NOT a blocker for hints
  // (we still flag them visually but don't gate on them)

  return {
    canRequestHint: true,
    reason: null,
  }
}
