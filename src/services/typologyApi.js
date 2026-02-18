const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const typologyApi = {
  /**
   * Récupère l'arbre de typologie complet
   */
  async getTree() {
    const response = await fetch(`${API_BASE_URL}/typology/tree`)
    if (!response.ok) {
      throw new Error('Failed to fetch typology tree')
    }
    return response.json()
  },

  /**
   * Convertit les données du backend en format jstree (pour le cache)
   */
  convertToJsTreeQueryFormat(types) {
    return types.map(type => {
      // Déterminer si ce nœud a des enfants
      const hasChildren = types.some(t => t.parent_id === type.id)

      const node = {
        id: type.id.toString(),
        text: type.name,
        parent: type.parent_id ? type.parent_id.toString() : '#',
        state: { opened: true } // Ouvrir les dossiers par défaut
      }

      if (hasChildren) {
        node.children = true // Dit à jstree que c'est un dossier
      }

      return node
    })
  },

  /**
   * Convertit les données du backend en format jstree
   */
  convertToJsTreeFormat(types) {
    return types.map(type => {
      const hasChildren = types.some(t => t.parent_id === type.id)

      const node = {
        id: type.id.toString(),
        text: type.name,
        parent: type.parent_id ? type.parent_id.toString() : '#',
        state: { opened: true } // Ouvrir les dossiers par défaut
      }

      if (hasChildren) {
        node.children = true // Dit à jstree que c'est un dossier
      }

      return node
    })
  },

  /**
   * Convertit les données plates en format hiérarchique pour react-arborist
   */
  convertToTreeFormat(types) {
    // Créer une Map pour un accès rapide
    const typeMap = new Map()
    types.forEach(type => {
      typeMap.set(type.id, {
        id: type.id,
        name: type.name,
        code: type.code,
        children: []
      })
    })

    const rootNodes = []
    types.forEach(type => {
      const node = typeMap.get(type.id)
      if (type.parent_id === null) {
        rootNodes.push(node)
      } else {
        const parent = typeMap.get(type.parent_id)
        if (parent) {
          parent.children.push(node)
        }
      }
    })

    return rootNodes
  },

  /**
   * Initialise la typologie (si nécessaire)
   */
  async initialize() {
    const response = await fetch(`${API_BASE_URL}/typology/initialize`)
    if (!response.ok) {
      throw new Error('Failed to initialize typology')
    }
    return response.json()
  },

  /**
   * Crée un nouveau nœud de typologie
   */
  async createNode(data) {
    const response = await fetch(`${API_BASE_URL}/typology/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create typology node')
    }
    return response.json()
  }
}
