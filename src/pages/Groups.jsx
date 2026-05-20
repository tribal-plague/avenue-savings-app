import { useState } from 'react'
import { Plus, Copy, Check, Users, UserPlus, LogIn, Mail, Crown, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { initials, fmtDate } from '../utils/formatters'

function GroupTypeTag({ type }) {
  const styles = { individual: 'bg-sky-50 text-sky-600', couple: 'bg-rose-50 text-rose-600', group: 'bg-violet-50 text-violet-600' }
  const labels = { individual: '👤 Individual', couple: '💑 Couple', group: '👥 Group' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] || styles.individual}`}>{labels[type] || type}</span>
}

function MemberRow({ userId, user, isAdmin, isSelf, groupAdmins, onToggleAdmin, onRemove }) {
  const isAdminMember = groupAdmins?.includes(userId)
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: user?.avatarColor || '#9ca3af' }}>
        {initials(user?.name || '?')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-avenue-dark truncate">{user?.name || 'Unknown'}{isSelf && <span className="ml-1 text-xs text-avenue-muted/70">(you)</span>}</p>
        <p className="text-xs text-avenue-muted/70 truncate">{user?.email || ''}</p>
      </div>
      {isAdminMember && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Crown size={10} />Admin</span>}
      {isAdmin && !isSelf && (
        <div className="flex gap-1">
          <button onClick={() => onToggleAdmin(userId)} className="text-xs px-2 py-1 rounded-lg border border-avenue-border text-avenue-muted hover:bg-avenue-surface transition-colors">
            {isAdminMember ? 'Demote' : 'Make admin'}
          </button>
          <button onClick={() => onRemove(userId)} className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/70 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function Groups() {
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const invites = useStore((s) => s.invites)
  const expenses = useStore((s) => s.expenses)
  const setActiveGroup = useStore((s) => s.setActiveGroup)
  const createGroup = useStore((s) => s.createGroup)
  const updateGroup = useStore((s) => s.updateGroup)
  const deleteGroup = useStore((s) => s.deleteGroup)
  const regenerateInviteCode = useStore((s) => s.regenerateInviteCode)
  const joinGroupByCode = useStore((s) => s.joinGroupByCode)
  const removeMember = useStore((s) => s.removeMember)
  const toggleAdmin = useStore((s) => s.toggleAdmin)
  const createInvite = useStore((s) => s.createInvite)
  const revokeInvite = useStore((s) => s.revokeInvite)
  const isGroupAdmin = useStore((s) => s.isGroupAdmin)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showInvite, setShowInvite] = useState(null) // groupId
  const [showManage, setShowManage] = useState(null) // groupId
  const [createForm, setCreateForm] = useState({ name: '', type: 'individual' })
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [copied, setCopied] = useState({})
  const [delConfirm, setDelConfirm] = useState(null)

  const copyCode = (code, key) => {
    navigator.clipboard.writeText(code)
    setCopied((p) => ({ ...p, [key]: true }))
    setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000)
  }

  const handleCreate = async () => {
    if (!createForm.name) return
    await createGroup(createForm.name, createForm.type)
    setShowCreate(false)
    setCreateForm({ name: '', type: 'individual' })
  }

  const handleJoin = async () => {
    setJoinError('')
    const result = await joinGroupByCode(joinCode)
    if (result.success) {
      setShowJoin(false)
      setJoinCode('')
    } else {
      setJoinError(result.message)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail) return
    await createInvite(showInvite, inviteEmail)
    setInviteSent(true)
    setInviteEmail('')
    setTimeout(() => setInviteSent(false), 3000)
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 transition-colors">
          <Plus size={16} /> New Group
        </button>
        <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 border border-avenue-border text-avenue-muted px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-surface transition-colors">
          <LogIn size={16} /> Join with Code
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const isAdmin = isGroupAdmin(group.id)
          const memberCount = group.members?.length || 0
          const expenseCount = expenses.filter((e) => e.groupId === group.id).length
          const pendingInvites = invites.filter((i) => i.groupId === group.id)
          const isActive = group.id === activeGroupId

          return (
            <div key={group.id} className={`bg-avenue-surface rounded-2xl border shadow-sm transition-all ${isActive ? 'border-avenue-dark/30' : 'border-avenue-border'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-avenue-light flex items-center justify-center text-avenue-dark font-bold text-lg flex-shrink-0">
                      {group.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-avenue-dark">{group.name}</h3>
                        {isActive && <span className="text-xs bg-avenue-light text-avenue-dark px-2 py-0.5 rounded-full font-medium">Active</span>}
                        {isAdmin && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Crown size={10} />Admin</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <GroupTypeTag type={group.type} />
                        <span className="text-xs text-avenue-muted/70">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-avenue-muted/70">{expenseCount} expenses</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isActive && (
                      <button onClick={() => setActiveGroup(group.id)} className="text-xs text-avenue-dark border border-avenue-border px-3 py-1.5 rounded-lg hover:bg-avenue-surface font-medium">
                        Switch
                      </button>
                    )}
                    <button onClick={() => setShowManage(group.id)} className="text-xs text-avenue-muted border border-avenue-border px-3 py-1.5 rounded-lg hover:bg-avenue-surface font-medium">
                      Manage
                    </button>
                  </div>
                </div>

                {/* Members row */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {(group.members || []).slice(0, 5).map((uid) => {
                      const u = users[uid]
                      return (
                        <div key={uid} title={u?.name} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: u?.avatarColor || '#9ca3af' }}>
                          {initials(u?.name || '?')}
                        </div>
                      )
                    })}
                    {memberCount > 5 && <div className="w-7 h-7 rounded-full border-2 border-white bg-avenue-light flex items-center justify-center text-xs text-avenue-muted font-medium">+{memberCount - 5}</div>}
                  </div>

                  {isAdmin && (
                    <>
                      <button onClick={() => { setShowInvite(group.id); setInviteSent(false) }}
                        className="flex items-center gap-1.5 text-xs text-avenue-dark hover:text-avenue-dark font-medium ml-2">
                        <UserPlus size={13} /> Invite
                      </button>
                      <button onClick={() => copyCode(group.inviteCode, group.id)}
                        className="flex items-center gap-1.5 text-xs text-avenue-muted hover:text-avenue-dark font-medium border border-avenue-border px-2.5 py-1 rounded-lg">
                        {copied[group.id] ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> {group.inviteCode}</>}
                      </button>
                    </>
                  )}

                  {pendingInvites.length > 0 && (
                    <span className="text-xs text-avenue-muted/70 ml-auto">{pendingInvites.length} pending invite{pendingInvites.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create group modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Group" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-avenue-muted mb-1">Group name *</label>
            <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
              placeholder="e.g. Home with Jamie" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-avenue-muted mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[['individual', '👤', 'Just me'], ['couple', '💑', 'Couple'], ['group', '👥', 'Group']].map(([val, icon, label]) => (
                <button key={val} onClick={() => setCreateForm({ ...createForm, type: val })}
                  className={`p-3 rounded-xl border text-center text-sm transition-all ${createForm.type === val ? 'border-avenue-dark/30 bg-avenue-surface text-avenue-dark font-medium' : 'border-avenue-border text-avenue-muted hover:bg-avenue-surface'}`}>
                  <div className="text-xl mb-1">{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowCreate(false)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={handleCreate} disabled={!createForm.name} className="flex-1 bg-avenue-dark text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40">
              Create group
            </button>
          </div>
        </div>
      </Modal>

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => { setShowJoin(false); setJoinError('') }} title="Join Group" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-avenue-muted mb-1">Invite code</label>
            <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40 font-mono tracking-widest ${joinError ? 'border-red-300' : 'border-avenue-border'}`}
              placeholder="AVE-XXXX" autoFocus />
            {joinError && <p className="text-xs text-red-500 mt-1">{joinError}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError('') }} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={handleJoin} disabled={joinCode.length < 4} className="flex-1 bg-avenue-dark text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40">
              Join group
            </button>
          </div>
        </div>
      </Modal>

      {/* Invite modal */}
      <Modal open={!!showInvite} onClose={() => setShowInvite(null)} title="Invite Members">
        {showInvite && (() => {
          const group = groups.find((g) => g.id === showInvite)
          const pendingInvites = invites.filter((i) => i.groupId === showInvite)
          return (
            <div className="space-y-5">
              {/* Invite code */}
              <div>
                <p className="text-xs font-medium text-avenue-muted mb-2">Share invite code</p>
                <div className="flex items-center gap-2 p-3 bg-avenue-surface rounded-xl">
                  <code className="flex-1 text-center font-mono text-lg font-bold text-avenue-dark tracking-widest">{group?.inviteCode}</code>
                  <button onClick={() => copyCode(group?.inviteCode, 'modal')} className="flex items-center gap-1.5 text-xs text-avenue-muted hover:text-avenue-dark border border-avenue-border px-3 py-1.5 rounded-lg">
                    {copied['modal'] ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <button onClick={() => regenerateInviteCode(showInvite)} className="text-xs text-avenue-muted/70 hover:text-avenue-muted mt-2">
                  Regenerate code
                </button>
              </div>

              {/* How to invite */}
              <div className="bg-avenue-bg rounded-xl p-4 border border-avenue-border">
                <p className="text-xs font-semibold text-avenue-dark mb-2">How to invite someone</p>
                <ol className="text-xs text-avenue-muted space-y-1.5 list-decimal list-inside">
                  <li>Copy the invite code above</li>
                  <li>Share it with your friend via WhatsApp, iMessage, or email</li>
                  <li>They open Avenue, click <strong className="text-avenue-dark">Join with Code</strong>, and enter it</li>
                </ol>
              </div>

              {/* Share via WhatsApp shortcut */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Join my group on Avenue! Use code: ${groups.find((g) => g.id === showInvite)?.inviteCode}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-avenue-border text-avenue-dark py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-light transition-colors">
                <span className="text-base">💬</span> Share via WhatsApp
              </a>
            </div>
          )
        })()}
      </Modal>

      {/* Manage group modal */}
      <Modal open={!!showManage} onClose={() => setShowManage(null)} title="Manage Group" size="md">
        {showManage && (() => {
          const group = groups.find((g) => g.id === showManage)
          const isAdmin = isGroupAdmin(showManage)
          if (!group) return null
          return (
            <div className="space-y-5">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-avenue-muted mb-1">Group name</label>
                  <div className="flex gap-2">
                    <input
                      defaultValue={group.name}
                      id="mgmt-name"
                      className="flex-1 border border-avenue-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
                    />
                    <button
                      onClick={() => { const el = document.getElementById('mgmt-name'); if (el) updateGroup(showManage, { name: el.value }) }}
                      className="bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-dark/90"
                    >Save</button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-avenue-muted mb-2">Members</p>
                <div className="divide-y divide-avenue-border">
                  {(group.members || []).map((uid) => (
                    <MemberRow
                      key={uid}
                      userId={uid}
                      user={users[uid]}
                      isAdmin={isAdmin}
                      isSelf={uid === currentUserId}
                      groupAdmins={group.admins}
                      onToggleAdmin={(id) => toggleAdmin(showManage, id)}
                      onRemove={(id) => removeMember(showManage, id)}
                    />
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-avenue-border">
                  <button onClick={() => { setDelConfirm(group); setShowManage(null) }} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
                    <Trash2 size={14} /> Delete group
                  </button>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Delete group confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Group" size="sm">
        {delConfirm && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">
              Permanently delete <span className="font-semibold">{delConfirm.name}</span>?
              All expenses and categories in this group will be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => { deleteGroup(delConfirm.id); setDelConfirm(null) }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
