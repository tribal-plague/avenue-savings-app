import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { pct } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'
import { getCategoryTotals, getMonthExpenses } from '../utils/insights'

const ICONS = ['🏠','🍔','🚗','🎬','💊','🛍️','💡','✨','📚','✈️','🎵','☕','🐾','💻','🏋️','🎮','🌿','🍷','👗','📱','🏖️','🎁','💳','🔧']
const COLORS = ['#6366f1','#f97316','#0ea5e9','#a855f7','#10b981','#ec4899','#f59e0b','#14b8a6','#ef4444','#84cc16','#06b6d4','#8b5cf6']

function CategoryForm({ initial, onSave, onCancel }) {
  const { fmt } = useCurrency()
  const [form, setForm] = useState({
    name: initial?.name || '',
    icon: initial?.icon || '📦',
    color: initial?.color || COLORS[0],
    budget: initial?.budget || '',
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          placeholder="e.g. Subscriptions"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Monthly budget</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-avenue-muted/70 text-sm">$</span>
          <input
            type="number"
            min="0"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full border border-avenue-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-2">Icon</label>
        <div className="grid grid-cols-8 gap-1.5">
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setForm({ ...form, icon: ic })}
              className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${form.icon === ic ? 'bg-avenue-light ring-2 ring-avenue-dark' : 'hover:bg-avenue-light'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-avenue-surface rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: form.color + '20' }}>
          {form.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-avenue-dark">{form.name || 'Category name'}</p>
          <p className="text-xs text-avenue-muted/70">{form.budget ? fmt(form.budget) + ' / mo' : 'No budget set'}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: form.color + '20', color: form.color }}>
            Preview
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-surface">
          Cancel
        </button>
        <button
          disabled={!form.name}
          onClick={() => onSave({ ...form, budget: parseFloat(form.budget) || 0 })}
          className="flex-1 bg-avenue-dark text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40"
        >
          {initial ? 'Save' : 'Create category'}
        </button>
      </div>
    </div>
  )
}

export default function Categories() {
  const { fmt } = useCurrency()
  const currentUserId = useStore((s) => s.currentUserId)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.getGroupCategories(activeGroupId))
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  const now = new Date()
  const monthExpenses = getMonthExpenses(
    expenses.filter((e) => e.groupId === activeGroupId),
    now.getFullYear(), now.getMonth()
  )
  const catTotals = getCategoryTotals(monthExpenses, categories)
  const totalBudget = categories.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalSpent = catTotals.reduce((acc, c) => acc + c.spent, 0)

  const handleAdd = (form) => {
    addCategory({ ...form, groupId: activeGroupId })
    setShowAdd(false)
  }
  const handleEdit = (form) => {
    updateCategory(editing.id, form)
    setEditing(null)
  }
  const handleDelete = (id) => {
    deleteCategory(id)
    setDelConfirm(null)
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-avenue-muted/70">
            {categories.length} categories · Total budget: {fmt(totalBudget)} · Spent this month: {fmt(totalSpent)}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 transition-colors"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-avenue-muted/70">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-medium text-avenue-muted">No categories yet</p>
          <p className="text-sm mt-1">Create your first category to organize expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catTotals.map((cat) => {
            const pctUsed = Math.min(100, pct(cat.spent, cat.budget))
            const over = cat.over > 0
            const barColor = over ? '#ef4444' : pctUsed > 80 ? '#f59e0b' : cat.color
            return (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color + '18' }}>
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-avenue-dark">{cat.name}</p>
                      <p className="text-xs text-avenue-muted/70">Budget: {fmt(cat.budget)}/mo</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(cat)} className="p-1.5 rounded-lg hover:bg-avenue-light text-avenue-muted/70 hover:text-avenue-dark transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDelConfirm(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/70 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-avenue-muted">Spent this month</span>
                    <span className={`font-semibold ${over ? 'text-red-500' : 'text-avenue-dark'}`}>{fmt(cat.spent)}</span>
                  </div>
                  {cat.budget > 0 && (
                    <>
                      <div className="h-2 bg-avenue-light rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctUsed}%`, backgroundColor: barColor }} />
                      </div>
                      <div className="flex justify-between text-xs text-avenue-muted/70">
                        <span>{pctUsed}% used</span>
                        {over ? (
                          <span className="text-red-500 font-medium">{fmt(cat.over)} over</span>
                        ) : (
                          <span className="text-emerald-500 font-medium">{fmt(cat.remaining)} left</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Category">
        <CategoryForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Category">
        {editing && <CategoryForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Category" size="sm">
        {delConfirm && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">
              Delete <span className="font-semibold">{delConfirm.icon} {delConfirm.name}</span>?
              Existing expenses will become uncategorized.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleDelete(delConfirm.id)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
