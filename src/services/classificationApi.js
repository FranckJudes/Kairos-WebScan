const API_BASE_URL = import.meta.env.VITE_API_URL 

export const classificationApi = {
    /**
     * Classer des pages dans un dossier (Batch pour supporter multi-documents)
     */
    async classify(nodeId, nodeName, pages) {
        const pagesByDoc = {}
        pages.forEach(page => {
            if (!pagesByDoc[page.documentId]) {
                pagesByDoc[page.documentId] = []
            }
            pagesByDoc[page.documentId].push(page.pageNumber)
        })

        // Créer la liste des requêtes
        const classifications = Object.keys(pagesByDoc).map(docId => ({
            document_id: parseInt(docId),
            pages: pagesByDoc[docId],
            type_id: parseInt(nodeId)
        }))

        const response = await fetch(`${API_BASE_URL}/classification/batch/classify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(classifications),
        })

        if (!response.ok) {
            throw new Error('Failed to classify pages')
        }

        return response.json()
    },

    /**
     * Réinsérer une instance de pages dans la grille
     */
    async reinsert(instanceId) {
        const response = await fetch(`${API_BASE_URL}/classification/instances/${instanceId}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            throw new Error('Failed to reinsert pages')
        }

        return response.json()
    },

    /**
     * Supprimer des instances
     */
    async deleteInstances(instanceIds) {
        const response = await fetch(`${API_BASE_URL}/classification/instances/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instance_ids: instanceIds,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to delete instances')
        }

        return response.json()
    },

    /**
     * Récupérer toutes les pages classées (état actuel)
     */
    async getClassifiedPages() {
        const response = await fetch(`${API_BASE_URL}/classification/all`)
        if (!response.ok) {
            throw new Error('Failed to fetch classified pages')
        }
        return response.json()
    }
}
