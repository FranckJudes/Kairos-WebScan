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

  const classifyPages = useMutation({
    mutationFn: ({ nodeId, nodeName, pages }) => classificationApi.classify(nodeId, nodeName, pages),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'pages'] })

      if (!setStateCallback) return


      setStateCallback((prev = {}) => {
        const nodeId = data.nodeId || data.node_id
        const nodeName = data.nodeName || data.node_name

        const currentNodeData = prev[nodeId] || {}
        const newNodeData = {}

        Object.keys(currentNodeData).forEach(docName => {
          newNodeData[docName] = [...currentNodeData[docName]]
        })

        if (!newNodeData[nodeName]) {
          newNodeData[nodeName] = []
        }

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
            Object.entries(nodeData).forEach(([docName, instances]) => {
              newNodeData[docName] = instances.filter(inst => inst.id !== instanceId)
            })

            Object.keys(newNodeData).forEach(docName => {
              if (newNodeData[docName].length === 0) {
                delete newNodeData[docName]
              }
            })
          } else {
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
          const newNodeData = {}
          Object.entries(nodeData).forEach(([docName, instances]) => {
            newNodeData[docName] = instances.filter(
              inst => !instanceIds.includes(inst.id)
            )
          })

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
