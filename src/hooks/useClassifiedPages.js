import { useMutation } from '@tanstack/react-query'

/**
 * Hook pour gérer les pages classées
 * @param {Function} setStateCallback - Fonction pour mettre à jour l'état classifiedPages
 */
export const useClassifiedPages = (setStateCallback) => {
  if (!setStateCallback) {
    console.warn('useClassifiedPages: No setStateCallback provided')
  }

  // Mutation pour classer des pages
  const classifyPages = useMutation({
    mutationFn: ({ nodeId, nodeName, pages }) => Promise.resolve({ nodeId, nodeName, pages }),
    onSuccess: ({ nodeId, nodeName, pages }) => {
      if (!setStateCallback) return

      setStateCallback((prev = {}) => {
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

        // Compter les instances existantes
        const existingInstances = newNodeData[nodeName].filter(
          inst => inst.originalName === nodeName
        )
        const instanceNumber = existingInstances.length + 1

        // Générer le nom de l'instance
        const instanceName = instanceNumber === 1
          ? nodeName
          : `${nodeName} (${instanceNumber})`

        // Créer la nouvelle instance
        const newInstance = {
          id: `${nodeId}-${nodeName}-${instanceNumber}-${Date.now()}`,
          name: instanceName,
          originalName: nodeName,
          typologyName: nodeName,
          pages: pages,
          sourceDocuments: [...new Set(pages.map(p => p.documentName))],
          createdAt: new Date().toISOString()
        }

        newNodeData[nodeName] = [...newNodeData[nodeName], newInstance]

        return {
          ...prev,
          [nodeId]: newNodeData
        }
      })
    }
  })

  // Mutation pour réinsérer des pages
  const reinsertPages = useMutation({
    mutationFn: ({ nodeId, instanceId }) => {
      let pagesToReinsert = []

      setStateCallback((prev = {}) => {
        const nodeData = prev[nodeId]
        if (!nodeData) return prev

        const newNodeData = {}

        if (instanceId) {
          // Réinsérer une instance spécifique
          Object.entries(nodeData).forEach(([docName, instances]) => {
            const instance = instances.find(inst => inst.id === instanceId)
            if (instance) {
              pagesToReinsert = [...instance.pages]
            }
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
          Object.values(nodeData).forEach(instances => {
            instances.forEach(instance => {
              pagesToReinsert = [...pagesToReinsert, ...instance.pages]
            })
          })

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

      return Promise.resolve(pagesToReinsert)
    }
  })

  // Mutation pour supprimer des instances
  const deleteInstances = useMutation({
    mutationFn: ({ nodeId, instanceIds }) => Promise.resolve({ nodeId, instanceIds }),
    onSuccess: ({ nodeId, instanceIds }) => {
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
