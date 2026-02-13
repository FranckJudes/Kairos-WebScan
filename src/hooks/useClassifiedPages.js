import { useMutation, useQueryClient } from '@tanstack/react-query'
import { classificationApi } from '../services/classificationApi'

/**
 * Hook pour gérer les pages classées
 * @param {Function} setStateCallback - Fonction pour mettre à jour l'état classifiedPages
 */
export const useClassifiedPages = (setStateCallback) => {
  if (!setStateCallback) {
    console.warn('useClassifiedPages: No setStateCallback provided')
  }

  const queryClient = useQueryClient()

  // Mutation pour classer des pages
  const classifyPages = useMutation({
    mutationFn: ({ nodeId, nodeName, pages }) => classificationApi.classify(nodeId, nodeName, pages),
    onSuccess: (data) => {
      // Invalider le cache pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['classification', 'pages'] })

      if (!setStateCallback) return

      // Mise à jour optimiste ou basée sur la réponse du serveur
      // La structure de réponse doit correspondre à ce qu'on attend
      // Pour l'instant, on garde la logique de mise à jour locale en attendant que le backend soit prêt
      // Si le backend renvoie la nouvelle structure complète, on pourrait l'utiliser directement

      setStateCallback((prev = {}) => {
        const nodeId = data.nodeId || data.node_id
        const nodeName = data.nodeName || data.node_name

        const currentNodeData = prev[nodeId] || {}
        const newNodeData = {}

        // Copier les entrées existantes
        Object.keys(currentNodeData).forEach(docName => {
          newNodeData[docName] = [...currentNodeData[docName]]
        })

        // Créer le tableau si n'existe pas
        if (!newNodeData[nodeName]) {
          newNodeData[nodeName] = []
        }

        // Ajouter la nouvelle instance retournée par le backend
        if (data.instance) {
          newNodeData[nodeName] = [...newNodeData[nodeName], data.instance]
        }

        return {
          ...prev,
          [nodeId]: newNodeData
        }
      })
    }
  })

  // Mutation pour réinsérer des pages
  const reinsertPages = useMutation({
    mutationFn: ({ nodeId, instanceId }) => classificationApi.reinsert(instanceId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'pages'] })

      const { nodeId, instanceId } = variables
      let pagesToReinsert = data.pages || []

      if (setStateCallback) {
        setStateCallback((prev = {}) => {
          const nodeData = prev[nodeId]
          if (!nodeData) return prev

          const newNodeData = {}

          if (instanceId) {
            // Réinsérer une instance spécifique
            Object.entries(nodeData).forEach(([docName, instances]) => {
              newNodeData[docName] = instances.filter(inst => inst.id !== instanceId)
            })

            // Nettoyer les documents vides
            Object.keys(newNodeData).forEach(docName => {
              if (newNodeData[docName].length === 0) {
                delete newNodeData[docName]
              }
            })
          } else {
            // Réinsérer toutes les pages du nœud
            // Supprimer le nœud entier
            const newState = { ...prev }
            delete newState[nodeId]
            return newState
          }

          return {
            ...prev,
            [nodeId]: Object.keys(newNodeData).length > 0 ? newNodeData : undefined
          }
        })
      }

      return pagesToReinsert
    }
  })

  // Mutation pour supprimer des instances
  const deleteInstances = useMutation({
    mutationFn: ({ nodeId, instanceIds }) => classificationApi.deleteInstances(instanceIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'pages'] })

      const { nodeId, instanceIds } = variables

      if (!setStateCallback) return

      setStateCallback((prev = {}) => {
        const nodeData = prev[nodeId]
        if (!nodeData) return prev

        if (instanceIds) {
          // Supprimer des instances spécifiques
          const newNodeData = {}
          Object.entries(nodeData).forEach(([docName, instances]) => {
            newNodeData[docName] = instances.filter(
              inst => !instanceIds.includes(inst.id)
            )
          })

          // Nettoyer les documents vides
          Object.keys(newNodeData).forEach(docName => {
            if (newNodeData[docName].length === 0) {
              delete newNodeData[docName]
            }
          })

          return {
            ...prev,
            [nodeId]: Object.keys(newNodeData).length > 0 ? newNodeData : undefined
          }
        } else {
          // Supprimer tout le nœud
          const newState = { ...prev }
          delete newState[nodeId]
          return newState
        }
      })
    }
  })

  return {
    classifyPages: (nodeId, nodeName, pages) => classifyPages.mutate({ nodeId, nodeName, pages }),
    reinsertPages: (nodeId, instanceId) => reinsertPages.mutateAsync({ nodeId, instanceId }),
    deleteInstances: (nodeId, instanceIds) => deleteInstances.mutate({ nodeId, instanceIds }),
  }
}
