"use client"

import { useState, useMemo } from "react"
import { Search, X, Check, Filter } from "lucide-react"

type SharedEvidenceSelectorModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (id: string, name: string) => void
  allEvidenceItems: any[]
  initialPrograms: any[]
  excludeItemId?: string
}

export default function SharedEvidenceSelectorModal({
  isOpen,
  onClose,
  onSelect,
  allEvidenceItems,
  initialPrograms,
  excludeItemId
}: SharedEvidenceSelectorModalProps) {
  const [selectedYear, setSelectedYear] = useState<number | "">("")
  const [selectedType, setSelectedType] = useState<string | "">("")
  const [selectedProgramId, setSelectedProgramId] = useState<string | "">("")
  const [selectedStandardId, setSelectedStandardId] = useState<string | "">("")
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | "">("")
  const [selectedEvidenceItemId, setSelectedEvidenceItemId] = useState<string | "">("")

  // Search states
  const [searchProgram, setSearchProgram] = useState("")
  const [searchStandard, setSearchStandard] = useState("")
  const [searchCriterion, setSearchCriterion] = useState("")
  const [searchItem, setSearchItem] = useState("")

  const validItems = useMemo(() => {
    return allEvidenceItems.filter(item => item.id !== excludeItemId)
  }, [allEvidenceItems, excludeItemId])

  // Derive options
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    validItems.forEach(i => years.add(i.criterion.standard.year))
    return Array.from(years).sort((a, b) => b - a)
  }, [validItems])

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    validItems.forEach(i => {
      if (selectedYear === "" || i.criterion.standard.year === selectedYear) {
        types.add(i.criterion.standard.type || "INSTITUTIONAL")
      }
    })
    return Array.from(types)
  }, [validItems, selectedYear])

  const availablePrograms = useMemo(() => {
    if (selectedType !== "PROGRAM") return []
    const pIds = new Set<string>()
    validItems.forEach(i => {
      if (
        (selectedYear === "" || i.criterion.standard.year === selectedYear) &&
        (i.criterion.standard.type === "PROGRAM")
      ) {
        if (i.criterion.standard.programId) pIds.add(i.criterion.standard.programId)
      }
    })
    return initialPrograms.filter(p => pIds.has(p.id))
  }, [validItems, selectedYear, selectedType, initialPrograms])

  const availableStandards = useMemo(() => {
    const stds = new Map<string, any>()
    validItems.forEach(i => {
      if (selectedYear !== "" && i.criterion.standard.year !== selectedYear) return
      if (selectedType !== "" && (i.criterion.standard.type || "INSTITUTIONAL") !== selectedType) return
      if (selectedType === "PROGRAM" && selectedProgramId !== "" && i.criterion.standard.programId !== selectedProgramId) return
      
      stds.set(i.criterion.standard.id, i.criterion.standard)
    })
    return Array.from(stds.values())
  }, [validItems, selectedYear, selectedType, selectedProgramId])

  const availableCriteria = useMemo(() => {
    if (!selectedStandardId) return []
    const crits = new Map<string, any>()
    validItems.forEach(i => {
      if (i.criterion.standard.id === selectedStandardId) {
        crits.set(i.criterion.id, i.criterion)
      }
    })
    return Array.from(crits.values())
  }, [validItems, selectedStandardId])

  const availableItems = useMemo(() => {
    if (!selectedCriterionId) return []
    return validItems.filter(i => i.criterion.id === selectedCriterionId)
  }, [validItems, selectedCriterionId])

  if (!isOpen) return null

  const handleSelect = () => {
    if (!selectedEvidenceItemId) return
    const item = availableItems.find(i => i.id === selectedEvidenceItemId)
    if (item) {
      onSelect(item.id, `${item.criterion.standard.name} (${item.criterion.standard.year}) - ${item.criterion.name} - ${item.name}`)
    }
  }

  const resetFrom = (level: number) => {
    if (level <= 1) setSelectedType("")
    if (level <= 2) { setSelectedProgramId(""); setSearchProgram(""); }
    if (level <= 3) { setSelectedStandardId(""); setSearchStandard(""); }
    if (level <= 4) { setSelectedCriterionId(""); setSearchCriterion(""); }
    if (level <= 5) { setSelectedEvidenceItemId(""); setSearchItem(""); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Filter size={20} className="text-[var(--primary)]" />
            Chọn nguồn Minh chứng Dùng chung
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Chọn Năm */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Chọn Năm áp dụng</label>
              <select 
                value={selectedYear} 
                onChange={e => { setSelectedYear(e.target.value ? Number(e.target.value) : ""); resetFrom(1); }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm"
              >
                <option value="">-- Tất cả Năm --</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* 2. Loại Kiểm định */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Loại kiểm định</label>
              <select 
                value={selectedType} 
                onChange={e => { setSelectedType(e.target.value); resetFrom(2); }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm disabled:opacity-50"
              >
                <option value="">-- Tất cả Loại --</option>
                {availableTypes.includes("INSTITUTIONAL") && <option value="INSTITUTIONAL">Kiểm định Trường</option>}
                {availableTypes.includes("PROGRAM") && <option value="PROGRAM">Kiểm định Ngành đào tạo</option>}
              </select>
            </div>
          </div>

          {/* 3. Chọn Ngành (If PROGRAM) */}
          {selectedType === "PROGRAM" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">3. Chọn Ngành học</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchProgram}
                  onChange={e => { setSearchProgram(e.target.value); setSelectedProgramId(""); resetFrom(3); }}
                  placeholder="Tra cứu ngành học..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm"
                />
              </div>
              {searchProgram && !selectedProgramId && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                  {availablePrograms.filter(p => p.name.toLowerCase().includes(searchProgram.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center bg-white dark:bg-slate-900">Không tìm thấy</div>
                  ) : (
                    availablePrograms.filter(p => p.name.toLowerCase().includes(searchProgram.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => { setSelectedProgramId(p.id); setSearchProgram(p.name); resetFrom(3); }}
                        className="px-4 py-2 text-sm bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer"
                      >
                        {p.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Chọn Tiêu chí (Standard) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {selectedType === "PROGRAM" ? "4" : "3"}. Chọn Tiêu chí
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchStandard}
                onChange={e => { setSearchStandard(e.target.value); setSelectedStandardId(""); resetFrom(4); }}
                placeholder="Tra cứu tiêu chí (Standard)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm"
              />
            </div>
            {searchStandard && !selectedStandardId && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                {availableStandards.filter(s => s.name.toLowerCase().includes(searchStandard.toLowerCase())).length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center bg-white dark:bg-slate-900">Không tìm thấy</div>
                ) : (
                  availableStandards.filter(s => s.name.toLowerCase().includes(searchStandard.toLowerCase())).map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { setSelectedStandardId(s.id); setSearchStandard(`${s.name} (${s.year})`); resetFrom(4); }}
                      className="px-4 py-2 text-sm bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer"
                    >
                      {s.name} <span className="text-xs text-slate-500 ml-1">({s.year})</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 5. Chọn Tiêu chuẩn (Criterion) */}
          {selectedStandardId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {selectedType === "PROGRAM" ? "5" : "4"}. Chọn Tiêu chuẩn
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchCriterion}
                  onChange={e => { setSearchCriterion(e.target.value); setSelectedCriterionId(""); resetFrom(5); }}
                  placeholder="Tra cứu tiêu chuẩn (Criterion)..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] text-sm"
                />
              </div>
              {searchCriterion && !selectedCriterionId && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                  {availableCriteria.filter(c => c.name.toLowerCase().includes(searchCriterion.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center bg-white dark:bg-slate-900">Không tìm thấy</div>
                  ) : (
                    availableCriteria.filter(c => c.name.toLowerCase().includes(searchCriterion.toLowerCase())).map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedCriterionId(c.id); setSearchCriterion(c.name); resetFrom(5); }}
                        className="px-4 py-2 text-sm bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer"
                      >
                        {c.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. Chọn Danh mục Minh chứng (EvidenceItem) */}
          {selectedCriterionId && (
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3">
                {selectedType === "PROGRAM" ? "6" : "5"}. Chọn Danh mục Minh chứng cuối cùng
              </label>
              
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                  placeholder="Lọc danh mục minh chứng..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[var(--primary)] text-sm"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableItems.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase())).length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center italic">Không có danh mục nào phù hợp</div>
                ) : (
                  availableItems.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase())).map(i => (
                    <div 
                      key={i.id} 
                      onClick={() => setSelectedEvidenceItemId(i.id)}
                      className={`p-3 text-sm rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                        selectedEvidenceItemId === i.id 
                          ? 'bg-white dark:bg-slate-800 border-[var(--primary)] shadow-sm' 
                          : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedEvidenceItemId === i.id ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {selectedEvidenceItemId === i.id && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className={`font-semibold ${selectedEvidenceItemId === i.id ? 'text-[var(--primary)]' : 'text-slate-700 dark:text-slate-300'}`}>{i.name}</div>
                        {i.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{i.description}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Đóng
          </button>
          <button 
            onClick={handleSelect}
            disabled={!selectedEvidenceItemId}
            className="px-5 py-2.5 rounded-xl font-medium text-sm bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check size={16} /> Xác nhận Chọn
          </button>
        </div>
      </div>
    </div>
  )
}
