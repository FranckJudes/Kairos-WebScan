import { useTypologyTree, useCreateTypology } from '../../hooks/useTypology'
import { useState } from 'react'
import { Plus } from 'lucide-react'

function TypologyTree({ onNodeSelect, onAssignPages, selectedNode, classifiedPages = {}, onViewPages, onReinsertPages, onDeleteNode }) {
  const { data: treeData, isLoading, error } = useTypologyTree()
  const createTypology = useCreateTypology()
  const [openNodes, setOpenNodes] = useState(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Toggle l'ouverture d'un nœud
  const toggleNode = (nodeId) => {
    setOpenNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  // Gérer la sélection d'un nœud de typologie
  const handleSelectNode = (node, e) => {
    e.stopPropagation()
    if (onNodeSelect) {
      onNodeSelect({
        id: node.id,
        text: node.name,
        data: node
      })
    }
  }

  // Gérer la sélection d'une instance
  const handleSelectInstance = (instance, nodeId, e) => {
    e.stopPropagation()
    if (onNodeSelect) {
      onNodeSelect({
        id: instance.id,
        text: instance.name,
        data: instance,
        isInstance: true,
        nodeId: nodeId
      })
    }
  }

  // Obtenir les instances pour un nœud
  const getInstancesForNode = (nodeId) => {
    const nodeData = classifiedPages[nodeId]
    if (!nodeData) return []

    const instances = []
    Object.values(nodeData).forEach(docInstances => {
      instances.push(...docInstances)
    })
    return instances
  }

  // Calculer le nombre total de pages pour un nœud
  const getNodePageCount = (node) => {
    let count = 0
    const nodeData = classifiedPages[node.id]
    if (nodeData) {
      Object.values(nodeData).forEach(instances => {
        instances.forEach(instance => {
          count += instance.pages.length
        })
      })
    }
    if (node.children) {
      node.children.forEach(child => {
        count += getNodePageCount(child)
      })
    }
    return count
  }

  // Vérifier si un nœud a des pages classées
  const hasClassifiedPages = (node) => {
    const nodeData = classifiedPages[node.id]
    const hasDirectPages = nodeData && Object.keys(nodeData).length > 0 && Object.values(nodeData).some(instances => instances.length > 0)
    if (hasDirectPages) return true
    if (node.children) {
      return node.children.some(child => hasClassifiedPages(child))
    }
    return false
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-dark-bg border-l border-[#edebe9] dark:border-dark-border">
        <div className="p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
          <h2 className="text-sm font-bold text-[#605e5c] dark:text-dark-text">Typologie des Documents</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-dark-textTertiary animate-spin">progress_activity</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-dark-bg border-l border-[#edebe9] dark:border-dark-border">
        <div className="p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
          <h2 className="text-sm font-bold text-[#605e5c] dark:text-dark-text">Typologie des Documents</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-600 dark:text-red-400">Erreur de chargement de la typologie</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-bg border-l border-[#edebe9] dark:border-dark-border">
      {/* Header */}
      <div className="p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-[#605e5c] dark:text-dark-text flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-2">account_tree</span>
            Typologie des Documents
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 rounded hover:bg-[#106EBE] dark:hover:bg-blue-600 hover:text-white text-[#106EBE] dark:text-blue-400 transition-colors"
            title="Créer une typologie"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-[#c8c6c4] dark:text-dark-textSecondary">
          Sélectionnez un dossier, puis cliquez sur "Classer les pages"
        </p>
      </div>

      {/* En-têtes de colonnes */}
      <div className="flex items-center px-3 py-2 bg-[#f3f2f1] dark:bg-dark-bgTertiary border-b border-[#edebe9] dark:border-dark-border text-[10px] font-semibold text-[#605e5c] dark:text-dark-text">
        <div className="flex-1">Type de document</div>
        <div className="w-12 text-center">Pages</div>
        <div className="w-20 text-center">Actions</div>
      </div>

      {/* Arbre */}
      <div className="flex-1 overflow-auto py-2">
        {treeData && (
          <TreeView
            nodes={treeData}
            level={0}
            openNodes={openNodes}
            onToggle={toggleNode}
            onSelectNode={handleSelectNode}
            onSelectInstance={handleSelectInstance}
            selectedId={selectedNode?.id}
            classifiedPages={classifiedPages}
            getInstancesForNode={getInstancesForNode}
            getNodePageCount={getNodePageCount}
            hasClassifiedPages={hasClassifiedPages}
            onViewPages={onViewPages}
            onReinsertPages={onReinsertPages}
            onDeleteNode={onDeleteNode}
          />
        )}
      </div>

      {/* Actions */}
      {selectedNode && (
        <div className="p-3 border-t border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
          <div className="text-[10px] text-[#605e5c] dark:text-dark-text mb-2">
            <span className="font-medium">Dossier sélectionné :</span>{' '}
            <span className="text-[#106EBE] dark:text-blue-400">{selectedNode.text}</span>
          </div>
          <button
            onClick={() => onAssignPages && onAssignPages(selectedNode)}
            className="w-full bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center justify-center space-x-2 transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            <span>Classer les pages sélectionnées</span>
          </button>
        </div>
      )}

      {/* Modal de création de typologie */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-dark-bgSecondary rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#605e5c] dark:text-dark-text">Créer une typologie</h2>
            <CreateTypologyForm
              treeData={treeData || []}
              onSubmit={(data) => {
                createTypology.mutate(data)
                setShowCreateModal(false)
              }}
              onCancel={() => setShowCreateModal(false)}
              isLoading={createTypology.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant récursif pour afficher l'arbre
function TreeView({ nodes, level, openNodes, onToggle, onSelectNode, onSelectInstance, selectedId, classifiedPages, getInstancesForNode, getNodePageCount, hasClassifiedPages, onViewPages, onReinsertPages, onDeleteNode }) {
  if (!nodes || nodes.length === 0) return null

  return (
    <div>
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          level={level}
          isOpen={openNodes.has(node.id)}
          openNodes={openNodes}
          onToggle={onToggle}
          onSelectNode={onSelectNode}
          onSelectInstance={onSelectInstance}
          isSelected={selectedId === node.id}
          selectedId={selectedId}
          classifiedPages={classifiedPages}
          getInstancesForNode={getInstancesForNode}
          getNodePageCount={getNodePageCount}
          hasClassifiedPages={hasClassifiedPages}
          onViewPages={onViewPages}
          onReinsertPages={onReinsertPages}
          onDeleteNode={onDeleteNode}
        />
      ))}
    </div>
  )
}

function TreeNode({ node, level, isOpen, openNodes, onToggle, onSelectNode, onSelectInstance, isSelected, selectedId, classifiedPages, getInstancesForNode, getNodePageCount, hasClassifiedPages, onViewPages, onReinsertPages, onDeleteNode }) {
  const hasChildren = node.children && node.children.length > 0
  const instances = getInstancesForNode(node.id)
  const hasInstances = instances.length > 0
  const pageCount = getNodePageCount(node)
  const hasPages = hasClassifiedPages(node)

  const handleClick = (e) => {
    // Si c'est un clic sur la flèche, toggle seulement
    if (e.target.closest('.toggle-arrow')) {
      onToggle(node.id)
      return
    }
    // Si c'est un clic sur une action, ne pas sélectionner
    if (e.target.closest('.action-btn')) {
      return
    }
    // Sinon, sélectionner le nœud
    onSelectNode(node, e)
  }

  return (
    <div>
      {/* Ligne du nœud de typologie */}
      <div
        onClick={handleClick}
        className={`
          flex items-center py-1.5 mx-1 rounded cursor-pointer
          hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors mb-0.5
          ${isSelected ? 'bg-[#c7e0f4] dark:bg-blue-900/30 border border-[#106EBE] dark:border-blue-400' : ''}
          ${hasPages ? 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
      >
        {/* Flèche expand/collapse */}
        {(hasChildren || hasInstances) ? (
          <span
            className={`toggle-arrow material-symbols-outlined text-[16px] mr-1 text-[#605e5c] dark:text-dark-text flex-shrink-0`}
            style={{
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s'
            }}
          >
            expand_more
          </span>
        ) : (
          <span className="w-[18px] mr-1 flex-shrink-0" />
        )}

        {/* Icône dossier/fichier */}
        <span className="material-symbols-outlined text-[18px] mr-2 text-[#605e5c] dark:text-dark-text flex-shrink-0">
          {hasPages
            ? (hasChildren ? 'folder_special' : 'description')
            : (hasChildren ? 'folder' : 'description')
          }
        </span>

        {/* Nom du nœud */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-[#323130] dark:text-dark-text truncate block font-medium">
            {node.name}
          </span>
        </div>

        {/* Compteur de pages */}
        <div className="w-12 text-center flex-shrink-0">
          {pageCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-600 dark:bg-green-700 text-white">
              {pageCount}
            </span>
          )}
        </div>

        {/* Actions - uniquement si pas d'instances ou fermé */}
        {!hasInstances || !isOpen ? (
          <div className="w-20 text-center flex-shrink-0 flex items-center justify-center gap-1">
            {pageCount > 0 ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onReinsertPages && onReinsertPages(node); }}
                  className="action-btn p-1 rounded hover:bg-[#107c10] dark:hover:bg-green-700 hover:text-white text-[#605e5c] dark:text-dark-text transition-colors"
                  title="Réinsérer tout"
                >
                  <span className="material-symbols-outlined text-[16px]">restore</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {}}
                className="action-btn p-1 rounded hover:bg-gray-300 dark:hover:bg-dark-hover text-gray-400 dark:text-dark-textTertiary transition-colors cursor-not-allowed"
                title="Aucune page"
                disabled
              >
                <span className="material-symbols-outlined text-[16px]">restore</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); if (pageCount > 0 && onDeleteNode && confirm('Supprimer toutes les pages classées ?')) onDeleteNode(node); }}
              className={`action-btn p-1 rounded transition-colors ${
                pageCount === 0
                  ? 'cursor-not-allowed text-gray-400 dark:text-dark-textTertiary'
                  : 'hover:bg-red-600 dark:hover:bg-red-700 hover:text-white text-red-600 dark:text-red-400'
              }`}
              title={pageCount === 0 ? 'Aucune page' : 'Supprimer tout'}
              disabled={pageCount === 0}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Instances de documents classées */}
      {hasInstances && isOpen && (
        <div className="mb-1">
          {instances.map(instance => (
            <InstanceNode
              key={instance.id}
              instance={instance}
              level={level + 1}
              nodeId={node.id}
              isSelected={selectedId === instance.id}
              onSelectInstance={onSelectInstance}
              onReinsertPages={onReinsertPages}
              onDeleteNode={onDeleteNode}
              onViewInstance={onViewPages}
            />
          ))}
        </div>
      )}

      {/* Enfants (récursif) - nœuds de typologie */}
      {hasChildren && isOpen && (
        <TreeView
          nodes={node.children}
          level={level + 1}
          openNodes={openNodes}
          onToggle={onToggle}
          onSelectNode={onSelectNode}
          onSelectInstance={onSelectInstance}
          selectedId={selectedId}
          classifiedPages={classifiedPages}
          getInstancesForNode={getInstancesForNode}
          getNodePageCount={getNodePageCount}
          hasClassifiedPages={hasClassifiedPages}
          onViewPages={onViewPages}
          onReinsertPages={onReinsertPages}
          onDeleteNode={onDeleteNode}
        />
      )}
    </div>
  )
}

// Composant pour afficher une instance de document classé
function InstanceNode({ instance, level, nodeId, isSelected, onSelectInstance, onReinsertPages, onDeleteNode, onViewInstance }) {
  const handleClick = (e) => {
    e.stopPropagation()
    onSelectInstance(instance, nodeId, e)
  }

  const handleView = (e) => {
    e.stopPropagation()
    if (onViewInstance) {
      onViewInstance(instance, nodeId)
    }
  }

  const handleReinsert = (e) => {
    e.stopPropagation()
    if (onReinsertPages) {
      onReinsertPages({ id: nodeId, isInstance: true, instance: instance })
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDeleteNode && confirm(`Supprimer "${instance.name}" (${instance.pages.length} pages) ?`)) {
      onDeleteNode({ id: nodeId, isInstance: true, instance: instance })
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center py-1.5 mx-1 rounded cursor-pointer
        hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors mb-0.5
        ${isSelected ? 'bg-[#c7e0f4] dark:bg-blue-900/30 border border-[#106EBE] dark:border-blue-400' : ''}
      `}
      style={{ paddingLeft: `${level * 16 + 4}px` }}
    >
      {/* Spacer pour aligner */}
      <span className="w-[18px] mr-1 flex-shrink-0" />

      {/* Icône document */}
      <span className="material-symbols-outlined text-[18px] mr-2 text-[#605e5c] dark:text-dark-text flex-shrink-0">
        description
      </span>

      {/* Nom de l'instance */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#323130] dark:text-dark-text truncate block">
          {instance.name}
        </span>
      </div>

      {/* Compteur de pages */}
      <div className="w-12 text-center flex-shrink-0">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#106EBE] dark:bg-blue-600 text-white">
          {instance.pages.length}
        </span>
      </div>

      {/* Actions */}
      <div className="w-32 text-center flex-shrink-0 flex items-center justify-center gap-1">
        <button
          onClick={handleView}
          className="action-btn p-1 rounded hover:bg-[#106EBE] dark:hover:bg-blue-600 hover:text-white text-[#605e5c] dark:text-dark-text transition-colors"
          title="Voir les pages"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
        </button>
        <button
          onClick={handleReinsert}
          className="action-btn p-1 rounded hover:bg-[#107c10] dark:hover:bg-green-700 hover:text-white text-[#605e5c] dark:text-dark-text transition-colors"
          title="Réinsérer dans la grille"
        >
          <span className="material-symbols-outlined text-[16px]">restore</span>
        </button>
        <button
          onClick={handleDelete}
          className="action-btn p-1 rounded hover:bg-red-600 dark:hover:bg-red-700 hover:text-white text-red-600 dark:text-red-400 transition-colors"
          title="Supprimer"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  )
}

// Composant Modal pour créer une typologie
function CreateTypologyForm({ treeData, onSubmit, onCancel, isLoading }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState('')
  const [type, setType] = useState('folder')

  // Aplatir l'arbre pour obtenir tous les dossiers
  const flattenTreeNodes = (nodes, depth = 0) => {
    if (!nodes) return []
    const result = []
    nodes.forEach(node => {
      result.push({
        id: node.id,
        name: node.name,
        depth: depth
      })
      if (node.children && node.children.length > 0) {
        result.push(...flattenTreeNodes(node.children, depth + 1))
      }
    })
    return result
  }

  const allFolders = flattenTreeNodes(treeData)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const data = {
      name: name.trim(),
      type: type,
      ...(code.trim() && { code: code.trim() }),
      ...(parentId && { parent_id: parseInt(parentId) }),
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-[#c8c6c4] dark:border-dark-border rounded focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
          placeholder="Ex: Factures"
          required
          autoFocus
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
          Code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 border border-[#c8c6c4] dark:border-dark-border rounded focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
          placeholder="Ex: FAC-001"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-[#c8c6c4] dark:border-dark-border rounded focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
          required
        >
          <option value="folder">📁 Dossier</option>
          <option value="document">📄 Document</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
          Dossier parent
        </label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full px-3 py-2 border border-[#c8c6c4] dark:border-dark-border rounded focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
        >
          <option value="">Racine (pas de parent)</option>
          {allFolders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {'\u00A0\u00A0'.repeat(folder.depth)}{folder.depth > 0 ? '└ ' : ''}{folder.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary mt-1">
          Sélectionnez le dossier parent ou laissez vide pour la racine
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-bgTertiary dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text rounded transition-colors font-medium disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="px-4 py-2 bg-[#106EBE] hover:bg-[#005a9e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>Création...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Créer</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default TypologyTree
