export default function AdminUsersTab({ users }) {
  if (users.length === 0)
    return <p className="text-center text-slate-400 py-8">No users yet</p>;

  return (
    <ul className="flex flex-col gap-3">
      {users.map((u) => (
        <li key={u.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
              {u.name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-800 text-sm">{u.name}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!u.verified && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">unverified</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
            }`}>
              {u.role}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
