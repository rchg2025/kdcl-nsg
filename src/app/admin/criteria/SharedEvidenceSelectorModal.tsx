"use client"

import { useState, useMemo } from "react"
import { Search, X, Check, Link2 } from "lucide-react"

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
  const [searchProgram, setSearchProgram] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)

  const [selectedStandardId, setSelectedStandardId] = useState<string | "">("")
  const [searchStandard, setSearchStandard] = useState("")
  const [showStandardDropdown, setShowStandardDropdown] = useState(false)

  const [selectedCriterionId, setSelectedCriterionId] = useState<string | "">("")
  const [searchCriterion, setSearchCriterion] = useState("")
  const [showCriterionDropdown, setShowCriterionDropdown] = useState(false)

  const [selectedEvidenceItemId, setSelectedEvidenceItemId] = useState<string | "">("")
  const [searchItem, setSearchItem] = useState("")
  const [showItemDropdown, setShowItemDropdown] = useState(false)

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-visible animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Link2 size={20} className="text-indigo-500" />
            Chọn nguồn Minh chứng Dùng chung
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Chọn Năm</label>
              <select 
                value={selectedYear} 
                onChange={e => { 
                  setSelectedYear(e.target.value ? Number(e.target.value) : "");
                  setSelectedType("");
                  setSelectedProgramId(""); setSearchProgram("");
                  setSelectedStandardId(""); setSearchStandard("");
                  setSelectedCriterionId(""); setSearchCriterion("");
                  setSelectedEvidenceItemId(""); setSearchItem("");
                }}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl outline-none text-sm focus:border-[var(--primary)]"
              >
                <option value="">-- Tất cả Năm --</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Loại Kiểm định</label>
              <select 
                value={selectedType} 
                onChange={e => { 
                  setSelectedType(e.target.value);
                  setSelectedProgramId(""); setSearchProgram("");
                  setSelectedStandardId(""); setSearchStandard("");
                  setSelectedCriterionId(""); setSearchCriterion("");
                  setSelectedEvidenceItemId(""); setSearchItem("");
                }}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:border-[var(--primary)]"
              >
                <option value="">-- Tất cả Loại --</option>
                <option value="INSTITUTIONAL">Kiểm định Trường</option>
                <option value="PROGRAM">Kiểm định Ngành đào tạo</option>
              </select>
            </div>
            
            {selectedType === "PROGRAM" && (
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2">Chọn Ngành học</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchProgram}
                    onChange={e => { 
                      setSearchProgram(e.target.value); 
                      setSelectedProgramId("");
                      setSelectedStandardId(""); setSearchStandard("");
                      setSelectedCriterionId(""); setSearchCriterion("");
                      setSelectedEvidenceItemId(""); setSearchItem("");
                      setShowProgramDropdown(true);
                    }}
                    onFocus={() => setShowProgramDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                    placeholder="Gõ tên ngành học để tìm kiếm..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm"
                  />
                  {showProgramDropdown && (
                    <div className="absolute z-[110] w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                      {availablePrograms.filter(p => p.name.toLowerCase().includes(searchProgram.toLowerCase())).length === 0 ? (
                        <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành</div>
                      ) : (
                        availablePrograms.filter(p => p.name.toLowerCase().includes(searchProgram.toLowerCase())).map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => { 
                              setSelectedProgramId(p.id); 
                              setSearchProgram(p.name);
                              setShowProgramDropdown(false);
                            }}
                            className="p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            {p.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">1. Chọn tiêu chí</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchStandard}
                  onChange={e => { 
                    setSearchStandard(e.target.value); 
                    setSelectedStandardId("");
                    setSelectedCriterionId(""); setSearchCriterion("");
                    setSelectedEvidenceItemId(""); setSearchItem("");
                    setShowStandardDropdown(true);
                  }}
                  onFocus={() => setShowStandardDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStandardDropdown(false), 200)}
                  placeholder="Gõ từ khóa để tìm tiêu chí..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm"
                />
                {showStandardDropdown && (
                  <div className="absolute z-[110] w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                    {availableStandards.filter(s => s.name.toLowerCase().includes(searchStandard.toLowerCase())).length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chí</div>
                    ) : (
                      availableStandards.filter(s => s.name.toLowerCase().includes(searchStandard.toLowerCase())).map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => { 
                            setSelectedStandardId(s.id); 
                            setSearchStandard(`${s.year} - ${s.name}`); 
                            setShowStandardDropdown(false);
                          }}
                          className="p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {s.year} - {s.name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">2. Chọn Tiêu chuẩn</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchCriterion}
                  onChange={e => { 
                    setSearchCriterion(e.target.value); 
                    setSelectedCriterionId("");
                    setSelectedEvidenceItemId(""); setSearchItem("");
                    setShowCriterionDropdown(true);
                  }}
                  onFocus={() => setShowCriterionDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCriterionDropdown(false), 200)}
                  placeholder={selectedStandardId ? "Gõ từ khóa để tìm tiêu chuẩn..." : "Vui lòng chọn tiêu chí trước"}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                  disabled={!selectedStandardId}
                />
                {showCriterionDropdown && selectedStandardId && (
                  <div className="absolute z-[110] w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                    {availableCriteria.filter(c => c.name.toLowerCase().includes(searchCriterion.toLowerCase())).length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy tiêu chuẩn</div>
                    ) : (
                      availableCriteria.filter(c => c.name.toLowerCase().includes(searchCriterion.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { 
                            setSelectedCriterionId(c.id); 
                            setSearchCriterion(c.name); 
                            setShowCriterionDropdown(false);
                          }}
                          className="p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {c.name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">3. Chọn danh mục minh chứng</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchItem}
                onChange={e => {
                  setSearchItem(e.target.value);
                  setSelectedEvidenceItemId("");
                  setShowItemDropdown(true);
                }}
                onFocus={() => setShowItemDropdown(true)}
                onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                placeholder={selectedCriterionId ? "Gõ từ khóa để tìm phân loại/danh mục..." : "Vui lòng chọn tiêu chuẩn trước"}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                disabled={!selectedCriterionId}
              />
              {showItemDropdown && selectedCriterionId && (
                <div className="absolute z-[110] w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {availableItems.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy danh mục phù hợp</div>
                  ) : (
                    availableItems.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase())).map(i => (
                      <div 
                        key={i.id} 
                        onClick={() => { 
                          setSelectedEvidenceItemId(i.id); 
                          setSearchItem(i.name); 
                          setShowItemDropdown(false);
                        }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${selectedEvidenceItemId === i.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                      >
                        {i.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedCriterionId && <p className="text-xs text-slate-500 mt-2 pl-1 italic">Vui lòng chọn mục minh chứng dùng chung phù hợp nhất.</p>}
          </div>

        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
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
